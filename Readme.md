# Konkani Commentary Generator - Free Local AI Edition
**World's First AI Live Match Commentary in Konkani**

This project takes English commentary clips, transcribes them, translates them to Konkani, and synthesises them using expressive Konkani voices.

Everything runs **100% locally on your machine** using open-source models, specifically optimised to fit within a 6GB VRAM GPU (like the RTX 4050). No paid APIs are required.

---

## Architecture

- **Frontend**: Next.js 14 + Framer Motion (Beautiful, responsive UI)
- **Backend**: Python FastAPI (Handles all AI model execution)
- **STT**: `faster-whisper large-v3` (Extracts English text from video)
- **Translation**: `konkani-gemma-3-4b-it` (4-bit quantized, translates English to Konkani)
- **TTS**: `indic-parler-tts` (Synthesises natural Konkani voice audio)

---

## Setup Instructions

### Prerequisites
1. **NVIDIA GPU** with at least 6GB VRAM (e.g., RTX 4050).
2. **System RAM**: 16GB recommended.
3. **Python 3.10+**
4. **Node.js 18+**
5. **FFmpeg** installed on your system.
6. A **HuggingFace** account and Access Token.

### 1. HuggingFace Setup (One-time)
You must accept the terms for the models used in this project on HuggingFace:
1. Go to https://huggingface.co/google/gemma-3-4b-it and accept the Gemma license.
2. Go to https://huggingface.co/ai4bharat/indic-parler-tts and accept the terms.
3. Generate an Access Token at https://huggingface.co/settings/tokens.
4. Run `pip install huggingface_hub` and `huggingface-cli login`, then paste your token.

### 2. System Dependencies
Install FFmpeg (required for audio extraction):
```bash
sudo pacman -S ffmpeg
```

### 3. Start the AI Backend
The backend runs the AI models. On the very first run, it will download ~7–10GB of models.
```bash
cd Backend
./start.sh
```
*Note: Before running `start.sh`, copy `.env.example` to `.env` and add your `HF_TOKEN` if you prefer to use the .env file instead of `huggingface-cli login`.*

### 4. Start the Frontend
The frontend provides the UI for uploading clips and viewing the real-time transcript.
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Use (Demo Mode)

1. **Upload**: Drag and drop any `.mp4`, `.mkv`, or `.webm` clip containing English commentary into the drop zone.
2. **Select Voice**: Choose an expressive commentator voice
3. **Generate**: Click "Generate Konkani Commentary".
4. **Watch**: The pipeline runs entirely locally. You will see English and Konkani transcripts appear in real-time.
5. **Listen**: Click the Play button next to any Konkani segment to hear it, or click "Play All" once processing is complete.

---

## Troubleshooting

- **CUDA Out of Memory**: The models are loaded lazily to fit in 6GB VRAM. Ensure no other heavy GPU applications are running.
- **Backend Error**: Ensure you have accepted the HuggingFace licenses and logged in. Check the backend terminal logs for detailed Python tracebacks.
- **Audio Not Playing**: Ensure your browser allows autoplay for the page, or interact with the page first.

---

*Amchem Goem amchem - Our Goa is ours. 🌴*
