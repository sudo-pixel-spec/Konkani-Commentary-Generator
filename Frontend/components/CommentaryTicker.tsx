import React from 'react';
import { motion } from 'framer-motion';

const TICKER_ITEMS = [
  '⚽ GOAL! Edu Bedia strikes from the top of the box!',
  '🟨 Yellow card for the midfielder - referee losing patience',
  '🔴 Churchill Brothers pushing for the equalizer',
  '💨 What a save! The keeper denies FC Goa at point-blank range',
  '🎯 Corner kick - the stadium holds its breath',
  '🔥 End-to-end action at Fatorda - the crowd is electric',
  '⚡ Near miss! The ball clips the crossbar and over',
  '🎙️ Amchi Maati, Amchi Maand - this is Goan football at its finest',
];

export default function CommentaryTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div style={{
      width: '100%',
      background: 'rgba(255,107,26,0.06)',
      borderTop: '1px solid rgba(255,107,26,0.15)',
      borderBottom: '1px solid rgba(255,107,26,0.15)',
      padding: '12px 0',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 80,
        background: 'linear-gradient(90deg, rgba(13,27,42,1) 0%, transparent 100%)',
        zIndex: 2, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
        background: 'linear-gradient(270deg, rgba(13,27,42,1) 0%, transparent 100%)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      <div className="ticker-track">
        {doubled.map((item, i) => (
          <React.Fragment key={i}>
            <span style={{
              paddingRight: 32,
              fontSize: 13,
              color: 'rgba(253,246,227,0.65)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
            }}>
              {item}
            </span>
            <span style={{
              paddingRight: 32,
              color: 'var(--saffron)',
              opacity: 0.5,
              fontSize: 10,
            }}>◆</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
