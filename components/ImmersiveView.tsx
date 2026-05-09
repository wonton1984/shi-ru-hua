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
  placement: GridPosition,
  isVertical: boolean,
  charsPerLine: number,
  isCouplet: boolean,
  coupletLineCount: number
): number {
  if (cw <= 0 || ch <= 0) return 48;

  const trackingRatio = 0.12;
  const charWidth = 1 + trackingRatio;

  // 根据文字位置计算可用空间（百分比边距）
  const isTop = placement.startsWith('top');
  const isBottom = placement.startsWith('bottom');
  const isLeftRight = placement === 'left' || placement === 'right';

  // 竖排：可用高度取决于位置
  let vSpaceRatio: number;
  if (isVertical) {
    if (isTop) vSpaceRatio = 0.85;      // top 8%，留 85%
    else if (isBottom) vSpaceRatio = 0.80; // bottom 10%，留 80%
    else vSpaceRatio = 0.78;              // center/left/right，上下各留 11%
  } else {
    if (isTop) vSpaceRatio = 0.25;
    else if (isBottom) vSpaceRatio = 0.22;
    else vSpaceRatio = 0.30;
  }

  // 横排：可用宽度取决于位置
  let hSpaceRatio: number;
  if (isLeftRight) hSpaceRatio = 0.88;   // left/right 留 5% 边距
  else if (placement === 'center') hSpaceRatio = 0.80;
  else hSpaceRatio = 0.85;               // top/bottom 留 6% 边距

  if (isVertical) {
    // 竖排：限制因素是可用高度（文字纵向排列）
    const maxByHeight = (ch * vSpaceRatio) / charsPerLine;
    // 宽度限制：竖排总宽度
    const maxByWidth = coupletLineCount > 1
      ? (cw * hSpaceRatio * 0.45) / coupletLineCount
      : cw * hSpaceRatio * 0.22;
    return Math.max(16, Math.min(80, maxByHeight, maxByWidth));
  }

  if (isCouplet && coupletLineCount === 1) {
    // 五言两句一行
    const totalChars = charsPerLine * 2 + 1;
    const maxByWidth = (cw * hSpaceRatio) / (totalChars * charWidth);
    const maxByHeight = ch * vSpaceRatio;
    return Math.max(16, Math.min(90, maxByWidth, maxByHeight));
  }

  if (isCouplet && coupletLineCount === 2) {
    // 七言两行
    const maxByWidth = (cw * hSpaceRatio) / (charsPerLine * charWidth);
    const maxByHeight = (ch * vSpaceRatio) / 2.8;
    return Math.max(16, Math.min(100, maxByWidth, maxByHeight));
  }

  // 单句
  const maxByWidth = (cw * hSpaceRatio) / (charsPerLine * charWidth);
  const maxByHeight = ch * vSpaceRatio;
  return Math.max(16, Math.min(110, maxByWidth, maxByHeight));
}

export function ImmersiveView({ image, result, captureRef }: ImmersiveViewProps) {
  const [visible, setVisible] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const innerRef = useRef<HTMLDivElement | null>(null);

  const style = result.style;
  const isVertical = style.isVertical;

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, [image, result.text_placement]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = image;
  }, [image]);

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
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, [naturalSize]);

  const config = PLACEMENT_STYLES[result.text_placement];
  const isBottom = result.text_placement.startsWith('bottom');
  const isTop = result.text_placement.startsWith('top');

  // 容器尺寸：跟随图片比例，无黑边
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

  // 对句
  const couplet = result.couplet || [result.line];
  const isCouplet = couplet.length === 2;
  const charsPerLine = couplet[0]?.length || result.line.length;
  const coupletLineCount = isCouplet && charsPerLine >= 7 ? 2 : 1;

  // 字号
  const fontSize = computeFontSize(
    containerSize.w,
    containerSize.h,
    result.text_placement,
    isVertical,
    charsPerLine,
    isCouplet,
    coupletLineCount
  );

  const tracking = fontSize > 60 ? '0.05em' : fontSize > 40 ? '0.08em' : '0.12em';

  // 印章位置
  const sealPlacement: Record<GridPosition, GridPosition> = {
    'top-left': 'bottom-right', 'top': 'bottom', 'top-right': 'bottom-left',
    'left': 'right', 'center': 'bottom-right', 'right': 'left',
    'bottom-left': 'top-right', 'bottom': 'top', 'bottom-right': 'top-left',
  };
  const sealPos = PLACEMENT_STYLES[sealPlacement[result.text_placement]];

  return (
    <div className="flex items-center justify-center w-full h-full bg-neutral-950">
      <div
        ref={(node) => {
          innerRef.current = node;
          if (typeof captureRef === 'function') captureRef(node);
          else if (captureRef) (captureRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className="relative"
        style={{ width: containerW, height: containerH }}
      >
        <img
          src={image}
          alt="Uploaded"
          className={`w-full h-full object-cover transition-transform duration-[2000ms] ease-out ${
            visible ? 'scale-100' : 'scale-105'
          }`}
        />

        {/* Gradients */}
        {(isBottom || result.text_placement === 'center') && (
          <div className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 40%, transparent 100%)' }} />
        )}
        {isTop && (
          <div className="absolute top-0 left-0 right-0 h-1/3 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />
        )}
        {result.text_placement === 'left' && (
          <div className="absolute top-0 bottom-0 left-0 w-1/3 pointer-events-none"
            style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 100%)' }} />
        )}
        {result.text_placement === 'right' && (
          <div className="absolute top-0 bottom-0 right-0 w-1/3 pointer-events-none"
            style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.5) 0%, transparent 100%)' }} />
        )}

        {/* Poem text */}
        <div
          className={`absolute ${config.alignClass}`}
          style={{ ...config.style, writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb' }}
        >
          {isCouplet && charsPerLine >= 7 ? (
            <div>
              <p style={{
                fontFamily: style.fontFamily, fontSize, letterSpacing: tracking,
                lineHeight: 1.35, color: style.textColor, textShadow: style.textShadow,
                opacity: visible ? style.textOpacity : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                whiteSpace: 'nowrap', wordBreak: 'keep-all',
              }}>{couplet[0]}</p>
              <p style={{
                fontFamily: style.fontFamily, fontSize, letterSpacing: tracking,
                lineHeight: 1.35, color: style.textColor, textShadow: style.textShadow,
                opacity: visible ? style.textOpacity : 0,
                transform: visible ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.8s ease-out 0.15s, transform 0.8s ease-out 0.15s',
                whiteSpace: 'nowrap', wordBreak: 'keep-all', marginTop: '0.25em',
              }}>{couplet[1]}</p>
            </div>
          ) : (
            <p style={{
              fontFamily: style.fontFamily, fontSize, letterSpacing: tracking,
              lineHeight: style.lineHeight, color: style.textColor, textShadow: style.textShadow,
              opacity: visible ? style.textOpacity : 0,
              transform: visible ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
              whiteSpace: 'nowrap', wordBreak: 'keep-all',
            }}>{isCouplet ? `${couplet[0]} ${couplet[1]}` : result.line}</p>
          )}

          <div className={`mt-4 ${isVertical ? 'mt-0 ml-5' : ''}`}
            style={{ opacity: visible ? 0.7 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.8s ease-out 0.3s, transform 0.8s ease-out 0.3s' }}>
            <p style={{
              fontFamily: style.fontFamily, fontSize: Math.max(12, fontSize * 0.22),
              letterSpacing: '0.15em', color: 'rgba(255,255,255,0.75)',
              textShadow: '0 1px 10px rgba(0,0,0,0.8)', whiteSpace: 'nowrap',
            }}>{result.author} · {result.title}</p>
          </div>
        </div>

        {/* Seal */}
        {style.signature && style.sealText && (
          <div className="absolute pointer-events-none"
            style={{ ...sealPos.style, opacity: visible ? 0.75 : 0, transition: 'opacity 0.8s ease-out 0.5s' }}>
            <div className="flex items-center justify-center"
              style={{
                width: isVertical ? 36 : 44, height: isVertical ? 44 : 36,
                border: '2px solid rgba(180, 60, 47, 0.7)', color: 'rgba(180, 60, 47, 0.85)',
                fontSize: isVertical ? 13 : 15, fontFamily: style.fontFamily,
                letterSpacing: 2, writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
                textAlign: 'center', lineHeight: 1, padding: 2,
              }}>
              {style.sealText}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
