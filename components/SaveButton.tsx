'use client';

import { useState } from 'react';
import { toPng } from 'html-to-image';

interface SaveButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
  filename: string;
}

export function SaveButton({ targetRef, filename }: SaveButtonProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const el = targetRef.current;
    if (!el) return;

    setSaving(true);
    try {
      await document.fonts.ready;
      const dataUrl = await toPng(el, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
      alert('保存失败，请截图');
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className="
        px-4 py-2 rounded-lg
        bg-white/10 hover:bg-white/20
        backdrop-blur-sm
        text-white text-sm font-serif
        border border-white/20
        transition-colors
        disabled:opacity-50
      "
    >
      {saving ? '保存中…' : '保存图卡'}
    </button>
  );
}
