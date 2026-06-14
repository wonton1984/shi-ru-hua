'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { fileToBase64, resizeImage } from '@/lib/imageProcessor';

interface UploadZoneProps {
  onImageSelect: (original: string, forApi: string) => void;
}

export function UploadZone({ onImageSelect }: UploadZoneProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);
      if (!isImage) {
        alert('不支持的图片格式，请选择 JPG / PNG / WebP 格式的照片');
        return;
      }

      try {
        const [original, forApi] = await Promise.all([
          fileToBase64(file),
          resizeImage(file),
        ]);
        onImageSelect(original, forApi);
      } catch (err) {
        alert('图片处理失败，请重试');
        console.error(err);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxSize: 30 * 1024 * 1024,
    multiple: false,
    useFsAccessApi: false,
  });

  const rejectionMsg = fileRejections[0]?.errors[0]?.message;

  return (
    <div
      {...getRootProps()}
      className={`
        group relative flex flex-col items-center justify-center
        w-72 sm:w-80 md:w-96 lg:w-[28rem] aspect-[3/4]
        cursor-pointer
        transition-all duration-700 ease-out
        ${isDragActive ? 'scale-[1.03]' : 'hover:scale-[1.01]'}
      `}
      style={{
        background: 'linear-gradient(180deg, rgba(232,224,208,0.03) 0%, rgba(232,224,208,0.01) 100%)',
        border: '1px solid rgba(168, 160, 140, 0.15)',
      }}
    >
      <input {...getInputProps()} />

      {/* Inner frame */}
      <div
        className="absolute inset-3 transition-all duration-500 group-hover:inset-2.5"
        style={{
          border: '1px solid rgba(168, 160, 140, 0.08)',
        }}
      />

      {/* Corner ornaments */}
      <div className="absolute top-3 left-3 w-4 h-4">
        <div className="absolute top-0 left-0 w-full h-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.25 }} />
        <div className="absolute top-0 left-0 h-full w-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.25 }} />
      </div>
      <div className="absolute top-3 right-3 w-4 h-4">
        <div className="absolute top-0 right-0 w-full h-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.25 }} />
        <div className="absolute top-0 right-0 h-full w-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.25 }} />
      </div>
      <div className="absolute bottom-3 left-3 w-4 h-4">
        <div className="absolute bottom-0 left-0 w-full h-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.25 }} />
        <div className="absolute bottom-0 left-0 h-full w-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.25 }} />
      </div>
      <div className="absolute bottom-3 right-3 w-4 h-4">
        <div className="absolute bottom-0 right-0 w-full h-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.25 }} />
        <div className="absolute bottom-0 right-0 h-full w-px" style={{ backgroundColor: 'var(--gold)', opacity: 0.25 }} />
      </div>

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(201,169,97,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative text-center px-8">
        {/* Brush icon */}
        <div className="mx-auto mb-8 w-16 h-16 flex items-center justify-center">
          <svg
            width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
            className="transition-colors duration-500"
            style={{ color: 'var(--paper-dim)' }}
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0" />
            <path d="M12 19l7-7 3 3-7 7-3-3z" />
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            <path d="M2 2l7.5 8.5" />
          </svg>
        </div>

        <p
          className="text-base font-serif tracking-[0.15em] mb-3 transition-colors duration-500"
          style={{ color: isDragActive ? 'var(--paper)' : 'var(--paper-dim)' }}
        >
          {isDragActive ? '松开即可' : '点击或拖拽上传图片'}
        </p>
        <p className="text-xs tracking-[0.2em]" style={{ color: 'var(--ink-mid)' }}>
          JPG · PNG · WebP · 最大 30MB
        </p>
        {rejectionMsg && (
          <p className="mt-3 text-xs" style={{ color: 'var(--cinnabar)', opacity: 0.8 }}>
            图片超过30MB限制
          </p>
        )}
      </div>
    </div>
  );
}
