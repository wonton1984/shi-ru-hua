'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { resizeImage } from '@/lib/imageProcessor';

interface UploadZoneProps {
  onImageSelect: (image: string) => void;
}

export function UploadZone({ onImageSelect }: UploadZoneProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      try {
        const resized = await resizeImage(file);
        onImageSelect(resized);
      } catch (err) {
        alert('图片处理失败，请重试');
        console.error(err);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        group relative flex flex-col items-center justify-center
        w-full max-w-md mx-auto aspect-[4/3]
        rounded-2xl cursor-pointer
        transition-all duration-500 ease-out
        ${isDragActive
          ? 'bg-white/10 scale-[1.02] border-white/40'
          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/10 hover:border-white/25'
        }
        border backdrop-blur-md
      `}
    >
      <input {...getInputProps()} />

      {/* Animated glow ring on hover */}
      <div className={`
        absolute inset-0 rounded-2xl transition-opacity duration-500
        ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
      `} style={{
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.03) 0%, transparent 70%)',
      }} />

      <div className="relative text-center px-8">
        {/* Upload icon */}
        <div className={`
          mx-auto mb-5 w-12 h-12 rounded-full border border-white/20
          flex items-center justify-center
          transition-all duration-300
          ${isDragActive ? 'bg-white/10 border-white/40 scale-110' : 'group-hover:bg-white/5 group-hover:border-white/30'}
        `}>
          <svg
            width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            className="text-white/50 group-hover:text-white/70 transition-colors"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <p className="text-base font-serif text-white/60 group-hover:text-white/80 transition-colors tracking-wide">
          {isDragActive ? '松开即可上传' : '点击或拖拽上传图片'}
        </p>
        <p className="text-xs text-white/25 mt-3 tracking-wider">
          PNG · JPG · WebP · 最大 10MB
        </p>
      </div>
    </div>
  );
}
