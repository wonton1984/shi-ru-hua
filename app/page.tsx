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
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ background: 'var(--ink-deep)' }}
    >
      {/* Soft warm orb */}
      <div
        className="absolute w-[900px] h-[900px] rounded-full opacity-[0.04]"
        style={{
          background: 'radial-gradient(circle, rgba(201,169,97,1) 0%, transparent 70%)',
          top: '-20%',
          right: '-10%',
          animation: 'float 24s ease-in-out infinite',
        }}
      />
      {/* Cool ink orb */}
      <div
        className="absolute w-[700px] h-[700px] rounded-full opacity-[0.03]"
        style={{
          background: 'radial-gradient(circle, rgba(168,160,140,1) 0%, transparent 70%)',
          bottom: '-15%',
          left: '-5%',
          animation: 'float 28s ease-in-out infinite reverse',
        }}
      />
      {/* Cinnabar accent */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full opacity-[0.025]"
        style={{
          background: 'radial-gradient(circle, rgba(184,60,47,1) 0%, transparent 70%)',
          top: '40%',
          left: '35%',
          animation: 'float 20s ease-in-out infinite 2s',
        }}
      />
    </div>
  );
}

function Seal({ text }: { text: string }) {
  return (
    <div
      className="flex items-center justify-center border-2"
      style={{
        width: 44,
        height: 44,
        borderColor: 'rgba(180, 60, 47, 0.55)',
        color: 'rgba(180, 60, 47, 0.75)',
        fontSize: 14,
        fontFamily: "'Ma Shan Zheng', 'Noto Serif SC', serif",
        letterSpacing: 1,
        writingMode: 'vertical-rl',
        textOrientation: 'upright',
        lineHeight: 1,
        padding: 2,
      }}
    >
      {text}
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
    <main
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--ink-deep)' }}
    >
      {/* Background */}
      {phase === 'upload' && <InkBackground />}

      {/* Rice paper noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[9999]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`,
        }}
      />

      {phase === 'upload' && (
        <div className="relative z-10 flex flex-col md:flex-row w-full h-full">
          {/* Left: Title & intro */}
          <div
            className="flex flex-col justify-end md:justify-center items-center md:items-start px-6 sm:px-8 md:px-16 lg:px-24 pt-16 sm:pt-20 md:pt-0 pb-6 md:pb-0 md:w-[45%] lg:w-[42%]"
            style={{
              opacity: 0,
              animation: 'ink-bloom 1s ease-out 0.2s forwards',
            }}
          >
            {/* Mobile horizontal title */}
            <h1
              className="md:hidden text-5xl sm:text-6xl font-serif tracking-[0.2em] mb-4 sm:mb-6"
              style={{ color: 'var(--paper)', lineHeight: 1.25 }}
            >
              诗入画
            </h1>

            {/* Desktop vertical title */}
            <div className="hidden md:flex items-start gap-6">
              <h1
                className="text-7xl lg:text-8xl xl:text-9xl font-serif tracking-[0.15em] writing-vertical"
                style={{ color: 'var(--paper)', lineHeight: 1.25 }}
              >
                诗入画
              </h1>
              <div className="flex flex-col items-center gap-5 pt-4">
                <div
                  className="w-px h-20"
                  style={{ backgroundColor: 'var(--gold)', opacity: 0.3 }}
                />
                <Seal text="诗意" />
              </div>
            </div>

            <div
              className="mt-4 sm:mt-6 md:mt-12 text-center md:text-left max-w-sm"
              style={{
                opacity: 0,
                animation: 'ink-bloom 1s ease-out 0.6s forwards',
              }}
            >
              <p
                className="text-sm sm:text-base md:text-lg tracking-[0.25em] font-serif mb-3 sm:mb-4"
                style={{ color: 'var(--paper-dim)' }}
              >
                上传图片，匹配唐诗名句
              </p>
              <p
                className="text-xs sm:text-sm leading-relaxed hidden sm:block"
                style={{ color: 'var(--ink-light)' }}
              >
                取一帧光影，寻一句古诗。
                <br />
                让 AI 为画面写一首唐人绝句。
              </p>
            </div>
          </div>

          {/* Right: Upload zone */}
          <div
            className="flex-1 flex items-start md:items-center justify-center px-4 sm:px-6 pb-20 md:pb-0 md:pr-12 lg:pr-24"
            style={{
              opacity: 0,
              animation: 'ink-bloom 1s ease-out 0.8s forwards',
            }}
          >
            <UploadZone onImageSelect={handleImageSelect} />
          </div>

          {error && (
            <p
              className="absolute bottom-24 md:bottom-8 left-0 right-0 text-center text-sm tracking-wide px-6"
              style={{ color: 'var(--cinnabar)', opacity: 0.8 }}
            >
              {error}
            </p>
          )}

          {/* Footer credit */}
          <p
            className="absolute bottom-6 left-0 right-0 text-center text-xs tracking-[0.2em]"
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
