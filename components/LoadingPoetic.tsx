'use client';

import { useState, useEffect } from 'react';

const MESSAGES = [
  '墨香渐起',
  '沉吟推敲',
  '抚卷寻章',
  '落笔成章',
  '诗成画卷',
];

export function LoadingPoetic() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % MESSAGES.length);
        setFade(true);
      }, 500);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-10">
      {/* Ink drop animation */}
      <div className="relative w-3 h-3">
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ backgroundColor: 'var(--paper)', opacity: 0.08, animationDuration: '2s' }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: 'var(--paper-dim)', opacity: 0.3 }}
        />
      </div>

      {/* Fading text */}
      <p
        className={`text-base font-serif tracking-[0.4em] transition-all duration-500 ${
          fade ? 'opacity-40 translate-y-0' : 'opacity-0 translate-y-1'
        }`}
        style={{ color: 'var(--paper-dim)' }}
      >
        {MESSAGES[index]}
      </p>

      {/* Subtle progress line */}
      <div className="w-16 h-px relative overflow-hidden" style={{ backgroundColor: 'var(--ink-mid)', opacity: 0.3 }}>
        <div
          className="absolute inset-y-0 left-0 w-1/3 animate-pulse"
          style={{ backgroundColor: 'var(--paper)', opacity: 0.15 }}
        />
      </div>
    </div>
  );
}
