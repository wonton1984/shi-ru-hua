import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { extractTags, selectBestMatch } from '@/lib/kimi';
import { scorePoem } from '@/lib/score';
import { getCached, setCached } from '@/lib/cache';
import poems from '@/data/poems.json';
import type { Poem, MatchResult } from '@/lib/types';

const SAFE_POEMS = (poems as Poem[]).slice(0, 5);

function computeHash(base64Image: string): string {
  return createHash('sha256').update(base64Image).digest('hex').slice(0, 16);
}

export async function POST(request: Request) {
  try {
    const { image } = (await request.json()) as { image: string };
    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const hash = computeHash(base64Data);
    const cached = getCached(hash);
    if (cached) {
      return NextResponse.json(cached);
    }

    let analysis: import('@/lib/types').ImageAnalysis;
    try {
      analysis = await extractTags(base64Data);
    } catch (err) {
      console.error('Tag extraction failed, using defaults:', err);
      analysis = {
        tags: { subjects: ['山'], moods: ['闲适'], seasons: [], scenes: ['山水'], palette: ['素淡'] },
        subject_region: 'center',
        text_placement: 'bottom-right',
      } as import('@/lib/types').ImageAnalysis;
    }

    const scored = (poems as Poem[]).map((poem) => ({
      poem,
      score: scorePoem(analysis.tags, poem.tags),
    }));

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.poem.author.localeCompare(b.poem.author);
    });

    const top10 = scored.slice(0, 10);

    let selectedId: string;
    try {
      selectedId = await selectBestMatch(
        base64Data,
        top10.map((s) => ({
          id: s.poem.id,
          line: s.poem.line,
          author: s.poem.author,
          title: s.poem.title,
          tags: s.poem.tags,
        }))
      );
    } catch (err) {
      console.error('Selection failed, falling back to top scored:', err);
      selectedId = top10[0]?.poem.id || SAFE_POEMS[0].id;
    }

    const selectedPoem = (poems as Poem[]).find((p) => p.id === selectedId);
    const resultPoem = selectedPoem || top10[0]?.poem || SAFE_POEMS[0];

    const result: MatchResult = {
      line: resultPoem.line,
      title: resultPoem.title,
      author: resultPoem.author,
      full_poem: resultPoem.full_poem,
      text_placement: analysis.text_placement,
    };

    setCached(hash, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Match error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
