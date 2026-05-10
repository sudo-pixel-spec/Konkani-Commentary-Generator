import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CommentaryFeed, { Segment } from './CommentaryFeed';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const VOICES = [
  { id: 'excitable', label: 'Ravi Naik', emoji: '⚡', desc: 'High energy, shouts goals' },
  { id: 'veteran', label: 'Joca Fernandes', emoji: '🎙️', desc: 'Calm, measured, veteran' },
  { id: 'default', label: 'Karan', emoji: '🌴', desc: 'Expressive & clear' },
];

const STAGE_LABELS: Record<string, string> = {
  queued: 'Queued',
  stt: '🎙️ Transcribing English...',
  translating: '🔄 Translating to Konkani...',
  tts: '🔊 Generating Voice...',
  done: '✅ Done!',
};

type JobStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export default function DemoPanel() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [voice, setVoice] = useState('default');

  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus>('idle');
  const [stage, setStage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith('video/') && !f.name.match(/\.(mp4|mkv|avi|webm|mov)$/i)) {
      setError('Please upload a video file (mp4, mkv, avi, webm, mov).');
      return;
    }
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setError(null);
    setSegments([]);
    setStatus('idle');
    setProgress(0);
    setJobId(null);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const startProcessing = async () => {
    if (!file) return;
    setError(null);
    setSegments([]);
    setProgress(0);
    setStatus('uploading');
    setStage('uploading');
    setActiveIdx(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('voice', voice);

      const res = await fetch(`${API_URL}/api/process-clip`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed.');
      }

      const data = await res.json();
      const jid = data.job_id;
      setJobId(jid);
      setStatus('processing');
      startSSE(jid);
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
      setStatus('error');
    }
  };

  const startSSE = (jid: string) => {
    if (sseRef.current) sseRef.current.close();

    const es = new EventSource(`${API_URL}/api/transcript/${jid}`);
    sseRef.current = es;

    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);

        if (data.type === 'progress') {
          setProgress(data.progress);
          setStage(data.stage);
        }

        if (data.type === 'segment') {
          setSegments(prev => {
            const existing = prev.find(s => s.index === data.index);
            if (existing) return prev;
            return [...prev, {
              index: data.index,
              start: data.start,
              end: data.end,
              english: data.english,
              konkani: data.konkani,
              audio_url: data.audio_url,
              audio_ready: !!data.audio_url,
            }];
          });
        }

        if (data.type === 'audio_ready') {
          setSegments(prev => prev.map(s =>
            s.index === data.index
              ? { ...s, konkani: data.konkani, audio_url: data.audio_url, audio_ready: true }
              : s
          ));
        }

        if (data.type === 'done') {
          setStatus('done');
          setProgress(100);
          setStage('done');
          es.close();
        }

        if (data.type === 'error') {
          setError(data.error || 'Pipeline error.');
          setStatus('error');
          es.close();
        }
      } catch { }
    };

    es.onerror = () => {
      if (status !== 'done') {
        es.close();
      }
    };
  };

  const playSegment = useCallback((seg: Segment) => {
    if (!seg.audio_url) return;
    if (activeIdx === seg.index) {
      if (audioRef.current) {
        if (audioRef.current.paused) audioRef.current.play();
        else { audioRef.current.pause(); setActiveIdx(null); }
      }
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(`${API_URL}${seg.audio_url}`);
    audioRef.current = audio;
    setActiveIdx(seg.index);
    audio.play();
    audio.onended = () => setActiveIdx(null);
  }, [activeIdx]);

  const playAll = useCallback(() => {
    const ready = segments.filter(s => s.audio_ready).sort((a, b) => a.index - b.index);
    if (ready.length === 0) return;
    if (audioRef.current) audioRef.current.pause();

    let i = 0;
    const playNext = () => {
      if (i >= ready.length) { setActiveIdx(null); return; }
      const seg = ready[i++];
      const audio = new Audio(`${API_URL}${seg.audio_url}`);
      audioRef.current = audio;
      setActiveIdx(seg.index);
      audio.play();
      audio.onended = playNext;
    };
    playNext();
  }, [segments]);

  const stopAll = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setActiveIdx(null);
  };

  useEffect(() => () => {
    sseRef.current?.close();
    audioRef.current?.pause();
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  const isProcessing = status === 'uploading' || status === 'processing';
  const readySegments = segments.filter(s => s.audio_ready).length;

  return (
    <section id="demo" style={{ padding: '80px 0 60px', position: 'relative', zIndex: 1 }}>
      <div className="blob" style={{ top: '10%', left: '-10%', width: 500, height: 500, background: 'rgba(255,107,53,0.15)' }} />
      <div className="blob" style={{ bottom: '-10%', right: '-10%', width: 600, height: 600, background: 'rgba(0,201,167,0.1)' }} />
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="azulejo-border" style={{ marginBottom: 48 }} />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="section-header"
        >
          <span className="section-tag">● O JOGO GRANDE</span>
          <h2 className="section-title">
            Upload a <em>Match Clip</em>
          </h2>
          <p style={{ color: 'rgba(255,243,224,0.5)', fontSize: 15, maxWidth: 500, margin: '12px auto 0' }}>
            Any football video with English commentary. The AI extracts, translates, and voices it in Konkani - all locally on your GPU.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div
              className={`upload-zone${dragging ? ' drag-over' : ''}`}
              style={{ padding: videoUrl ? 12 : 40, textAlign: 'center' }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !videoUrl && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/x-matroska,video/avi,video/webm,video/quicktime,.mp4,.mkv,.avi,.webm,.mov"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />

              {videoUrl ? (
                <div>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    style={{
                      width: '100%', borderRadius: 10,
                      maxHeight: 220, background: '#000',
                    }}
                  />
                  <button
                    className="btn-ghost"
                    style={{ marginTop: 10, fontSize: 12 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setVideoUrl(null);
                      setSegments([]);
                      setStatus('idle');
                      setJobId(null);
                      setError(null);
                      stopAll();
                    }}
                  >
                    ✕ Remove clip
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>🎬</div>
                  <p style={{ fontSize: 15, color: 'rgba(253,246,227,0.7)', marginBottom: 6, fontWeight: 500 }}>
                    Drop a football clip here
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(253,246,227,0.3)' }}>
                    MP4, MKV, AVI, WebM · up to 500MB
                  </p>
                </>
              )}
            </div>

            <div className="glass-card" style={{ padding: 16 }}>
              <p className="section-label" style={{ marginBottom: 12 }}>Choose Commentator Voice</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {VOICES.map(v => (
                  <motion.button
                    key={v.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setVoice(v.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      background: voice === v.id ? 'rgba(255,107,26,0.12)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${voice === v.id ? 'rgba(255,107,26,0.5)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 10,
                      padding: '10px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{v.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: voice === v.id ? 'var(--saffron)' : 'var(--cream)' }}>
                        {v.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(253,246,227,0.4)', marginTop: 2 }}>{v.desc}</div>
                    </div>
                    {voice === v.id && (
                      <span style={{ marginLeft: 'auto', color: 'var(--saffron)', fontSize: 14 }}>✓</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button
              whileHover={!isProcessing && file ? { scale: 1.02, y: -2 } : {}}
              whileTap={!isProcessing && file ? { scale: 0.98 } : {}}
              onClick={startProcessing}
              disabled={(!file || isProcessing) ? true : undefined}
              className="btn-primary"
              style={{ width: '100%', fontSize: 22 }}
            >
              {isProcessing ? '🔴 ON AIR - Processing...' : '🎙️ Generate Konkani Commentary'}
            </motion.button>

            <AnimatePresence>
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass-card"
                  style={{ padding: 16 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: 'rgba(253,246,227,0.6)' }}>
                      {STAGE_LABELS[stage] || stage}
                    </span>
                    <span style={{ color: 'var(--saffron)', fontWeight: 600 }}>{progress}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', height: 3 }}>
                    <div className="progress-bar" style={{ width: `${progress}%` }} />
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    {[
                      { key: 'stt', label: '🎙️ STT' },
                      { key: 'translating', label: '🔄 Translate' },
                      { key: 'tts', label: '🔊 Voice' },
                    ].map((s, i) => {
                      const stageOrder = ['stt', 'translating', 'tts', 'done'];
                      const currentIdx = stageOrder.indexOf(stage);
                      const thisIdx = stageOrder.indexOf(s.key);
                      const isDone = currentIdx > thisIdx;
                      const isActive = stage === s.key;
                      return (
                        <div
                          key={s.key}
                          style={{
                            flex: 1, textAlign: 'center', padding: '6px 8px',
                            borderRadius: 8, fontSize: 11, fontWeight: 600,
                            background: isDone ? 'rgba(45,106,79,0.2)' : isActive ? 'rgba(255,107,26,0.15)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${isDone ? 'rgba(45,106,79,0.4)' : isActive ? 'rgba(255,107,26,0.4)' : 'rgba(255,255,255,0.06)'}`,
                            color: isDone ? '#4ade80' : isActive ? 'var(--saffron)' : 'rgba(253,246,227,0.3)',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {isDone ? '✓ ' : isActive ? '' : ''}{s.label}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {status === 'done' && readySegments > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card"
                  style={{ padding: 16, display: 'flex', gap: 10, alignItems: 'center' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#4ade80', marginBottom: 2 }}>
                      ✅ {readySegments} segment{readySegments > 1 ? 's' : ''} ready
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(253,246,227,0.4)' }}>
                      Click any row or use Play All
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={activeIdx !== null ? stopAll : playAll}
                    style={{
                      background: activeIdx !== null ? 'rgba(239,68,68,0.15)' : 'rgba(255,107,26,0.15)',
                      border: `1px solid ${activeIdx !== null ? 'rgba(239,68,68,0.3)' : 'rgba(255,107,26,0.3)'}`,
                      borderRadius: 10, padding: '8px 16px',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      color: activeIdx !== null ? '#ef4444' : 'var(--saffron)',
                    }}
                  >
                    {activeIdx !== null ? '⏹ Stop' : '▶ Play All'}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 10, padding: 14,
                    fontSize: 13, color: '#fca5a5',
                  }}
                >
                  ⚠️ {error}
                  {error.includes('running') && (
                    <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(252,165,165,0.6)' }}>
                      The backend is busy. Wait for the current job to finish.
                    </div>
                  )}
                  {error.includes('backend') && (
                    <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(252,165,165,0.6)' }}>
                      Make sure the Python backend is running: <code>cd ai-backend && ./start.sh</code>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card"
            style={{ padding: 20, minHeight: 400 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 22,
                letterSpacing: '0.06em',
                color: 'var(--cream)',
              }}>
                Live <span style={{ color: 'var(--saffron)' }}>Transcript</span>
              </h3>
              {segments.length > 0 && (
                <button
                  className="btn-ghost"
                  style={{ fontSize: 11 }}
                  onClick={() => { setSegments([]); stopAll(); }}
                >
                  Clear
                </button>
              )}
            </div>

            <CommentaryFeed
              segments={segments}
              activeIndex={activeIdx}
              onPlaySegment={playSegment}
              isStreaming={isProcessing}
            />
          </motion.div>
        </div>

      </div>
    </section>
  );
}
