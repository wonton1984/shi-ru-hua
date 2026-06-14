import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/gemini', () => ({
  extractTags: vi.fn().mockResolvedValue({
    tags: { subjects: ['月'], moods: ['思乡'], seasons: ['秋'], scenes: ['夜'], palette: ['清冷'] },
    subject_region: 'center',
    text_placement: 'bottom-right',
  }),
  selectBestMatch: vi.fn().mockResolvedValue('0001'),
}));

vi.mock('@/lib/cache', () => ({
  getCached: vi.fn().mockReturnValue(undefined),
  setCached: vi.fn(),
}));

import { POST } from '../../app/api/match/route';

describe('POST /api/match', () => {
  it('returns a matching poem for a valid image', async () => {
    const base64Image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const req = new Request('http://localhost:3000/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('line');
    expect(data).toHaveProperty('author');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('text_placement');
    expect(typeof data.line).toBe('string');
    expect(data.line.length).toBeGreaterThan(0);
  });

  it('returns 400 for missing image', async () => {
    const req = new Request('http://localhost:3000/api/match', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});