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
    <main className="w-full h-screen relative" style={{ backgroundColor: 'var(--ink-deep)' }}>
      {phase === 'upload' && (
        <div className="flex flex-col items-center justify-center h-full px-4">
          {/* Brand seal */}
          <div className="text-center mb-12">
            <h1
              className="text-6xl font-serif tracking-[0.25em] mb-4"
              style={{ color: 'var(--paper)' }}
            >
              诗入画
            </h1>
            <div
              className="w-12 h-px mx-auto mb-4"
              style={{ backgroundColor: 'var(--gold)', opacity: 0.4 }}
            />
            <p
              className="text-sm tracking-[0.3em] font-serif"
              style={{ color: 'var(--paper-dim)' }}
            >
              上传图片，匹配唐诗名句
            </p>
          </div>

          <UploadZone onImageSelect={handleImageSelect} />

          {error && (
            <p className="mt-8 text-sm tracking-wide" style={{ color: 'var(--cinnabar)' }}>
              {error}
            </p>
          )}

          <p
            className="mt-12 text-xs tracking-[0.2em]"
            style={{ color: 'var(--ink-mid)' }}
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

          {/* Controls */}
          <div className="absolute top-5 right-5 flex gap-3 z-10">
            <SaveButton
              targetRef={resultRef}
              filename={`${result.author}-${result.title}-${Date.now()}.png`}
            />
            <button
              onClick={handleReset}
              className="
                px-5 py-2.5 rounded-sm
                text-sm font-serif tracking-wider
                border transition-all duration-500
                hover:scale-105
              "
              style={{
                backgroundColor: 'rgba(20, 18, 16, 0.6)',
                borderColor: 'var(--ink-mid)',
                color: 'var(--paper-dim)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold)';
                e.currentTarget.style.color = 'var(--paper)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--ink-mid)';
                e.currentTarget.style.color = 'var(--paper-dim)';
              }}
            >
              再来一张
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
