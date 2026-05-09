import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(10,14,26,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'background 0.4s ease, border-color 0.4s ease, backdrop-filter 0.4s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>🎙️</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          letterSpacing: '0.12em',
          color: 'var(--cream)',
        }}>
          KONKANI <span style={{ color: 'var(--coral)' }}>COMMENTARY</span>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {[
          { label: 'Demo', href: '#demo' },
          { label: 'How it Works', href: '#how' },
          { label: 'About', href: '#about' },
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            style={{
              color: 'rgba(255,243,224,0.5)',
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              fontWeight: 400,
              textDecoration: 'none',
              transition: 'color 0.2s',
              letterSpacing: '0.05em',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--coral)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,243,224,0.5)')}
          >
            {link.label}
          </a>
        ))}

        <div style={{
          background: 'rgba(255,179,71,0.1)',
          border: '1px solid rgba(255,179,71,0.25)',
          borderRadius: 20,
          padding: '5px 14px',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--amber)',
          fontWeight: 700,
          letterSpacing: '0.06em',
        }}>
          🌴 Made in Goa
        </div>
      </div>
    </motion.nav>
  );
}
