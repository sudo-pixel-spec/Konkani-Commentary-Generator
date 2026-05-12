"""
models.py - Lazy model loader singleton.
All three AI models are loaded on first use and kept in GPU memory.
Sequential loading ensures we never exceed VRAM limits on my damn RTX 4050 (6GB).
"""

import os
import gc
import torch
import logging
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

_whisper_model = None
_translation_model = None
_translation_tokenizer = None
_tts_model = None
_tts_tokenizer = None
_tts_description_tokenizer = None

TRANSLATION_MODEL_ID = os.getenv("TRANSLATION_MODEL", "konkani/konkani-gemma-3-4b-it")
TTS_MODEL_ID = os.getenv("TTS_MODEL", "ai4bharat/indic-parler-tts")
WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL", "large-v3")
HF_TOKEN = os.getenv("HF_TOKEN")

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


def get_vram_info() -> dict:
    """Return current VRAM usage info."""
    if not torch.cuda.is_available():
        return {"available": False}
    total = torch.cuda.get_device_properties(0).total_memory / 1e9
    used = torch.cuda.memory_allocated(0) / 1e9
    reserved = torch.cuda.memory_reserved(0) / 1e9
    return {
        "available": True,
        "device": torch.cuda.get_device_name(0),
        "total_gb": round(total, 2),
        "used_gb": round(used, 2),
        "reserved_gb": round(reserved, 2),
        "free_gb": round(total - reserved, 2),
    }


def load_whisper():
    """Load faster-whisper large-v3 on GPU with float16."""
    global _whisper_model
    if _whisper_model is not None:
        return _whisper_model

    logger.info("Loading faster-whisper %s on %s...", WHISPER_MODEL_SIZE, DEVICE)
    from faster_whisper import WhisperModel

    compute_type = "float16" if DEVICE == "cuda" else "int8"
    _whisper_model = WhisperModel(
        WHISPER_MODEL_SIZE,
        device=DEVICE,
        compute_type=compute_type,
        num_workers=2,
    )
    logger.info("Whisper loaded.")
    return _whisper_model


def unload_whisper():
    global _whisper_model
    _whisper_model = None
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    logger.info("🗑️  Whisper unloaded.")







def load_translation():
    """Load konkani-gemma-3-4b-it with 4-bit quantization to fit in 6GB VRAM."""
    global _translation_model, _translation_tokenizer
    if _translation_model is not None:
        return _translation_model, _translation_tokenizer

    logger.info("Loading translation model %s (4-bit)...", TRANSLATION_MODEL_ID)
    from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
    from peft import PeftModel

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_use_double_quant=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
    )

    base_model_id = "google/gemma-3-4b-it"
    logger.info("Loading base model %s...", base_model_id)
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_id,
        quantization_config=bnb_config,
        device_map="auto",
        token=HF_TOKEN,
        trust_remote_code=True,
    )

    logger.info("Applying LoRA adapter %s...", TRANSLATION_MODEL_ID)
    _translation_model = PeftModel.from_pretrained(
        base_model,
        TRANSLATION_MODEL_ID,
        token=HF_TOKEN,
        ignore_mismatched_sizes=True,
    )

    _translation_tokenizer = AutoTokenizer.from_pretrained(
        base_model_id,
        token=HF_TOKEN,
        trust_remote_code=True,
    )

    _translation_model.eval()
    logger.info("Translation model loaded.")
    return _translation_model, _translation_tokenizer


def unload_translation():
    global _translation_model, _translation_tokenizer
    _translation_model = None
    _translation_tokenizer = None
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    logger.info("Translation model unloaded.")





MODEL_STATUS = {
    "whisper": False,
    "translation": False,
    "tts": False,
}