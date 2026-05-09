import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useParallax } from './ParallaxProvider';

function CrowdParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${55 + Math.random() * 35}%`,
      size: 2 + Math.random() * 3,
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
      <div className="hero-bg">
        <div className="sky-gradient" />

        <svg
          className="parallax-layer"
          style={{
            position: 'absolute',
            bottom: '27%',
            right: '25%',
            opacity: 0.15,
            width: 60,
            transform: `translate3d(0, ${scrollY * -0.05}px, 0)`,
          }}
          viewBox="0 0 60 80"
          fill="rgba(255,243,224,0.8)"
        >
          <rect x="18" y="45" width="24" height="35" rx="2" fill="rgba(255,243,224,0.5)" />
          <rect x="22" y="30" width="16" height="20" fill="rgba(255,243,224,0.5)" />
          <path d="M16 30 Q30 10 44 30Z" fill="rgba(255,243,224,0.6)" />
          <rect x="28" y="0" width="4" height="12" fill="rgba(255,243,224,0.8)" />
          <rect x="24" y="6" width="12" height="3" fill="rgba(255,243,224,0.8)" />
        </svg>

        <svg
          className="stadium-wireframe parallax-layer"
          style={{ transform: `translate3d(-50%, ${scrollY * -0.12}px, 0)` }}
          viewBox="0 0 700 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="350" cy="200" rx="320" ry="70" stroke="rgba(255,179,71,0.6)" strokeWidth="2" fill="rgba(0,201,167,0.03)" />
          <path d="M30 200 Q50 120 350 100 Q650 120 670 200" stroke="rgba(255,179,71,0.5)" strokeWidth="2" fill="rgba(255,107,53,0.04)" />
          <path d="M30 200 L30 240 Q350 260 670 240 L670 200" stroke="rgba(255,179,71,0.3)" strokeWidth="1.5" fill="rgba(10,14,26,0.5)" />
          <rect x="300" y="180" width="100" height="40" rx="4" stroke="rgba(255,243,224,0.15)" strokeWidth="1.5" fill="rgba(10,14,26,0.3)" />
          <line x1="350" y1="90" x2="350" y2="180" stroke="rgba(255,243,224,0.15)" strokeWidth="1" />
          <path d="M100 190 L100 155 L160 145 L160 190" stroke="rgba(255,179,71,0.3)" strokeWidth="1.5" fill="rgba(255,107,53,0.06)" />
          <path d="M600 190 L600 155 L540 145 L540 190" stroke="rgba(255,179,71,0.3)" strokeWidth="1.5" fill="rgba(255,107,53,0.06)" />
          <path d="M160 145 L350 118 L540 145" stroke="rgba(255,179,71,0.4)" strokeWidth="2" fill="none" />
          <line x1="350" y1="118" x2="350" y2="90" stroke="rgba(255,179,71,0.4)" strokeWidth="1.5" />
          <ellipse cx="350" cy="88" rx="20" ry="8" stroke="rgba(255,179,71,0.4)" strokeWidth="1.5" fill="none" />
        </svg>

        <svg
          className="palm-tree parallax-layer"
          style={{
            left: '5%', width: 120, height: 280, bottom: '18%',
            transform: `translate3d(0, ${scrollY * -0.18}px, 0)`,
          }}
          viewBox="0 0 120 280" fill="none"
        >
          <line x1="60" y1="280" x2="65" y2="120" stroke="#1a3a1a" strokeWidth="8" strokeLinecap="round" />
          <ellipse cx="65" cy="118" rx="4" ry="6" fill="#1a3a1a" />
          <path d="M65 115 Q30 90 10 60 Q40 80 65 110" fill="#1e4d1e" opacity="0.9" />
          <path d="M65 112 Q100 88 118 55 Q90 78 65 108" fill="#1e4d1e" opacity="0.9" />
          <path d="M65 118 Q20 110 5 90 Q35 105 63 116" fill="#16401a" opacity="0.8" />
          <path d="M65 118 Q110 108 122 88 Q92 104 67 115" fill="#16401a" opacity="0.8" />
          <path d="M65 120 Q50 145 38 170 Q52 148 64 122" fill="#1e4d1e" opacity="0.7" />
          <circle cx="42" cy="118" r="7" fill="#c68a1a" opacity="0.6" />
        </svg>

        <svg
          className="palm-tree parallax-layer"
          style={{
            right: '8%', width: 100, height: 240, bottom: '20%',
            transform: `translate3d(0, ${scrollY * -0.22}px, 0)`,
          }}
          viewBox="0 0 100 240" fill="none"
        >
          <line x1="50" y1="240" x2="52" y2="100" stroke="#1a3a1a" strokeWidth="7" strokeLinecap="round" />
          <path d="M52 98 Q20 75 2 45 Q30 68 52 94" fill="#1e4d1e" opacity="0.9" />
          <path d="M52 95 Q84 72 98 42 Q75 65 52 91" fill="#1e4d1e" opacity="0.9" />
          <path d="M52 100 Q12 95 0 76 Q28 90 50 98" fill="#16401a" opacity="0.8" />
          <path d="M52 100 Q92 93 102 73 Q78 88 54 97" fill="#16401a" opacity="0.8" />
        </svg>

        <svg
          className="palm-tree parallax-layer"
          style={{
            left: '18%', width: 80, height: 200, bottom: '22%',
            animationDelay: '-1s',
            transform: `translate3d(0, ${scrollY * -0.15}px, 0)`,
          }}
          viewBox="0 0 80 200" fill="none"
        >
          <line x1="40" y1="200" x2="42" y2="80" stroke="#1a3a1a" strokeWidth="6" strokeLinecap="round" />
          <path d="M42 78 Q15 58 2 32 Q22 52 41 74" fill="#1e4d1e" opacity="0.85" />
          <path d="M42 76 Q68 55 78 28 Q60 50 42 72" fill="#1e4d1e" opacity="0.85" />
          <path d="M42 80 Q8 76 0 60 Q22 72 40 78" fill="#16401a" opacity="0.75" />
          <path d="M42 80 Q76 74 82 56 Q62 70 44 77" fill="#16401a" opacity="0.75" />
        </svg>

        <div
          className="sea-layer parallax-layer"
          style={{ transform: `translate3d(0, ${scrollY * -0.08}px, 0)` }}
        >
          <div className="sea-shimmer" />
        </div>

        <CrowdParticles />

        <div className="vignette" />
      </div>

      <div
        className="hero-content parallax-layer"
        style={{ transform: `translate3d(0, ${scrollY * 0.35}px, 0)` }}
      >
        <div className="hero-eyebrow">
          ⚽ Estádio Jawaharlal Nehru · Goa, India · Live
        </div>

        <h1 className="hero-title">
          <span className="thin">Hear the Game</span>
          <span className="bold">IN GOA</span>
          <span className="sub-word">Amchi Goa, Amchi</span>
        </h1>

        <p className="hero-subtitle">
          Where football meets the coast. Upload your match clips and hear them reborn,
          live, expressive Konkani commentary, translated and voiced with the soul of the terraces.
          Local AI. Your machine. Pure Goa.
        </p>

        <motion.div
          style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap', marginBottom: 40 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
        >
          {[
            { num: '100%', label: 'Free & Local' },
            { num: '3', label: 'AI Models' },
            { num: '∞', label: 'Commentary' },
          ].map(({ num, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-bebas)',
                fontSize: 42,
                color: 'var(--amber)',
                lineHeight: 1,
                letterSpacing: '0.04em',
                textShadow: '0 0 30px rgba(255,179,71,0.3)',
              }}>{num}</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(255,243,224,0.4)',
                marginTop: 4,
              }}>{label}</div>
            </div>
          ))}
        </motion.div>

        <a href="#demo" className="cta-btn">
          Enter the Stadium ↓
        </a>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          style={{
            marginTop: 56,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.2em',
            color: 'rgba(255,243,224,0.25)',
            textTransform: 'uppercase',
          }}>
            Scroll to explore
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: 'rgba(255,243,224,0.25)', fontSize: 18 }}
          >
            ↓
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
