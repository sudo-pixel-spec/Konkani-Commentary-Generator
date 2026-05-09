import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  {
    icon: '🎬',
    title: 'Upload Clip',
    desc: 'Drop any English football video - match highlights, full game, anything with commentary.',
    gradient: 'linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(255,179,71,0.04) 100%)',
    accent: 'var(--coral)',
  },
  {
    icon: '🔄',
    title: 'AI Pipeline',
    desc: 'faster-whisper transcribes → Gemma 3 4B translates → Indic Parler-TTS voices it in Konkani.',
    gradient: 'linear-gradient(135deg, rgba(0,201,167,0.08) 0%, rgba(0,105,148,0.04) 100%)',
    accent: 'var(--teal)',
  },
  {
    icon: '🌴',
    title: 'Konkani Commentary',
    desc: "Hear the match in Goa's language, with culturally authentic voice output. 100% local, 100% free.",
    gradient: 'linear-gradient(135deg, rgba(255,179,71,0.08) 0%, rgba(232,184,75,0.04) 100%)',
    accent: 'var(--amber)',
  },
];

function Card3D({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ delay: index * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        background: step.gradient,
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18,
        padding: '40px 28px',
        textAlign: 'center',
        cursor: 'default',
        transition: 'transform 0.15s ease, box-shadow 0.3s ease, border-color 0.3s ease',
        transformStyle: 'preserve-3d',
      }}
      whileHover={{
        borderColor: 'rgba(255,107,53,0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(255,107,53,0.06)',
      }}
    >
      <div style={{
        fontSize: 48,
        marginBottom: 16,
        transform: 'translateZ(30px)',
      }}>
        {step.icon}
      </div>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 24,
        fontWeight: 700,
        color: 'var(--cream)',
        marginBottom: 12,
        transform: 'translateZ(20px)',
      }}>
        {step.title}
      </div>

      <div style={{
        fontSize: 14,
        color: 'rgba(255,243,224,0.55)',
        lineHeight: 1.7,
        transform: 'translateZ(10px)',
      }}>
        {step.desc}
      </div>

      <div style={{
        width: 40,
        height: 3,
        background: step.accent,
        borderRadius: 2,
        margin: '20px auto 0',
        opacity: 0.6,
      }} />
    </motion.div>
  );
}

export default function HowItWorks3D() {
  return (
    <section id="how" style={{ padding: '80px 0 60px', position: 'relative' }}>
      <div className="container">
        <div className="azulejo-border" style={{ marginBottom: 48 }} />

        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="section-tag">● HOW IT WORKS</span>
          <h2 className="section-title">
            Three Steps to <em>Konkani</em>
          </h2>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          perspective: '1200px',
        }}>
          {STEPS.map((step, i) => (
            <Card3D key={step.title} step={step} index={i} />
          ))}
        </div>

        <div className="azulejo-border" style={{ marginTop: 48 }} />
      </div>
    </section>
  );
}
