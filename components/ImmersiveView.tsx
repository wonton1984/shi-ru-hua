'use client';

import { useEffect, useState, useRef } from 'react';
import type { MatchResult, GridPosition } from '@/lib/types';

interface ImmersiveViewProps {
  image: string;
  result: MatchResult;
}

const PLACEMENT_CONFIG: Record<
  GridPosition,
  { style: React.CSSProperties; gradient: string; writingMode: 'horizontal-tb' | 'vertical-rl'; align: string }
> = {
  'top-left': {
    style: { top: '6%', left: '5%' },
    gradient: 'bg-gradient-to-b from-black/50 via-transparent to-transparent',
    writingMode: 'horizontal-tb',
    align: 'text-left',
  },
  'top': {
    style: { top: '6%', left: '50%', transform: 'translateX(-50%)' },
    gradient: 'bg-gradient-to-b from-black/50 via-transparent to-transparent',
    writingMode: 'horizontal-tb',
    align: 'text-center',
  },
  'top-right': {
    style: { top: '6%', right: '5%' },
    gradient: 'bg-gradient-to-b from-black/50 via-transparent to-transparent',
    writingMode: 'horizontal-tb',
    align: 'text-right',
  },
  'left': {
    style: { top: '50%', left: '4%', transform: 'translateY(-50%)' },
    gradient: 'bg-gradient-to-r from-black/40 via-transparent to-transparent',
    writingMode: 'vertical-rl',
    align: 'text-left',
  },
  'center': {
    style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    gradient: '',
    writingMode: 'horizontal-tb',
    align: 'text-center',
  },
  'right': {
    style: { top: '50%', right: '4%', transform: 'translateY(-50%)' },
    gradient: 'bg-gradient-to-l from-black/40 via-transparent to-transparent',
    writingMode: 'vertical-rl',
    align: 'text-right',
  },
  'bottom-left': {
    style: { bottom: '6%', left: '5%' },
    gradient: 'bg-gradient-to-t from-black/60 via-black/20 to-transparent',
    writingMode: 'horizontal-tb',
    align: 'text-left',
  },
  'bottom': {
    style: { bottom: '6%', left: '50%', transform: 'translateX(-50%)' },
    gradient: 'bg-gradient-to-t from-black/60 via-black/20 to-transparent',
    writingMode: 'horizontal-tb',
    align: 'text-center',
  },
  'bottom-right': {
    style: { bottom: '6%', right: '5%' },
    gradient: 'bg-gradient-to-t from-black/60 via-black/20 to-transparent',
    writingMode: 'horizontal-tb',
    align: 'text-right',
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
        'top-left': [0, 0, 1 / 3, 1 / 3], 'top': [1 / 3, 0, 2 / 3, 1 / 3], 'top-right': [2 / 3, 0, 1, 1 / 3],
        'left': [0, 1 / 3, 1 / 3, 2 / 3], 'center': [1 / 3, 1 / 3, 2 / 3, 2 / 3], 'right': [2 / 3, 1 / 3, 1, 2 / 3],
        'bottom-left': [0, 2 / 3, 1 / 3, 1], 'bottom': [1 / 3, 2 / 3, 2 / 3, 1], 'bottom-right': [2 / 3, 2 / 3, 1, 1],
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
        const stepX = Math.max(1, Math.floor((ex - sx) / 8));
        const stepY = Math.max(1, Math.floor((ey - sy) / 8));

        for (let y = 0; y < ey - sy; y += stepY) {
          for (let x = 0; x < ex - sx; x += stepX) {
            const i = (y * (ex - sx) + x) * 4;
            const lum = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
            total += lum;
            count++;
          }
        }

        const avg = total / count;
        resolve(avg > 140 ? 'light' : 'dark');
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
  const containerRef = useRef<HTMLDivElement>(null);

  const config = PLACEMENT_CONFIG[result.text_placement];
  const isVertical = config.writingMode === 'vertical-rl';

  useEffect(() => {
    setVisible(false);
    sampleBrightness(image, result.text_placement).then((b) => {
      setBrightness(b);
      // Staggered reveal
      requestAnimationFrame(() => {
        setTimeout(() => setVisible(true), 100);
      });
    });
  }, [image, result.text_placement]);

  const textColor = brightness === 'light'
    ? 'text-neutral-900'
    : 'text-white';

  const shadowClass = brightness === 'light'
    ? 'drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)]'
    : 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]';

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Background image */}
      <img
        src={image}
        alt="Uploaded"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient overlay for readability */}
      {config.gradient && (
        <div className={`absolute inset-0 ${config.gradient}`} />
      )}

      {/* Poetry text container */}
      <div
        className={`absolute ${textColor} ${shadowClass} ${config.align}`}
        style={{
          ...config.style,
          writingMode: config.writingMode,
        }}
      >
        {/* Poem line with reveal animation */}
        <div
          className={`
            transition-all duration-1000 ease-out
            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
        >
          <p
            className={`
              font-serif tracking-widest leading-relaxed
              ${isVertical ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-3xl md:text-4xl lg:text-5xl'}
            `}
            style={{
              textShadow: brightness === 'dark'
                ? '0 2px 20px rgba(0,0,0,0.8), 0 0 60px rgba(0,0,0,0.4)'
                : '0 2px 20px rgba(255,255,255,0.6), 0 0 60px rgba(255,255,255,0.3)',
            }}
          >
            {result.line}
          </p>
        </div>

        {/* Author info with delayed reveal */}
        <div
          className={`
            transition-all duration-1000 ease-out delay-300
            ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
          `}
        >
          <p
            className={`
              mt-4 text-sm md:text-base tracking-wider opacity-75
              ${isVertical ? 'mt-0 ml-4' : ''}
            `}
            style={{
              textShadow: brightness === 'dark'
                ? '0 1px 10px rgba(0,0,0,0.7)'
                : '0 1px 10px rgba(255,255,255,0.5)',
            }}
          >
            {result.author} · {result.title}
          </p>
        </div>
      </div>
    </div>
  );
}
