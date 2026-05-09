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
      const dataUrl = await toPng(el, { pixelRatio: 3, cacheBust: true, quality: 1 });
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
        px-5 py-2.5 rounded-sm
        text-sm font-serif tracking-wider
        border transition-all duration-500
        hover:scale-105
        disabled:opacity-40 disabled:hover:scale-100
      "
      style={{
        backgroundColor: 'rgba(20, 18, 16, 0.6)',
        borderColor: 'var(--ink-mid)',
        color: 'var(--paper-dim)',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={(e) => {
        if (!saving) {
          e.currentTarget.style.borderColor = 'var(--cinnabar)';
          e.currentTarget.style.color = 'var(--paper)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--ink-mid)';
        e.currentTarget.style.color = 'var(--paper-dim)';
      }}
    >
      {saving ? '保存中…' : '保存图卡'}
    </button>
  );
}
