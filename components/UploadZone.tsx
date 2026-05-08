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
        flex flex-col items-center justify-center
        w-full max-w-lg mx-auto aspect-[4/3]
        border-2 border-dashed rounded-2xl
        cursor-pointer transition-colors
        ${isDragActive ? 'border-white bg-white/10' : 'border-white/30 hover:border-white/60'}
      `}
    >
      <input {...getInputProps()} />
      <div className="text-center px-6">
        <p className="text-2xl mb-2">📷</p>
        <p className="text-lg font-serif">
          {isDragActive ? '松开即可上传' : '点击或拖拽上传图片'}
        </p>
        <p className="text-sm text-white/40 mt-2">支持 PNG、JPG、WebP，最大 10MB</p>
      </div>
    </div>
  );
}
