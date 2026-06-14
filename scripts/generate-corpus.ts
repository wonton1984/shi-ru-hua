/**
 * 从 chinese-poetry 仓库生成完整 tagged 语料库
 * Usage: cd ~/projects/shi-ru-hua && npx ts-node scripts/generate-corpus.ts
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
const RATE_LIMIT_MS = 3000; // 3s between batches
const CORPUS_SOURCE = '/tmp/chinese-poetry/全唐诗/唐诗三百首.json';
const OUTPUT_PATH = path.resolve(__dirname, '../data/poems.json');

const VOCAB = {
  subjects: '山,水,月,风,云,雨,雪,花,柳,鸟,马,酒,楼,江,河,桥,寺,钟,灯,松,竹,梅,菊,莲,石,路,天,海,城,村,舟,雁,鹤,鹿,泉,田,草,木,叶,霜,露,日,星,雾,雷,虹,烟,沙,帆,笛'.split(','),
  moods: '思乡,孤独,闲适,豪迈,离愁,怀古,怅惘,喜悦,寂寥,幽静,激昂,哀怨,旷达,恬淡,愁绪,忧伤,壮志,逍遥,温情,悲凉'.split(','),
  seasons: '春,夏,秋,冬'.split(','),
  scenes: '山水,边塞,田园,宫闱,江上,室内,夜,远景,雨景,雪景,旷野,都市,庭院,古刹,战场,驿道,孤舟,大漠,深林,高台'.split(','),
  palette: '清冷,苍翠,暮色,皎洁,浓烈,素淡,金色,玄色,暖色,素白,浓翠,朱红,墨色,幽蓝,绯红,昏黄,黛青,银白'.split(','),
};

interface RawPoem {
  id: string;
  author: string;
  title: string;
  paragraphs: string[];
  tags?: string[];
}

interface Sentence {
  id: string;
  line: string;
  title: string;
  author: string;
  full_poem: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractSentences(): Promise<Sentence[]> {
  const raw = JSON.parse(await fs.readFile(CORPUS_SOURCE, 'utf-8')) as RawPoem[];
  const sentences: Sentence[] = [];
  let counter = 0;

  for (const poem of raw) {
    for (const para of poem.paragraphs) {
      const parts = para.split(/[，。；！？]/).map((s) => s.trim()).filter((s) => s.length >= 5 && s.length <= 15);
      for (const part of parts) {
        sentences.push({
          id: String(counter++).padStart(5, '0'),
          line: part,
          title: poem.title,
          author: poem.author,
          full_poem: poem.paragraphs.join('\n'),
        });
      }
    }
  }

  console.log(`Extracted ${sentences.length} sentences from ${raw.length} poems`);
  return sentences;
}

function buildTagPrompt(batch: Sentence[]): string {
  const vocabStr = Object.entries(VOCAB)
    .map(([dim, words]) => `- ${dim}: ${words.join('/')}`)
    .join('\n');

  const lines = batch
    .map((s, i) => `${i + 1}. [id:"${s.id}"] "${s.line}" — ${s.author}《${s.title}》`)
    .join('\n');

  return `你是一位精通唐诗的学者。请为以下 ${batch.length} 句唐诗名句打上标签。

每个维度必须从以下词表中选择：
${vocabStr}

返回严格 JSON 数组，顺序与输入一致：
[{"id":"...","subjects":["..."],"moods":["..."],"seasons":["..."],"scenes":["..."],"palette":["..."]}, ...]

诗句列表：
${lines}`;
}

async function tagBatch(batch: Sentence[]): Promise<Record<string, string[]>[]> {
  const response = await kimi.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: '你是一位精通唐诗的学者。请严格返回 JSON 数组。' },
      { role: 'user', content: buildTagPrompt(batch) },
    ],
  });

  const content = response.choices[0]?.message?.content || '[]';
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON from Kimi');
  }

  const results = Array.isArray(parsed) ? parsed : [];
  return results.map((r: unknown) => ({
    subjects: getArray(r, 'subjects'),
    moods: getArray(r, 'moods'),
    seasons: getArray(r, 'seasons'),
    scenes: getArray(r, 'scenes'),
    palette: getArray(r, 'palette'),
  }));
}

function getArray(obj: unknown, key: string): string[] {
  if (!obj || typeof obj !== 'object') return [];
  const val = (obj as Record<string, unknown>)[key];
  return Array.isArray(val) ? val.filter((v): v is string => typeof v === 'string') : [];
}

async function main() {
  console.log('=== 诗入画语料库生成 ===');

  const sentences = await extractSentences();
  const tagged: Array<Sentence & { tags: Record<string, string[]> }> = [];

  const totalBatches = Math.ceil(sentences.length / BATCH_SIZE);
  console.log(`Total batches: ${totalBatches}`);

  for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
    const batch = sentences.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stdout.write(`Batch ${batchNum}/${totalBatches} ... `);

    try {
      const tags = await tagBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        tagged.push({
          ...batch[j],
          tags: tags[j] || { subjects: [], moods: [], seasons: [], scenes: [], palette: [] },
        });
      }
      console.log('OK');
    } catch (err) {
      console.log(`FAILED: ${err}`);
      // Retry once
      process.stdout.write('  Retrying ... ');
      await sleep(RATE_LIMIT_MS * 2);
      try {
        const tags = await tagBatch(batch);
        for (let j = 0; j < batch.length; j++) {
          tagged.push({
            ...batch[j],
            tags: tags[j] || { subjects: [], moods: [], seasons: [], scenes: [], palette: [] },
          });
        }
        console.log('OK');
      } catch (err2) {
        console.log(`FAILED again: ${err2}`);
        // Fallback: empty tags
        for (const s of batch) {
          tagged.push({ ...s, tags: { subjects: [], moods: [], seasons: [], scenes: [], palette: [] } });
        }
      }
    }

    if (i + BATCH_SIZE < sentences.length) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  // Save output
  const output = tagged.map((t) => ({
    id: t.id,
    line: t.line,
    title: t.title,
    author: t.author,
    full_poem: t.full_poem,
    tags: t.tags,
  }));

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nSaved ${output.length} tagged poems to ${OUTPUT_PATH}`);
  console.log('Done!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
