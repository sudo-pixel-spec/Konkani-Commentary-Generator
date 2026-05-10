import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParallax } from './ParallaxProvider';

function CrowdParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${50 + Math.random() * 50}%`,
      size: 2 + Math.random() * 4,
      duration: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 3}s`,
    }));
  }, []);

  return (
    <div className="crowd-particles">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            ['--d' as string]: p.duration,
            ['--delay' as string]: p.delay,
            backgroundColor: Math.random() > 0.5 ? 'var(--amber)' : 'var(--coral)',
          }}
        />
      ))}
    </div>
  );
}

export default function Hero3D() {
  const { scrollY } = useParallax();

  return (
    <section className="hero-scene" id="hero">
      <motion.div 
        className="hero-bg-photo"
        style={{ 
          y: scrollY * 0.4,
          scale: 1 + scrollY * 0.0005,
        }}
      >
        <img src="/assets/stadium.png" alt="Goan Football Stadium at Sunset" />
        <div className="vignette-heavy" />
      </motion.div>

      <CrowdParticles />

      <motion.div
        className="hero-content parallax-layer"
        style={{ y: scrollY * -0.2, opacity: 1 - scrollY * 0.002 }}
      >
        <motion.div 
          className="hero-eyebrow"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          ⚽ Estádio Jawaharlal Nehru · Goa, India · Live
        </motion.div>

        <h1 className="hero-title">
          <motion.span 
            className="thin"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Hear the Game
          </motion.span>
          <motion.span 
            className="bold"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.6, type: 'spring' }}
          >
            IN GOA
          </motion.span>
          <motion.span 
            className="sub-word"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            Amchi Goa, Amchi
          </motion.span>
        </h1>

        <motion.p 
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Where football meets the coast. Upload your match clips and hear them reborn in live, expressive Konkani commentary, translated and voiced with the soul of the terraces.
        </motion.p>

        <motion.div
          style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', marginBottom: '3rem' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          {[
            { num: '100%', label: 'Free & Local' },
            { num: '3', label: 'AI Models' },
            { num: '∞', label: 'Passion' },
          ].map(({ num, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: '3rem',
                color: 'var(--amber)',
                lineHeight: 1,
                letterSpacing: '0.04em',
                textShadow: '0 0 30px rgba(255,179,71,0.5)',
              }}>{num}</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(255,243,224,0.6)',
                marginTop: 8,
              }}>{label}</div>
            </div>
          ))}
        </motion.div>

        <motion.a 
          href="#demo" 
          className="cta-btn"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.4 }}
        >
          Enter the Stadium ↓
        </motion.a>
      </motion.div>
      
      <style jsx>{`
        .hero-bg-photo {
          position: absolute;
          inset: -10%;
          z-index: 0;
          pointer-events: none;
        }
        .hero-bg-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: contrast(1.1) brightness(0.7);
        }
        .vignette-heavy {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 40%, transparent 20%, rgba(10,14,26,0.9) 100%);
        }
      `}</style>
    </section>
  );
}
