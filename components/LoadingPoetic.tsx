'use client';

import { useState, useEffect } from 'react';

const MESSAGES = [
  'AI 正在沉吟…',
  '搜遍唐诗三百首…',
  '遥知兄弟登高处…',
  '众里寻他千百度…',
  '山重水复疑无路…',
];

export function LoadingPoetic() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      <p className="text-xl font-serif text-white/70 animate-pulse">
        {MESSAGES[index]}
      </p>
    </div>
  );
}
