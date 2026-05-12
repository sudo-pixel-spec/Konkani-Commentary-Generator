import os
import sys
import json
import torch
import argparse
import logging
import numpy as np
import soundfile as sf
from transformers import AutoTokenizer

logging.basicConfig(level=logging.ERROR)

TTS_MODEL_ID = "ai4bharat/indic-parler-tts"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

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

def load_tts_model():
    from parler_tts import ParlerTTSForConditionalGeneration
    
    hf_token = os.environ.get("HF_TOKEN")
    
    tts_model = ParlerTTSForConditionalGeneration.from_pretrained(
        TTS_MODEL_ID,
        token=hf_token,
    ).to(DEVICE)
    tts_model.eval()

    tts_tokenizer = AutoTokenizer.from_pretrained(TTS_MODEL_ID, token=hf_token)
    tts_description_tokenizer = AutoTokenizer.from_pretrained(
        "google/flan-t5-large",
        token=hf_token,
    )
    
    return tts_model, tts_tokenizer, tts_description_tokenizer

def synthesize_segment(konkani_text, out_path, tts_model, tokenizer, desc_tokenizer, voice="default"):
    description = TTS_DESCRIPTIONS.get(voice, TTS_DESCRIPTIONS["default"])

    desc_inputs = desc_tokenizer(description, return_tensors="pt").to(DEVICE)
    prompt_inputs = tokenizer(konkani_text, return_tensors="pt").to(DEVICE)

    with torch.no_grad():
        generation = tts_model.generate(
            input_ids=desc_inputs.input_ids,
            attention_mask=desc_inputs.attention_mask,
            prompt_input_ids=prompt_inputs.input_ids,
            prompt_attention_mask=prompt_inputs.attention_mask,
        )

    audio_arr = generation.cpu().numpy().squeeze()

    if audio_arr.dtype == np.float16:
        audio_arr = audio_arr.astype(np.float32)

    sample_rate = tts_model.config.sampling_rate
    sf.write(out_path, audio_arr, sample_rate)
    return out_path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_json", required=True, help="Path to input segments JSON")
    parser.add_argument("--output_dir", required=True, help="Directory to save audio files")
    parser.add_argument("--voice", default="default", help="Voice description key")
    args = parser.parse_args()

    try:
        with open(args.input_json, "r", encoding="utf-8") as f:
            segments = json.load(f)
    except Exception as e:
        print(json.dumps({"error": f"Failed to read input JSON: {e}"}))
        sys.exit(1)

    os.makedirs(args.output_dir, exist_ok=True)

    try:
        tts_model, tokenizer, desc_tokenizer = load_tts_model()
    except Exception as e:
        print(json.dumps({"error": f"Failed to load TTS model: {e}"}))
        sys.exit(1)

    for seg in segments:
        if not seg.get("konkani"):
            seg["audio_ready"] = False
            print(json.dumps(seg))
            sys.stdout.flush()
            continue

        out_path = os.path.join(args.output_dir, f"seg_{seg['index']:04d}.wav")
        try:
            synthesize_segment(
                seg["konkani"], out_path,
                tts_model, tokenizer, desc_tokenizer,
                args.voice,
            )
            seg["audio_path"] = out_path
            seg["audio_ready"] = True
        except Exception as e:
            seg["audio_ready"] = False
            seg["error"] = str(e)

        print(json.dumps(seg))
        sys.stdout.flush()

if __name__ == "__main__":
    main()
