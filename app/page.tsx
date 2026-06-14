'use client';

import { useState, useRef, useEffect } from 'react';
import { UploadZone } from '@/components/UploadZone';
import { LoadingPoetic } from '@/components/LoadingPoetic';
import { ImmersiveView } from '@/components/ImmersiveView';
import { SaveButton } from '@/components/SaveButton';
import type { MatchResult } from '@/lib/types';

type Phase = 'upload' | 'loading' | 'result';

function InkBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ background: 'var(--ink-deep)' }}
    >
      {/* Slow-moving gradient orbs */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, rgba(201,169,97,1) 0%, transparent 70%)',
          top: '-10%',
          left: '-10%',
          animation: 'float 20s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.02]"
        style={{
          background: 'radial-gradient(circle, rgba(184,60,47,1) 0%, transparent 70%)',
          bottom: '-5%',
          right: '-5%',
          animation: 'float 25s ease-in-out infinite reverse',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full opacity-[0.02]"
        style={{
          background: 'radial-gradient(circle, rgba(168,160,140,1) 0%, transparent 70%)',
          top: '40%',
          left: '60%',
          animation: 'float 18s ease-in-out infinite 2s',
        }}
      />
    </div>
  );
}

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [image, setImage] = useState('');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  // Inject float animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(30px, -30px) scale(1.05); }
        66% { transform: translate(-20px, 20px) scale(0.95); }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleImageSelect = async (original: string, forApi: string) => {
    setImage(original);
    setPhase('loading');
    setError('');

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: forApi }),
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
      let msg = '请求失败，请稍后再试';
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        if (message.includes('fetch') || message.includes('network') || message.includes('failed to fetch')) {
          msg = '网络连接失败，请检查网络后重试';
        } else if (message.includes('timeout') || message.includes('abort')) {
          msg = '请求超时，图片可能过大，请尝试压缩后重试';
        } else if (message.includes('413') || message.includes('payload too large')) {
          msg = '图片过大，请压缩后重试';
        } else if (message.includes('500') || message.includes('internal error')) {
          msg = '服务器处理失败，请稍后再试';
        }
      }
      setError(msg);
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
    <main className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--ink-deep)' }}
    >
      {/* Background */}
      {phase === 'upload' && <InkBackground />}

      {/* Rice paper noise overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`,
        }}
      />

      {phase === 'upload' && (
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
          {/* Brand */}
          <div className="text-center mb-16"
            style={{
              opacity: 0,
              animation: 'ink-bloom 1s ease-out 0.2s forwards',
            }}
          >
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-serif tracking-[0.2em] mb-6 leading-[1.15] pt-2"
              style={{ color: 'var(--paper)' }}
            >
              诗入画
            </h1>
            <div className="w-16 h-px mx-auto mb-6"
              style={{ backgroundColor: 'var(--gold)', opacity: 0.3 }}
            />
            <p className="text-base md:text-lg tracking-[0.3em] font-serif"
              style={{ color: 'var(--paper-dim)' }}
            >
              上传图片，匹配唐诗名句
            </p>
          </div>

          {/* Upload */}
          <div
            style={{
              opacity: 0,
              animation: 'ink-bloom 1s ease-out 0.6s forwards',
            }}
          >
            <UploadZone onImageSelect={handleImageSelect} />
          </div>

          {error && (
            <p className="mt-10 text-sm tracking-wide"
              style={{ color: 'var(--cinnabar)', opacity: 0.8 }}
            >
              {error}
            </p>
          )}

          {/* Footer credit */}
          <p className="absolute bottom-8 text-xs tracking-[0.2em]"
            style={{ color: 'var(--ink-mid)' }}
          >
            powered by Gemini 2.5 Flash
          </p>
        </div>
      )}

      {phase === 'loading' && (
        <div className="relative z-10 h-full">
          <LoadingPoetic />
        </div>
      )}

      {phase === 'result' && result && (
        <div className="relative h-full">
          <ImmersiveView image={image} result={result} captureRef={resultRef} />

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
