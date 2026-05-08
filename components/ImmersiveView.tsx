'use client';

import { useEffect, useState } from 'react';
import type { MatchResult, GridPosition } from '@/lib/types';

interface ImmersiveViewProps {
  image: string;
  result: MatchResult;
}

const PLACEMENT_CONFIG: Record<
  GridPosition,
  { style: React.CSSProperties; gradient: string; isVertical: boolean; alignClass: string }
> = {
  'top-left': {
    style: { top: '8%', left: '6%' },
    gradient: 'linear-gradient(to bottom, rgba(20,18,16,0.5) 0%, transparent 40%)',
    isVertical: false,
    alignClass: 'text-left',
  },
  'top': {
    style: { top: '8%', left: '50%', transform: 'translateX(-50%)' },
    gradient: 'linear-gradient(to bottom, rgba(20,18,16,0.5) 0%, transparent 40%)',
    isVertical: false,
    alignClass: 'text-center',
  },
  'top-right': {
    style: { top: '8%', right: '6%' },
    gradient: 'linear-gradient(to bottom, rgba(20,18,16,0.5) 0%, transparent 40%)',
    isVertical: false,
    alignClass: 'text-right',
  },
  'left': {
    style: { top: '50%', left: '5%', transform: 'translateY(-50%)' },
    gradient: 'linear-gradient(to right, rgba(20,18,16,0.35) 0%, transparent 50%)',
    isVertical: true,
    alignClass: 'text-left',
  },
  'center': {
    style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    gradient: '',
    isVertical: false,
    alignClass: 'text-center',
  },
  'right': {
    style: { top: '50%', right: '5%', transform: 'translateY(-50%)' },
    gradient: 'linear-gradient(to left, rgba(20,18,16,0.35) 0%, transparent 50%)',
    isVertical: true,
    alignClass: 'text-right',
  },
  'bottom-left': {
    style: { bottom: '10%', left: '6%' },
    gradient: 'linear-gradient(to top, rgba(20,18,16,0.6) 0%, transparent 50%)',
    isVertical: false,
    alignClass: 'text-left',
  },
  'bottom': {
    style: { bottom: '10%', left: '50%', transform: 'translateX(-50%)' },
    gradient: 'linear-gradient(to top, rgba(20,18,16,0.6) 0%, transparent 50%)',
    isVertical: false,
    alignClass: 'text-center',
  },
  'bottom-right': {
    style: { bottom: '10%', right: '6%' },
    gradient: 'linear-gradient(to top, rgba(20,18,16,0.6) 0%, transparent 50%)',
    isVertical: false,
    alignClass: 'text-right',
  },
};

function sampleBrightness(imageSrc: string, placement: GridPosition): Promise<'light' | 'dark'> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const regions: Record<GridPosition, [number, number, number, number]> = {
        'top-left': [0, 0, 1/3, 1/3], 'top': [1/3, 0, 2/3, 1/3], 'top-right': [2/3, 0, 1, 1/3],
        'left': [0, 1/3, 1/3, 2/3], 'center': [1/3, 1/3, 2/3, 2/3], 'right': [2/3, 1/3, 1, 2/3],
        'bottom-left': [0, 2/3, 1/3, 1], 'bottom': [1/3, 2/3, 2/3, 1], 'bottom-right': [2/3, 2/3, 1, 1],
      };

      const [x1, y1, x2, y2] = regions[placement];
      const sx = Math.floor(x1 * canvas.width);
      const sy = Math.floor(y1 * canvas.height);
      const ex = Math.floor(x2 * canvas.width);
      const ey = Math.floor(y2 * canvas.height);

      try {
        const imageData = ctx.getImageData(sx, sy, ex - sx, ey - sy);
        let total = 0;
        let count = 0;
        const stepX = Math.max(1, Math.floor((ex - sx) / 6));
        const stepY = Math.max(1, Math.floor((ey - sy) / 6));

        for (let y = 0; y < ey - sy; y += stepY) {
          for (let x = 0; x < ex - sx; x += stepX) {
            const i = (y * (ex - sx) + x) * 4;
            const lum = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
            total += lum;
            count++;
          }
        }

        const avg = total / count;
        resolve(avg > 150 ? 'light' : 'dark');
      } catch {
        resolve('dark');
      }
    };
    img.onerror = () => resolve('dark');
    img.src = imageSrc;
  });
}

export function ImmersiveView({ image, result }: ImmersiveViewProps) {
  const [brightness, setBrightness] = useState<'light' | 'dark'>('dark');
  const [visible, setVisible] = useState(false);

  const config = PLACEMENT_CONFIG[result.text_placement];
  const isVertical = config.isVertical;

  useEffect(() => {
    setVisible(false);
    sampleBrightness(image, result.text_placement).then((b) => {
      setBrightness(b);
      requestAnimationFrame(() => {
        setTimeout(() => setVisible(true), 200);
      });
    });
  }, [image, result.text_placement]);

  const textColor = brightness === 'light' ? 'rgba(30,25,20,0.95)' : 'rgba(232,224,208,0.95)';
  const inkShadow = brightness === 'light'
    ? '0 1px 8px rgba(255,255,255,0.6), 0 0 40px rgba(255,255,255,0.2)'
    : '0 2px 20px rgba(0,0,0,0.9), 0 0 60px rgba(0,0,0,0.4), 0 0 120px rgba(0,0,0,0.15)';

  // Split line into characters for staggered animation
  const chars = result.line.split('');

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background image with subtle zoom */}
      <img
        src={image}
        alt="Uploaded"
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] ease-out ${
          visible ? 'scale-100' : 'scale-105'
        }`}
      />

      {/* Gradient overlay for readability */}
      {config.gradient && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: config.gradient }}
        />
      )}

      {/* Poem text container */}
      <div
        className={`absolute ${config.alignClass}`}
        style={{
          ...config.style,
          writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
        }}
      >
        {/* Poem line - character by character ink bloom */}
        <div className={isVertical ? 'h-auto' : ''}>
          <p
            className={`font-serif leading-relaxed ${
              isVertical
                ? 'text-2xl md:text-3xl lg:text-4xl tracking-[0.25em]'
                : 'text-3xl md:text-4xl lg:text-5xl tracking-[0.15em]'
            }`}
            style={{
              color: textColor,
              textShadow: inkShadow,
            }}
          >
            {chars.map((char, i) => (
              <span
                key={i}
                className="inline-block animate-ink-bloom"
                style={{ animationDelay: `${0.3 + i * 0.06}s` }}
              >
                {char}
              </span>
            ))}
          </p>
        </div>

        {/* Author & title - seal style */}
        <div
          className="animate-ink-bloom mt-5"
          style={{ animationDelay: `${0.3 + chars.length * 0.06 + 0.3}s` }}
        >
          <div
            className={`inline-flex items-center gap-2 ${isVertical ? 'mt-0 ml-5 flex-col' : ''}`}
          >
            {/* Small seal dot */}
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--cinnabar)', opacity: 0.7 }}
            />
            <span
              className="text-sm md:text-base tracking-[0.15em] font-serif"
              style={{
                color: brightness === 'light' ? 'rgba(30,25,20,0.6)' : 'rgba(232,224,208,0.55)',
                textShadow: brightness === 'dark' ? '0 1px 10px rgba(0,0,0,0.7)' : '0 1px 6px rgba(255,255,255,0.4)',
              }}
            >
              {result.author} · {result.title}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
