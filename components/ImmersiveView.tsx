'use client';

import { useEffect, useState } from 'react';
import type { MatchResult, GridPosition } from '@/lib/types';

interface ImmersiveViewProps {
  image: string;
  result: MatchResult;
  captureRef?: React.Ref<HTMLDivElement>;
}

const PLACEMENT_STYLES: Record<
  GridPosition,
  { style: React.CSSProperties; alignClass: string }
> = {
  'top-left':    { style: { top: '8%', left: '6%' },  alignClass: 'text-left' },
  'top':         { style: { top: '8%', left: '50%', transform: 'translateX(-50%)' }, alignClass: 'text-center' },
  'top-right':   { style: { top: '8%', right: '6%' }, alignClass: 'text-right' },
  'left':        { style: { top: '50%', left: '5%', transform: 'translateY(-50%)' }, alignClass: 'text-left' },
  'center':      { style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }, alignClass: 'text-center' },
  'right':       { style: { top: '50%', right: '5%', transform: 'translateY(-50%)' }, alignClass: 'text-right' },
  'bottom-left': { style: { bottom: '10%', left: '6%' },  alignClass: 'text-left' },
  'bottom':      { style: { bottom: '10%', left: '50%', transform: 'translateX(-50%)' }, alignClass: 'text-center' },
  'bottom-right':{ style: { bottom: '10%', right: '6%' }, alignClass: 'text-right' },
};

export function ImmersiveView({ image, result, captureRef }: ImmersiveViewProps) {
  const [visible, setVisible] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const style = result.style;
  const isVertical = style.isVertical;

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, [image, result.text_placement]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = image;
  }, [image]);

  const config = PLACEMENT_STYLES[result.text_placement];
  const isBottom = result.text_placement.startsWith('bottom');
  const isTop = result.text_placement.startsWith('top');

  // 计算容器尺寸：在视口内完整展示原图的最大尺寸
  let containerW = '100%';
  let containerH = '100%';
  if (naturalSize && typeof window !== 'undefined') {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const imgRatio = naturalSize.w / naturalSize.h;
    const vRatio = vw / vh;

    if (vRatio > imgRatio) {
      containerH = `${vh}px`;
      containerW = `${vh * imgRatio}px`;
    } else {
      containerW = `${vw}px`;
      containerH = `${vw / imgRatio}px`;
    }
  }

  // 印章位置：与诗句对角
  const sealPlacement: Record<GridPosition, GridPosition> = {
    'top-left': 'bottom-right',
    'top': 'bottom',
    'top-right': 'bottom-left',
    'left': 'right',
    'center': 'bottom-right',
    'right': 'left',
    'bottom-left': 'top-right',
    'bottom': 'top',
    'bottom-right': 'top-left',
  };
  const sealPos = PLACEMENT_STYLES[sealPlacement[result.text_placement]];

  return (
    <div className="flex items-center justify-center w-full h-full bg-neutral-950">
      <div
        ref={captureRef}
        className="relative overflow-hidden"
        style={{ width: containerW, height: containerH }}
      >
        <img
          src={image}
          alt="Uploaded"
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] ease-out ${
            visible ? 'scale-100' : 'scale-105'
          }`}
        />

        {/* Bottom cinematic gradient */}
        {(isBottom || result.text_placement === 'center') && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 40%, transparent 100%)',
            }}
          />
        )}

        {/* Top gradient for top placements */}
        {isTop && (
          <div
            className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
            }}
          />
        )}

        {/* Side gradients for left/right */}
        {result.text_placement === 'left' && (
          <div
            className="absolute top-0 bottom-0 left-0 w-1/3 pointer-events-none"
            style={{
              background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 100%)',
            }}
          />
        )}
        {result.text_placement === 'right' && (
          <div
            className="absolute top-0 bottom-0 right-0 w-1/3 pointer-events-none"
            style={{
              background: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 100%)',
            }}
          />
        )}

        {/* Poem text */}
        <div
          className={`absolute ${config.alignClass}`}
          style={{
            ...config.style,
            writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
          }}
        >
          <p
            className={`leading-relaxed ${style.fontSize}`}
            style={{
              fontFamily: style.fontFamily,
              letterSpacing: style.tracking,
              lineHeight: style.lineHeight,
              color: style.textColor,
              textShadow: style.textShadow,
              opacity: visible ? style.textOpacity : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
              whiteSpace: 'nowrap',
              wordBreak: 'keep-all',
            }}
          >
            {result.line}
          </p>

          <div
            className={`mt-5 ${isVertical ? 'mt-0 ml-6' : ''}`}
            style={{
              opacity: visible ? 0.7 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.8s ease-out 0.3s, transform 0.8s ease-out 0.3s',
            }}
          >
            <p
              className="text-base md:text-lg tracking-[0.2em]"
              style={{
                fontFamily: style.fontFamily,
                color: 'rgba(255,255,255,0.75)',
                textShadow: '0 1px 10px rgba(0,0,0,0.8)',
              }}
            >
              {result.author} · {result.title}
            </p>
          </div>
        </div>

        {/* Seal / 印章 */}
        {style.signature && style.sealText && (
          <div
            className="absolute pointer-events-none"
            style={{
              ...sealPos.style,
              opacity: visible ? 0.75 : 0,
              transition: 'opacity 0.8s ease-out 0.5s',
            }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: isVertical ? 40 : 48,
                height: isVertical ? 48 : 40,
                border: '2px solid rgba(180, 60, 47, 0.7)',
                color: 'rgba(180, 60, 47, 0.85)',
                fontSize: isVertical ? 14 : 16,
                fontFamily: "'Ma Shan Zheng', cursive",
                letterSpacing: 2,
                writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
                textAlign: 'center',
                lineHeight: 1,
                padding: 2,
              }}
            >
              {style.sealText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
