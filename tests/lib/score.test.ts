import { describe, it, expect } from 'vitest';
import { scorePoem } from '../../lib/score';
import type { PoemTags } from '../../lib/types';

describe('scorePoem', () => {
  it('returns 1.0 for perfect match', () => {
    const tags: PoemTags = { subjects: ['月'], moods: ['思乡'], seasons: ['秋'], scenes: ['夜'], palette: ['清冷'] };
    expect(scorePoem(tags, tags)).toBeCloseTo(1.0, 3);
  });

  it('returns 0.0 for no overlap', () => {
    const imageTags: PoemTags = { subjects: ['马'], moods: ['豪迈'], seasons: [], scenes: ['边塞'], palette: ['浓烈'] };
    const poemTags: PoemTags = { subjects: ['月'], moods: ['思乡'], seasons: ['秋'], scenes: ['夜'], palette: ['清冷'] };
    expect(scorePoem(imageTags, poemTags)).toBe(0);
  });

  it('redistributes season weight to subjects when seasons empty', () => {
    const imageTags: PoemTags = { subjects: ['山'], moods: ['闲适'], seasons: [], scenes: ['山水'], palette: ['素淡'] };
    const poemA: PoemTags = { subjects: ['山'], moods: ['闲适'], seasons: ['秋'], scenes: ['山水'], palette: ['素淡'] };
    const poemB: PoemTags = { subjects: ['水'], moods: ['闲适'], seasons: ['秋'], scenes: ['山水'], palette: ['素淡'] };
    expect(scorePoem(imageTags, poemA)).toBeGreaterThan(scorePoem(imageTags, poemB));
  });

  it('prioritizes subject over mood when both partially match', () => {
    const imageTags: PoemTags = { subjects: ['月'], moods: ['思乡'], seasons: ['秋'], scenes: ['夜'], palette: ['清冷'] };
    const poemA: PoemTags = { subjects: ['月'], moods: ['豪迈'], seasons: ['春'], scenes: ['边塞'], palette: ['浓烈'] };
    const poemB: PoemTags = { subjects: ['山'], moods: ['思乡'], seasons: ['春'], scenes: ['边塞'], palette: ['浓烈'] };
    expect(scorePoem(imageTags, poemA)).toBeGreaterThan(scorePoem(imageTags, poemB));
  });
});
