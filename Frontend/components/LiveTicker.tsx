import React from 'react';

const MATCHES = [
  { home: 'FC Goa', away: 'Mumbai City', hs: 2, as: 1, min: 67, goa: true },
  { home: 'Churchill Bros', away: 'Dempo SC', hs: 0, as: 0, min: 34, goa: true },
  { home: 'Sporting Clube', away: 'Salgaocar', hs: 1, as: 2, min: 78, goa: true },
  { home: 'Bengaluru FC', away: 'Kerala Blasters', hs: 1, as: 1, min: 55, goa: false },
  { home: 'Mohun Bagan', away: 'East Bengal', hs: 3, as: 2, min: 89, goa: false },
];

export default function LiveTicker() {
  const doubled = [...MATCHES, ...MATCHES];

  return (
    <div className="live-ticker">
      <div className="ticker-inner">
        <div className="live-badge">
          <span className="live-dot" />
          LIVE KHEL
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="ticker-track">
            {doubled.map((m, i) => (
              <React.Fragment key={i}>
                <span className="match-chip">
                  {m.goa && <span style={{ fontSize: '0.9rem' }}>🌴</span>}
                  <span>{m.home}</span>
                  <span className="score">{m.hs} - {m.as}</span>
                  <span>{m.away}</span>
                  <span className="minute">{m.min}&apos;</span>
                </span>
                <span className="match-sep">│</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
