import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

function Stars() {
  const stars = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 3}s`,
    }));
  }, []);

  return (
    <>
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            ['--d' as string]: s.duration,
            ['--delay' as string]: s.delay,
          }}
        />
      ))}
    </>
  );
}

export default function Footer() {
  return (
    <footer id="about" style={{
      position: 'relative',
      padding: '80px 24px 50px',
      textAlign: 'center',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, var(--bg) 0%, #060a14 100%)',
    }}>
      <Stars />

      <div className="azulejo-border" style={{
        position: 'absolute', top: 0, left: 0, right: 0,
      }} />

      <div style={{
        position: 'absolute', bottom: -100, left: '50%',
        transform: 'translateX(-50%)',
        width: 500, height: 250,
        background: 'radial-gradient(circle, rgba(255,179,71,0.08) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: 'relative' }}
      >
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: 'var(--amber)',
          textShadow: '0 0 60px rgba(255,179,71,0.35), 0 0 120px rgba(255,179,71,0.1)',
          marginBottom: 12,
          lineHeight: 1.2,
        }}>
          &ldquo;Amchi Goa, Amchi Khel&rdquo;
        </div>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 16,
          color: 'rgba(255,243,224,0.5)',
          marginBottom: 32,
        }}>
          Our Goa, Our Game 🌴
        </p>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 18,
          letterSpacing: '0.08em',
          color: 'var(--coral)',
          marginBottom: 8,
        }}>
          🎙️ KONKANI COMMENTARY GENERATOR
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.2em',
          color: 'rgba(255,243,224,0.35)',
          textTransform: 'uppercase',
          marginBottom: 28,
          flexWrap: 'wrap',
        }}>
          {['Konkani', 'Portuguese', 'Hindi', 'English'].map((lang, i, arr) => (
            <React.Fragment key={lang}>
              <span>{lang}</span>
              {i < arr.length - 1 && <span style={{ color: 'var(--coral)', opacity: 0.4 }}>◆</span>}
            </React.Fragment>
          ))}
        </div>

        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'rgba(255,243,224,0.3)',
          marginBottom: 6,
          letterSpacing: '0.04em',
        }}>
          Built with ❤️ in Goa &nbsp;·&nbsp; Next.js + FastAPI + faster-whisper + Gemma 3 + Indic Parler-TTS
        </p>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'rgba(255,243,224,0.18)',
          letterSpacing: '0.04em',
        }}>
          World&apos;s first AI live match commentary in a Schedule VIII Indian language - 100% free &amp; open-source
        </p>
      </motion.div>
    </footer>
  );
}
