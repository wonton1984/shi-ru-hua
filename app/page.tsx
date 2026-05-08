'use client';

import { useState, useRef } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { LoadingPoetic } from '@/components/LoadingPoetic';
import { ImmersiveView } from '@/components/ImmersiveView';
import { SaveButton } from '@/components/SaveButton';
import type { MatchResult } from '@/lib/types';

type Phase = 'upload' | 'loading' | 'result';

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [image, setImage] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const handleImageSelect = async (img: string) => {
    setImage(img);
    setPhase('loading');
    setError('');

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: img }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      const data = await res.json() as MatchResult;
      setResult(data);
      setPhase('result');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : '请求失败');
      setPhase('upload');
    }
  };

  const handleReset = () => {
    setPhase('upload');
    setImage('');
    setResult(null);
    setError('');
  };

  return (
    <main className="w-full h-screen bg-neutral-950">
      {phase === 'upload' && (
        <div className="flex flex-col items-center justify-center h-full px-4">
          {/* Brand */}
          <div className="text-center mb-10">
            <h1 className="text-5xl font-serif text-white tracking-[0.15em] mb-3"
            >
              诗入画
            </h1>
            <div className="w-8 h-px bg-white/20 mx-auto mb-3" />
            <p className="text-white/30 text-sm tracking-[0.2em] font-serif"
            >
              上传图片，匹配唐诗名句
            </p>
          </div>

          <UploadZone onImageSelect={handleImageSelect} />

          {error && (
            <p className="mt-6 text-red-400/80 text-sm tracking-wide"
            >{error}</p>
          )}

          <p className="mt-10 text-white/15 text-xs tracking-wider"
    >
             powered by Kimi K2.6
          </p>
        </div>
      )}

      {phase === 'loading' && (
        <div className="h-full">
          <LoadingPoetic />
        </div>
      )}

      {phase === 'result' && result && (
        <div className="relative h-full">
          <div ref={resultRef} className="h-full">
            <ImmersiveView image={image} result={result} />
          </div>

          {/* Top-right controls */}
          <div className="absolute top-5 right-5 flex gap-2 z-10"
      >
            <SaveButton
              targetRef={resultRef}
              filename={`${result.author}-${result.title}-${Date.now()}.png`}
            />
            <button
              onClick={handleReset}
              className="
                px-4 py-2 rounded-lg
                bg-black/30 hover:bg-black/50
                backdrop-blur-md
                text-white/70 hover:text-white text-sm font-serif
                border border-white/10 hover:border-white/20
                transition-all duration-300
              "
            >
              再来一张
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
