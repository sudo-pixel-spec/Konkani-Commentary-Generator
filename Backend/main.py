"""
main.py - FastAPI server for Konkani Commentary Generator.
Handles video uploads, background pipeline processing, SSE streaming,
and audio file serving.
"""

import os
import uuid
import json
import asyncio
import logging
import shutil
import mimetypes
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse, JSONResponse
from dotenv import load_dotenv

from models import get_vram_info, MODEL_STATUS
from pipeline import run_pipeline

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

TEMP_DIR = Path(os.getenv("TEMP_DIR", "./temp_files"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "500"))
ALLOWED_EXTENSIONS = {".mp4", ".mkv", ".avi", ".webm", ".mov"}


JOBS: dict[str, dict] = {}

executor = ThreadPoolExecutor(max_workers=1)


@asynccontextmanager
async def lifespan(app: FastAPI):
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("✅ Konkani Commentary AI Backend started.")
    logger.info("   TEMP_DIR: %s", TEMP_DIR)
    logger.info("   VRAM:     %s", get_vram_info())
    yield
    # Cleanup on shutdown
    executor.shutdown(wait=False)
    logger.info("Backend shutting down.")


app = FastAPI(
    title="Konkani Commentary Generator - AI Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.100.14:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def make_job(job_id: str, video_path: str, output_dir: str) -> dict:
    return {
        "job_id": job_id,
        "status": "pending",
        "progress": 0,
        "stage": "queued",
        "segments": [],
        "error": None,
        "video_path": str(video_path),
        "output_dir": str(output_dir),
    }


def public_job(job: dict) -> dict:
    """Strip internal file paths before sending to client."""
    return {k: v for k, v in job.items() if k not in ("video_path", "output_dir")}


def validate_upload(file: UploadFile):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )





@app.get("/api/health")
async def health():
    """Return server status and GPU info."""
    return {
        "status": "ok",
        "vram": get_vram_info(),
        "models_loaded": MODEL_STATUS,
        "active_jobs": sum(1 for j in JOBS.values() if j["status"] == "processing"),
        "total_jobs": len(JOBS),
    }


@app.post("/api/process-clip")
async def process_clip(
    file: UploadFile = File(...),
    voice: str = Form("default"),
    background_tasks: BackgroundTasks = None,
):
    """
    Upload a video clip and start the STT → Translation → TTS pipeline.
    Returns a job_id immediately; poll /api/status/{job_id} for progress.
    """
    validate_upload(file)

    running = [j for j in JOBS.values() if j["status"] == "processing"]
    if running:
        raise HTTPException(
            status_code=429,
            detail="A processing job is already running. Please wait for it to finish.",
        )

    job_id = str(uuid.uuid4())[:8]
    job_dir = TEMP_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "video.mp4").suffix.lower()
    video_path = job_dir / f"input{ext}"
    with open(video_path, "wb") as f:
        content = await file.read()
        if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
            raise HTTPException(status_code=413, detail=f"File too large (max {MAX_UPLOAD_MB}MB).")
        f.write(content)

    output_dir = job_dir / "audio"
    output_dir.mkdir(exist_ok=True)

    job = make_job(job_id, video_path, output_dir)
    JOBS[job_id] = job

    loop = asyncio.get_event_loop()
    loop.run_in_executor(
        executor,
        run_pipeline,
        str(video_path),
        job,
        str(output_dir),
        voice,
    )

    logger.info("Job %s started for file %s", job_id, file.filename)
    return {"job_id": job_id, "status": "pending", "message": "Processing started."}


@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    """Poll job status and progress."""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    return public_job(job)


@app.get("/api/result/{job_id}")
async def get_result(job_id: str):
    """Get full result once job is done."""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job["status"] not in ("done", "error"):
        raise HTTPException(status_code=202, detail="Job still processing.")

    segments = []
    for seg in job["segments"]:
        s = dict(seg)
        if s.get("audio_ready"):
            s["audio_url"] = f"/api/audio/{job_id}/{s['index']}"
        else:
            s["audio_url"] = None

        s.pop("audio_path", None)
        segments.append(s)

    return {
        "job_id": job_id,
        "status": job["status"],
        "error": job.get("error"),
        "segment_count": len(segments),
        "segments": segments,
    }


@app.get("/api/audio/{job_id}/{seg_index}")
async def get_audio(job_id: str, seg_index: int):
    """Stream WAV audio for a specific segment."""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    segments = job.get("segments", [])
    seg = next((s for s in segments if s["index"] == seg_index), None)
    if not seg:
        raise HTTPException(status_code=404, detail="Segment not found.")

    audio_path = seg.get("audio_path")
    if not audio_path or not Path(audio_path).exists():
        raise HTTPException(status_code=404, detail="Audio not yet generated.")

    return FileResponse(audio_path, media_type="audio/wav")


@app.get("/api/transcript/{job_id}")
async def stream_transcript(job_id: str):
    """
    SSE endpoint - streams segment data as it becomes available.
    Client receives events as: data: {"seg": i, "english": "...", "konkani": "...", "audio_url": "..."}
    Connection closes when job is done or errored.
    """
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    async def event_generator():
        sent_indices = set()
        sent_audio = set()

        yield "data: {\"type\":\"connected\"}\n\n"

        while True:
            job_status = job.get("status", "pending")

            for seg in job.get("segments", []):
                idx = seg["index"]
                if idx not in sent_indices and seg.get("english"):
                    payload = {
                        "type": "segment",
                        "index": idx,
                        "start": seg["start"],
                        "end": seg["end"],
                        "english": seg["english"],
                        "konkani": seg.get("konkani"),
                        "audio_url": f"/api/audio/{job_id}/{idx}" if seg.get("audio_ready") else None,
                    }
                    yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
                    sent_indices.add(idx)

            for seg in job.get("segments", []):
                idx = seg["index"]
                if idx in sent_indices and idx not in sent_audio and seg.get("audio_ready"):
                    payload = {
                        "type": "audio_ready",
                        "index": idx,
                        "konkani": seg.get("konkani"),
                        "audio_url": f"/api/audio/{job_id}/{idx}",
                    }
                    yield f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
                    sent_audio.add(idx)

            yield f"data: {json.dumps({'type':'progress','progress':job['progress'],'stage':job['stage']})}\n\n"

            if job_status in ("done", "error"):
                final = {
                    "type": "done" if job_status == "done" else "error",
                    "error": job.get("error"),
                    "total_segments": len(job.get("segments", [])),
                }
                yield f"data: {json.dumps(final)}\n\n"
                break

            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@app.delete("/api/job/{job_id}")
async def delete_job(job_id: str):
    """Clean up job files and remove from store."""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job["status"] == "processing":
        raise HTTPException(status_code=409, detail="Cannot delete a running job.")

    job_dir = TEMP_DIR / job_id
    if job_dir.exists():
        shutil.rmtree(job_dir, ignore_errors=True)

    del JOBS[job_id]
    return {"message": f"Job {job_id} deleted."}


@app.get("/api/jobs")
async def list_jobs():
    """List all jobs (for debugging)."""
    return [public_job(j) for j in JOBS.values()]












if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=False)
