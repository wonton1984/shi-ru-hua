'use client';

import { useEffect, useState, useRef } from 'react';
import type { MatchResult, GridPosition } from '@/lib/types';

interface ImmersiveViewProps {
  image: string;
  result: MatchResult;
}

const PLACEMENT_STYLES: Record<GridPosition, React.CSSProperties> = {
  'top-left':    { top: '5%', left: '5%', textAlign: 'left' },
  'top':         { top: '5%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
  'top-right':   { top: '5%', right: '5%', textAlign: 'right' },
  'left':        { top: '50%', left: '5%', transform: 'translateY(-50%)', textAlign: 'left' },
  'center':      { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' },
  'right':       { top: '50%', right: '5%', transform: 'translateY(-50%)', textAlign: 'right' },
  'bottom-left': { bottom: '8%', left: '5%', textAlign: 'left' },
  'bottom':      { bottom: '8%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
  'bottom-right':{ bottom: '8%', right: '5%', textAlign: 'right' },
};

function getWritingMode(placement: GridPosition): 'horizontal-tb' | 'vertical-rl' {
  if (placement === 'left' || placement === 'right') return 'vertical-rl';
  return 'horizontal-tb';
}

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
        resolve(avg > 128 ? 'light' : 'dark');
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
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    sampleBrightness(image, result.text_placement).then(setBrightness);
  }, [image, result.text_placement]);

  const writingMode = getWritingMode(result.text_placement);
  const isCorner = result.text_placement.includes('-');
  const isLight = brightness === 'light';

  const textColor = isLight
    ? 'text-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]'
    : 'text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]';

  const bgOverlay = isLight
    ? 'bg-white/20 backdrop-blur-sm'
    : 'bg-black/20 backdrop-blur-sm';

  return (
    <div className="relative w-full h-full overflow-hidden">
      <img
        ref={imgRef}
        src={image}
        alt="Uploaded"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className={`absolute p-4 rounded-lg ${bgOverlay} ${textColor}`}
        style={{
          ...PLACEMENT_STYLES[result.text_placement],
          writingMode,
        }}
      >
        <p
          className={`font-serif leading-relaxed ${
            isCorner ? 'text-lg' : writingMode === 'vertical-rl' ? 'text-2xl' : 'text-3xl'
          }`}
        >
          {result.line}
        </p>
        <p className={`mt-3 text-sm opacity-80 ${writingMode === 'vertical-rl' ? 'mt-0 ml-3' : ''}`}>
          — {result.author}《{result.title}》
        </p>
      </div>
    </div>
  );
}
