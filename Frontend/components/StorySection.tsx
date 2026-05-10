import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface StorySectionProps {
  imageSrc: string;
  title: React.ReactNode;
  text: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

export default function StorySection({ imageSrc, title, text, align = 'left' }: StorySectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['-20%', '20%']);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1]);

  return (
    <section ref={containerRef} className="story-section">
      <motion.div className="story-bg" style={{ y, scale }}>
        <img src={imageSrc} alt="" className="story-img" />
        <div className="story-overlay" />
      </motion.div>

      <div className={`story-content align-${align}`}>
        <motion.div className="story-text-box" style={{ opacity }}>
          <h2 className="story-title">{title}</h2>
          <div className="story-body">{text}</div>
        </motion.div>
      </div>

      <style jsx>{`
        .story-section {
          position: relative;
          min-height: 120vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .story-bg {
          position: absolute;
          inset: -20%;
          z-index: 0;
          will-change: transform;
        }
        .story-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.8) contrast(1.1);
        }
        .story-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            var(--bg) 0%,
            rgba(10, 14, 26, 0.4) 30%,
            rgba(10, 14, 26, 0.4) 70%,
            var(--bg) 100%
          );
        }
        .story-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1200px;
          padding: 0 2rem;
          display: flex;
        }
        .align-left { justify-content: flex-start; }
        .align-right { justify-content: flex-end; }
        .align-center { justify-content: center; text-align: center; }

        .story-text-box {
          max-width: 600px;
          background: rgba(10, 14, 26, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          padding: 3rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }
        .story-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.1;
          margin-bottom: 1.5rem;
          color: var(--cream);
        }
        .story-body {
          font-family: var(--font-body);
          font-size: 1.1rem;
          line-height: 1.8;
          color: rgba(255, 243, 224, 0.85);
        }
      `}</style>
    </section>
  );
}
