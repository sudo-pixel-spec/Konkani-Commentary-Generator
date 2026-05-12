"""
pipeline.py - Core 3-stage AI pipeline.
Stage 1: STT  - faster-whisper extracts English segments from video
Stage 2: TL   - Gemma 3 4B translates each segment to Konkani
Stage 3: TTS  - Indic Parler-TTS synthesises Konkani audio per segment
"""

import os
import gc
import torch
import logging
import subprocess
import numpy as np
import soundfile as sf
from typing import Callable, Optional
from pathlib import Path

from models import (
    load_whisper, unload_whisper,
    load_translation, unload_translation,
    DEVICE,
)

logger = logging.getLogger(__name__)


TTS_DESCRIPTIONS = {
    "excitable": (
        "Ravi speaks with very high energy and extreme excitement, very fast pace, "
        "high pitch. He shouts and repeats words for emphasis. The recording is very "
        "clear audio with no background noise."
    ),
    "veteran": (
        "Tapan speaks at a moderate pace with a slightly monotone tone, calm and "
        "measured delivery. The recording is clear, with a close sound and only "
        "minimal ambient noise."
    ),
    "default": (
        "Karan's high-pitched, engaging voice is captured in a clear, close-sounding "
        "recording. His slightly faster delivery conveys excitement and energy."
    ),
}


def _build_translation_messages(english_text: str, strict: bool = False) -> list[dict]:
    base_instruction = (
        "Translate the English text into Konkani in Latin script.\n"
        "Return ONLY the translated Konkani sentence.\n"
        "Do not explain, do not include labels, and do not include the English text."
    )
    strict_instruction = (
        "You are a translation engine. Output must be one line of Konkani only.\n"
        "Forbidden: explanations, notes, headings, bullets, quotes, markdown, or English paraphrases."
    )
    instruction = f"{base_instruction}\n{strict_instruction}" if strict else base_instruction
    return [
        {
            "role": "user",
            "content": f"{instruction}\n\nEnglish: {english_text.strip()}\nKonkani:",
        }
    ]


def _cleanup_translation_output(raw_text: str) -> str:
    text = (raw_text or "").replace("**", "").strip()
    if not text:
        return ""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return ""

    for line in lines:
        lower = line.lower()
        if lower.startswith("translation:") or lower.startswith("konkani:") or lower.startswith("answer:"):
            cleaned = line.split(":", 1)[1].strip()
            if cleaned:
                return cleaned
            continue
        if lower.startswith("#") or lower.startswith("- "):
            continue
        return line
    return lines[0]


def _looks_like_explanation(text: str) -> bool:
    if not text:
        return True
    lower = text.lower()
    bad_patterns = [
        "in goan",
        "in the goan",
        "the konkani",
        "konkani answer",
        "goan catholic",
        "roman script",
        "latin script",
        "this expression",
        "note:",
        "explanation:",
        "translation:",
        "here is the",
        "in this sentence",
        "key vocabulary",
    ]
    return any(pattern in lower for pattern in bad_patterns)







# -------- Stage 1----------------------------------------------------------

def extract_audio_from_video(video_path: str, out_path: str) -> str:
    """Use ffmpeg to extract 16kHz mono WAV from video file."""
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-ar", "16000",
        "-ac", "1",
        "-f", "wav",
        out_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {result.stderr}")
    return out_path


def transcribe_video(
    video_path: str,
    on_segment: Optional[Callable] = None,
) -> list[dict]:
    """
    Stage 1: Transcribe English commentary from video.
    Returns list of { start, end, text } dicts.
    Calls on_segment(segment_dict) after each segment for streaming.
    """
    logger.info("Stage 1: STT - %s", video_path)
    model = load_whisper()

    audio_path = video_path.replace(Path(video_path).suffix, "_audio.wav")
    extract_audio_from_video(video_path, audio_path)

    segments_out = []
    segments, info = model.transcribe(
        audio_path,
        language="en",
        beam_size=2,
        vad_filter=True,
        vad_parameters=dict(
            min_silence_duration_ms=500,
            speech_pad_ms=200,
        ),
        word_timestamps=False,
    )

    logger.info(
        "Processing audio with duration %s",
        f"{int(info.duration // 60):02d}:{info.duration % 60:06.3f}",
    )
    logger.info("VAD filter removed %s of audio",
        f"{int(info.duration_after_vad // 60):02d}:{info.duration_after_vad % 60:06.3f}"
        if hasattr(info, "duration_after_vad") else "unknown",
    )
    logger.info("Detected language: %s (%.0f%%)", info.language, info.language_probability * 100)

    for seg in segments:
        seg_dict = {
            "index": len(segments_out),
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "english": seg.text.strip(),
            "konkani": None,
            "audio_path": None,
            "audio_ready": False,
        }
        segments_out.append(seg_dict)
        logger.info("[%.1fs → %.1fs] %s", seg.start, seg.end, seg.text.strip())
        if on_segment:
            on_segment(seg_dict)

    try:
        os.remove(audio_path)
    except Exception:
        pass

    return segments_out




# ---------- Stage 2 -----------------------------------------------------------------

def translate_segment(english_text: str, model, tokenizer) -> str:
    """Translate a single English segment to Konkani using Gemma 3 4B."""
    attempts = (False, True)
    for is_strict in attempts:
        messages = _build_translation_messages(english_text, strict=is_strict)
        try:
            encoded = tokenizer.apply_chat_template(
                messages,
                tokenize=True,
                add_generation_prompt=True,
                return_tensors="pt",
            )
            input_ids = encoded.to(DEVICE)
            if hasattr(input_ids, "input_ids"):
                attention_mask = input_ids.get("attention_mask", None)
                input_ids = input_ids["input_ids"]
            else:
                attention_mask = None
        except Exception:
            prompt = messages[0]["content"]
            encoded = tokenizer(prompt, return_tensors="pt")
            input_ids = encoded.input_ids.to(DEVICE)
            attention_mask = encoded.attention_mask.to(DEVICE)

        generate_kwargs = dict(
            input_ids=input_ids,
            max_new_tokens=96,
            do_sample=False,
            repetition_penalty=1.05,
        )
        if attention_mask is not None:
            generate_kwargs["attention_mask"] = attention_mask

        with torch.no_grad():
            output_ids = model.generate(**generate_kwargs)

        new_tokens = output_ids[0][input_ids.shape[-1]:]
        raw_konkani = tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
        cleaned = _cleanup_translation_output(raw_konkani)
        logger.info("DEBUG: Translation raw='%s' cleaned='%s'", raw_konkani, cleaned)

        if cleaned and not _looks_like_explanation(cleaned):
            return cleaned

        logger.warning(
            "  Translation attempt produced explanatory output (strict=%s): %s",
            is_strict,
            cleaned or "<empty>",
        )

    logger.warning("  Returning English as last-resort fallback for segment.")
    return english_text.strip()










def translate_segments(
    segments: list[dict],
    on_translated: Optional[Callable] = None,
) -> list[dict]:
    """Stage 2: Translate all segments. Calls on_translated(seg) after each."""
    logger.info("Stage 2: Translation - %d segments", len(segments))

    try:
        model, tokenizer = load_translation()
    except Exception as e:
        logger.error("Translation model failed to load, skipping stage: %s", e, exc_info=True)
        for seg in segments:
            seg["konkani"] = seg["english"]
            if on_translated:
                on_translated(seg)
        return segments

    for seg in segments:
        try:
            seg["konkani"] = translate_segment(seg["english"], model, tokenizer)
            logger.info("  [%d] %s", seg["index"], seg["konkani"][:60])
        except Exception as e:
            logger.error("Translation failed for segment %d: %s", seg["index"], e, exc_info=True)
            seg["konkani"] = seg["english"]
        if on_translated:
            on_translated(seg)

    return segments




def synthesize_segments(
    segments: list[dict],
    output_dir: str,
    voice: str = "default",
    on_audio_ready: Optional[Callable] = None,
) -> list[dict]:
    """Stage 3: Generate audio for all translated segments via external worker."""
    logger.info("Stage 3: TTS - %d segments", len(segments))
    os.makedirs(output_dir, exist_ok=True)
    
    import json
    import tempfile
    
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False) as f:
        json.dump(segments, f)
        temp_json_path = f.name
        
    base_dir = os.path.dirname(os.path.abspath(__file__))
    python_exe = os.path.join(base_dir, "venv_tts", "bin", "python")
    worker_script = os.path.join(base_dir, "tts_worker.py")
    
    if not os.path.exists(python_exe):
        logger.error(f"TTS environment not found at {python_exe}. Skipping TTS.")
        return segments

    cmd = [
        python_exe, worker_script,
        "--input_json", temp_json_path,
        "--output_dir", output_dir,
        "--voice", voice
    ]
    
    logger.info(f"Starting TTS worker process...")
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    updated_segments = []
    


    
    if process.stdout:
        for line in process.stdout:
            line = line.strip()
            if not line:
                continue
            try:
                seg_update = json.loads(line)
                
                if "error" in seg_update and "index" not in seg_update:
                     logger.error(f"TTS Worker Error: {seg_update['error']}")
                     continue
                     
                idx = seg_update.get("index")
                if idx is not None:
                    for s in segments:
                        if s["index"] == idx:
                            s.update(seg_update)
                            if on_audio_ready:
                                on_audio_ready(s)
                            break
            except json.JSONDecodeError:
                logger.debug(f"Worker stdout: {line}")
                
    process.wait()
    
    if process.returncode != 0:
        logger.error(f"TTS worker failed with return code {process.returncode}")
        stderr = process.stderr.read() if process.stderr else ""
        if stderr:
            logger.error(f"Worker stderr: {stderr}")
            
    try:
        os.remove(temp_json_path)
    except Exception:
        pass

    return segments






def run_pipeline(
    video_path: str,
    job: dict,
    output_dir: str,
    voice: str = "default",
):
    """
    Full pipeline: STT → translate → TTS.
    Updates job dict in-place for progress tracking.
    Models are loaded and unloaded sequentially to stay within 6GB VRAM.
    """
    try:
        job["status"] = "processing"
        job["stage"] = "stt"
        job["progress"] = 5

        # ======== Stage 1
        def on_segment(seg):
            job["segments"].append(seg)
            job["progress"] = min(5 + len(job["segments"]) * 3, 40)

        segments = transcribe_video(video_path, on_segment=on_segment)
        job["segments"] = segments
        job["progress"] = 40

        unload_whisper()

        # =========== Stage 2
        job["stage"] = "translating"

        def on_translated(seg):
            idx = seg["index"]
            job["segments"][idx] = seg
            job["progress"] = 40 + int((idx + 1) / max(len(segments), 1) * 30)

        translate_segments(segments, on_translated=on_translated)
        job["progress"] = 70

        unload_translation()

        # ============== Stage 3
        job["stage"] = "tts"

        def on_audio_ready(seg):
            idx = seg["index"]
            job["segments"][idx] = seg
            job["progress"] = 70 + int((idx + 1) / max(len(segments), 1) * 29)

        synthesize_segments(
            segments,
            output_dir=output_dir,
            voice=voice,
            on_audio_ready=on_audio_ready,
        )

        job["status"] = "done"
        job["stage"] = "done"
        job["progress"] = 100
        logger.info("Pipeline complete for job.")

    except Exception as e:
        logger.exception("Pipeline error: %s", e)
        job["status"] = "error"
        job["error"] = str(e)

    finally:
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()