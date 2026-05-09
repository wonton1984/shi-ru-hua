'use client';

import { useEffect, useRef, useState } from 'react';
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

function computeFontSize(
  cw: number,
  ch: number,
  isVertical: boolean,
  charsPerLine: number,
  isCouplet: boolean,
  coupletLineCount: number
): number {
  if (cw <= 0 || ch <= 0) return 48;

  // tracking 占字号的约 10%
  const trackingRatio = 0.12;
  const charWidth = 1 + trackingRatio;

  if (isVertical) {
    // 竖排：限制因素是容器高度（文字纵向排列）
    // 文字高度 = charsPerLine * fontSize，需 < ch * 0.6
    const maxByHeight = (ch * 0.55) / charsPerLine;
    // 同时限制宽度：两行竖排总宽度约 2 * fontSize，需 < cw * 0.5
    const maxByWidth = coupletLineCount > 1 ? (cw * 0.4) / coupletLineCount : cw * 0.25;
    return Math.max(16, Math.min(72, maxByHeight, maxByWidth));
  }

  if (isCouplet && coupletLineCount === 1) {
    // 五言两句一行：总宽度 = totalChars * fontSize * charWidth，需 < cw * 0.8
    const totalChars = charsPerLine * 2 + 1; // +1 是中间空格
    const maxByWidth = (cw * 0.75) / (totalChars * charWidth);
    // 同时限制高度：一行字，需 < ch * 0.25
    const maxByHeight = ch * 0.2;
    return Math.max(16, Math.min(80, maxByWidth, maxByHeight));
  }

  if (isCouplet && coupletLineCount === 2) {
    // 七言两行：每行宽度 = charsPerLine * fontSize * charWidth，需 < cw * 0.8
    const maxByWidth = (cw * 0.75) / (charsPerLine * charWidth);
    // 两行总高度 = 2 * fontSize * 1.4(lineHeight)，需 < ch * 0.3
    const maxByHeight = (ch * 0.25) / 2.8;
    return Math.max(16, Math.min(90, maxByWidth, maxByHeight));
  }

  // 单句
  const maxByWidth = (cw * 0.75) / (charsPerLine * charWidth);
  const maxByHeight = ch * 0.2;
  return Math.max(16, Math.min(100, maxByWidth, maxByHeight));
}

export function ImmersiveView({ image, result, captureRef }: ImmersiveViewProps) {
  const [visible, setVisible] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const innerRef = useRef<HTMLDivElement | null>(null);

  const style = result.style;
  const isVertical = style.isVertical;

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, [image, result.text_placement]);

  // 监听容器尺寸
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ w: rect.width, h: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const config = PLACEMENT_STYLES[result.text_placement];
  const isBottom = result.text_placement.startsWith('bottom');
  const isTop = result.text_placement.startsWith('top');

  // 对句
  const couplet = result.couplet || [result.line];
  const isCouplet = couplet.length === 2;
  const charsPerLine = couplet[0]?.length || result.line.length;
  const coupletLineCount = isCouplet && charsPerLine >= 7 ? 2 : 1;

  // 根据容器尺寸计算字号
  const fontSize = computeFontSize(
    containerSize.w,
    containerSize.h,
    isVertical,
    charsPerLine,
    isCouplet,
    coupletLineCount
  );

  // 字间距：随字号调整，字号大则间距小
  const tracking = fontSize > 60 ? '0.05em' : fontSize > 40 ? '0.08em' : '0.12em';

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
        ref={(node) => {
          innerRef.current = node;
          if (typeof captureRef === 'function') {
            captureRef(node);
          } else if (captureRef) {
            (captureRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        className="relative overflow-hidden"
        style={{ width: '100%', height: '100%', maxWidth: '100vw', maxHeight: '100vh' }}
      >
        <img
          src={image}
          alt="Uploaded"
          className={`absolute inset-0 w-full h-full object-contain transition-transform duration-[2000ms] ease-out ${
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
          {/* 诗句 */}
          {isCouplet && charsPerLine >= 7 ? (
            // 七言两句 → 两行
            <div>
              <p
                style={{
                  fontFamily: style.fontFamily,
                  fontSize,
                  letterSpacing: tracking,
                  lineHeight: 1.35,
                  color: style.textColor,
                  textShadow: style.textShadow,
                  opacity: visible ? style.textOpacity : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                  whiteSpace: 'nowrap',
                  wordBreak: 'keep-all',
                }}
              >
                {couplet[0]}
              </p>
              <p
                style={{
                  fontFamily: style.fontFamily,
                  fontSize,
                  letterSpacing: tracking,
                  lineHeight: 1.35,
                  color: style.textColor,
                  textShadow: style.textShadow,
                  opacity: visible ? style.textOpacity : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 0.8s ease-out 0.15s, transform 0.8s ease-out 0.15s',
                  whiteSpace: 'nowrap',
                  wordBreak: 'keep-all',
                  marginTop: '0.25em',
                }}
              >
                {couplet[1]}
              </p>
            </div>
          ) : (
            // 五言两句一行，或单句
            <p
              style={{
                fontFamily: style.fontFamily,
                fontSize,
                letterSpacing: tracking,
                lineHeight: style.lineHeight,
                color: style.textColor,
                textShadow: style.textShadow,
                opacity: visible ? style.textOpacity : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                whiteSpace: 'nowrap',
                wordBreak: 'keep-all',
              }}
            >
              {isCouplet ? `${couplet[0]} ${couplet[1]}` : result.line}
            </p>
          )}

          {/* Author */}
          <div
            className={`mt-4 ${isVertical ? 'mt-0 ml-5' : ''}`}
            style={{
              opacity: visible ? 0.7 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.8s ease-out 0.3s, transform 0.8s ease-out 0.3s',
            }}
          >
            <p
              style={{
                fontFamily: style.fontFamily,
                fontSize: Math.max(12, fontSize * 0.22),
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.75)',
                textShadow: '0 1px 10px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap',
              }}
            >
              {result.author} · {result.title}
            </p>
          </div>
        </div>

        {/* Seal */}
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
                width: isVertical ? 36 : 44,
                height: isVertical ? 44 : 36,
                border: '2px solid rgba(180, 60, 47, 0.7)',
                color: 'rgba(180, 60, 47, 0.85)',
                fontSize: isVertical ? 13 : 15,
                fontFamily: style.fontFamily,
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
