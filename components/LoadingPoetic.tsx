'use client';

import { useState, useEffect } from 'react';

const MESSAGES = [
  '正在沉吟…',
  '搜遍唐诗…',
  '抚卷思索…',
  '墨香渐起…',
  '落笔成章…',
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
      }, 400);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8"
    >
      {/* Elegant spinner */}
      <div className="relative w-10 h-10"
      >
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div className="absolute inset-0 rounded-full border-t border-white/60 animate-spin" />
      </div>

      {/* Fading text */}
      <p
        className={`
          text-lg font-serif text-white/50 tracking-[0.3em]
          transition-all duration-500
          ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
        `}
      >
        {MESSAGES[index]}
      </p>
    </div>
  );
}
