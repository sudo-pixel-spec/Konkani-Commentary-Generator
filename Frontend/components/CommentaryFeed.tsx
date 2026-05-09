import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Segment {
  index: number;
  start: number;
  end: number;
  english: string;
  konkani: string | null;
  audio_url: string | null;
  audio_ready: boolean;
}

interface Props {
  segments: Segment[];
  activeIndex: number | null;
  onPlaySegment: (seg: Segment) => void;
  isStreaming: boolean;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function CommentaryFeed({ segments, activeIndex, onPlaySegment, isStreaming }: Props) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current && segments.length > 0) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [segments.length]);

  if (segments.length === 0 && !isStreaming) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 24px',
        color: 'rgba(253,246,227,0.25)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎙️</div>
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16 }}>
          Upload a clip to see the commentary appear here...
        </p>
      </div>
    );
  }

  return (
    <div
      ref={feedRef}
      style={{
        maxHeight: 520,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 12px',
        position: 'sticky', top: 0, background: 'var(--night-2)', zIndex: 2,
      }}>
        {isStreaming && (
          <>
            <span className="live-ring" />
            <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(253,246,227,0.4)' }}>
              Processing...
            </span>
            <div className="wave-bars" style={{ marginLeft: 'auto' }}>
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="wave-bar" />)}
            </div>
          </>
        )}
        {!isStreaming && segments.length > 0 && (
          <>
            <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(253,246,227,0.4)' }}>
              {segments.length} segment{segments.length !== 1 ? 's' : ''}
            </span>
          </>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '52px 1fr 1fr 36px',
        gap: 12,
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '8px 8px 0 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 4,
      }}>
        <span className="section-label">Time</span>
        <span className="section-label">🇬🇧 English</span>
        <span className="section-label">🌴 Konkani</span>
        <span></span>
      </div>

      <AnimatePresence>
        {segments.map((seg) => {
          const isActive = seg.index === activeIndex;
          return (
            <motion.div
              key={seg.index}
              initial={{ opacity: 0, x: -20, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className={`segment-row${isActive ? ' active' : ''}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '52px 1fr 1fr 36px',
                gap: 12,
                padding: '12px',
                borderLeft: `3px solid ${isActive ? 'var(--saffron)' : 'rgba(255,255,255,0.07)'}`,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                background: isActive ? 'rgba(255,107,26,0.07)' : 'transparent',
                transition: 'all 0.3s ease',
                cursor: seg.audio_ready ? 'pointer' : 'default',
                borderRadius: '0 6px 6px 0',
              }}
              onClick={() => seg.audio_ready && onPlaySegment(seg)}
            >
              <div style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 15,
                color: isActive ? 'var(--saffron)' : 'var(--gold)',
                lineHeight: 1.2,
                paddingTop: 2,
              }}>
                {formatTime(seg.start)}
                <div style={{ fontSize: 10, color: 'rgba(253,246,227,0.3)', fontFamily: 'var(--font-body)' }}>
                  {formatTime(seg.end)}
                </div>
              </div>

              <div style={{
                fontSize: 13.5,
                lineHeight: 1.55,
                color: 'rgba(253,246,227,0.75)',
              }}>
                {seg.english}
              </div>

              <div style={{ fontSize: 14, lineHeight: 1.55 }}>
                {seg.konkani ? (
                  <span style={{
                    color: 'var(--cream)',
                    fontFamily: seg.konkani.match(/[\u0900-\u097F]/) ? 'inherit' : 'var(--font-serif)',
                  }}>
                    {seg.konkani}
                  </span>
                ) : (
                  <span style={{ color: 'rgba(253,246,227,0.2)', fontStyle: 'italic', fontSize: 12 }}>
                    translating...
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {seg.audio_ready ? (
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); onPlaySegment(seg); }}
                    style={{
                      background: isActive ? 'var(--saffron)' : 'rgba(255,107,26,0.15)',
                      border: '1px solid rgba(255,107,26,0.3)',
                      borderRadius: '50%',
                      width: 30, height: 30,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: 11,
                      color: isActive ? 'white' : 'var(--saffron)',
                    }}
                    title="Play Konkani audio"
                  >
                    {isActive ? '⏸' : '▶'}
                  </motion.button>
                ) : seg.konkani ? (
                  <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="wave-bars" style={{ height: 16 }}>
                      {[1, 2, 3].map(i => <div key={i} className="wave-bar" style={{ height: `${8 + i * 3}px` }} />)}
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
