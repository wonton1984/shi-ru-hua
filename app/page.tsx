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
    <main className="w-full h-screen bg-neutral-900">
      {phase === 'upload' && (
        <div className="flex flex-col items-center justify-center h-full px-4">
          <h1 className="text-4xl font-serif text-white mb-2">诗入画</h1>
          <p className="text-white/40 text-sm mb-8">上传图片，匹配唐诗名句</p>
          <UploadZone onImageSelect={handleImageSelect} />
          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}
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
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <SaveButton
              targetRef={resultRef}
              filename={`唐诗-${result.author}-${result.title}-${Date.now()}.png`}
            />
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm font-serif border border-white/20 transition-colors"
            >
              重新开始
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
