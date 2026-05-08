/**
 * Offline script to tag the full Tang poetry corpus.
 * Usage: KIMI_API_KEY=xxx npx ts-node scripts/tag-corpus.ts <raw-corpus-dir>
 *
 * Prerequisites:
 * 1. Clone chinese-poetry/chinese-poetry to a temp dir
 * 2. Run: KIMI_API_KEY=xxx npx ts-node scripts/tag-corpus.ts /path/to/chinese-poetry/json
 * 3. Output: data/poems.json (overwrites)
 */

import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

const kimi = new OpenAI({
  apiKey: process.env.KIMI_API_KEY!,
  baseURL: 'https://api.moonshot.ai/v1',
});

const MODEL = 'kimi-k2.6';
const BATCH_SIZE = 20;
const RATE_LIMIT_MS = 5000; // 5s between batches to respect quota

interface RawPoem {
  title: string;
  author: string;
  paragraphs: string[];
}

interface TaggedLine {
  id: string;
  line: string;
  title: string;
  author: string;
  full_poem: string;
  tags: {
    subjects: string[];
    moods: string[];
    seasons: string[];
    scenes: string[];
    palette: string[];
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitIntoSentences(paragraphs: string[]): string[] {
  const sentences: string[] = [];
  for (const p of paragraphs) {
    const parts = p.split(/[，。；！？]/).filter((s) => s.trim().length >= 5 && s.trim().length <= 15);
    sentences.push(...parts.map((s) => s.trim()));
  }
  return sentences;
}

async function tagBatch(lines: { id: string; line: string; title: string; author: string; full_poem: string }[]): Promise<TaggedLine[]> {
  const prompt = `你是一位精通唐诗的学者。请为以下 ${lines.length} 句唐诗名句打上标签。

每句需要返回：
- subjects（主体，1-4个）：山/水/月/风/云/雨/雪/花/柳/鸟/马/酒/楼/江/河/桥/寺/钟/灯/松/竹/梅/菊/莲/石/路/天/海/城/村/舟/雁/鹤/鹿/泉/田/草/木/叶/霜/露/日/星/雾/雷/虹/烟/沙/帆/笛
- moods（情绪，1-3个）：思乡/孤独/闲适/豪迈/离愁/怀古/怅惘/喜悦/寂寥/幽静/激昂/哀怨/旷达/恬淡/愁绪/忧伤/壮志/逍遥/温情/悲凉
- seasons（季节，0-1个）：春/夏/秋/冬
- scenes（场景，1-2个）：山水/边塞/田园/宫闱/江上/室内/夜/远景/雨景/雪景/旷野/都市/庭院/古刹/战场/驿道/孤舟/大漠/深林/高台
- palette（色彩/光影，1-2个）：清冷/苍翠/暮色/皎洁/浓烈/素淡/金色/玄色/暖色/素白/浓翠/朱红/墨色/幽蓝/绯红/昏黄/黛青/银白

返回严格 JSON 数组，顺序与输入一致：
[{"id":"...","subjects":["..."],"moods":["..."],"seasons":["..."],"scenes":["..."],"palette":["..."]}, ...]

诗句列表：
${lines.map((l, i) => `${i + 1}. [id:"${l.id}"] "${l.line}" — ${l.author}《${l.title}》`).join('\n')}`;

  const response = await kimi.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: '你是一位精通唐诗的学者。请严格返回 JSON。' },
      { role: 'user', content: prompt },
    ],
  });

  const content = response.choices[0]?.message?.content || '{}';
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON response from Kimi');
  }

  const results = Array.isArray(parsed) ? parsed : (parsed as Record<string, unknown>)?.results || [];

  return lines.map((line, i) => {
    const tagResult = (results as Record<string, unknown>[])[i] || {};
    return {
      id: line.id,
      line: line.line,
      title: line.title,
      author: line.author,
      full_poem: line.full_poem,
      tags: {
        subjects: Array.isArray(tagResult.subjects) ? (tagResult.subjects as string[]) : [],
        moods: Array.isArray(tagResult.moods) ? (tagResult.moods as string[]) : [],
        seasons: Array.isArray(tagResult.seasons) ? (tagResult.seasons as string[]) : [],
        scenes: Array.isArray(tagResult.scenes) ? (tagResult.scenes as string[]) : [],
        palette: Array.isArray(tagResult.palette) ? (tagResult.palette as string[]) : [],
      },
    };
  });
}

async function main() {
  const corpusDir = process.argv[2];
  if (!corpusDir) {
    console.error('Usage: KIMI_API_KEY=xxx npx ts-node scripts/tag-corpus.ts <raw-corpus-dir>');
    process.exit(1);
  }

  console.log('Reading raw corpus from:', corpusDir);
  // TODO: Implement full corpus reading from chinese-poetry repo format
  // This is a scaffold — full implementation reads the JSON files and processes them

  console.log('Tagging script scaffold complete. Full implementation pending.');
  console.log('Expected workflow:');
  console.log('  1. Read chinese-poetry JSON files');
  console.log('  2. Split into sentences (5-15 chars)');
  console.log('  3. Filter by anthology membership (唐诗三百首 + famous poets)');
  console.log('  4. Batch tag via Kimi K2.6 (20 lines per batch)');
  console.log('  5. Save to data/poems.json');
}

main().catch(console.error);
