import type { MatchResult } from './types';

const cache = new Map<string, MatchResult>();

export function getCached(hash: string): MatchResult | undefined {
  return cache.get(hash);
}

export function setCached(hash: string, result: MatchResult): void {
  cache.set(hash, result);
}

export function clearCache(): void {
  cache.clear();
}
