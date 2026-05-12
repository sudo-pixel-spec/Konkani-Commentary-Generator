#!/usr/bin/env bash
# start.sh - Start the Konkani Commentary AI Backend
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   KONKANI COMMENTARY - AI Backend            ║"
echo "║   STT + Translation + TTS on RTX 4050        ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

if [ ! -f ".env" ]; then
    echo ".env file not found. Copying from .env.example..."
    cp .env.example .env
    echo "   Please edit .env and add your HF_TOKEN, then run again."
    exit 1
fi

if [ ! -d "venv" ]; then
    echo " Creating Python virtual environment..."
    python3.10 -m venv venv
    source venv/bin/activate
    echo " Installing dependencies..."
    pip install --upgrade pip -q
    pip install torch --index-url https://download.pytorch.org/whl/cu121 -q
    pip install -r requirements.txt -q
    pip install git+https://github.com/huggingface/parler-tts.git -q
    echo "Dependencies installed."
else
    source venv/bin/activate
fi

if ! command -v ffmpeg &> /dev/null; then
    echo "ffmpeg not found. Install it with: sudo pacman -S ffmpeg"
    exit 1
fi

# Check GPU
python -c "import torch; print(f' GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"CPU (no GPU found)\"}')"

echo ""
echo "🚀 Starting FastAPI server on http://localhost:8000"
echo "   Press Ctrl+C to stop."
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
