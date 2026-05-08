import type { PoemTags } from './types';

const WEIGHTS = {
  subjects: 0.35,
  moods: 0.30,
  seasons: 0.15,
  scenes: 0.10,
  palette: 0.10,
};

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  return intersection.size / (setA.size + setB.size - intersection.size);
}

export function scorePoem(imageTags: PoemTags, poemTags: PoemTags): number {
  const weights = { ...WEIGHTS };

  // If seasons is empty in image, redistribute its weight to subjects
  if (!imageTags.seasons || imageTags.seasons.length === 0) {
    weights.subjects += weights.seasons;
    weights.seasons = 0;
  }

  let score = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    if (weight === 0) continue;
    const a = imageTags[key as keyof PoemTags] || [];
    const b = poemTags[key as keyof PoemTags] || [];
    if (a.length > 0 || (key === 'seasons' && weights.seasons > 0)) {
      score += weight * jaccard(a, b);
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;
  return score / totalWeight;
}
