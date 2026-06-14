import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { temperature: 0 },
});

const VOCAB = {
  subjects: '山,水,月,风,云,雨,雪,花,柳,鸟,马,酒,楼,江,河,桥,寺,钟,灯,松,竹,梅,菊,莲,石,路,天,海,城,村,舟,雁,鹤,鹿,泉,田,草,木,叶,霜,露,日,星,雾,雷,虹,烟,沙,帆,笛'.split(','),
  moods: '思乡,孤独,闲适,豪迈,离愁,怀古,怅惘,喜悦,寂寥,幽静,激昂,哀怨,旷达,恬淡,愁绪,忧伤,壮志,逍遥,温情,悲凉'.split(','),
  seasons: ['春','夏','秋','冬'],
  scenes: '山水,边塞,田园,宫闱,江上,室内,夜,远景,雨景,雪景,旷野,都市,庭院,古刹,战场,驿道,孤舟,大漠,深林,高台'.split(','),
  palette: '清冷,苍翠,暮色,皎洁,浓烈,素淡,金色,玄色,暖色,素白,浓翠,朱红,墨色,幽蓝,绯红,昏黄,黛青,银白'.split(','),
};

const raw = JSON.parse(fs.readFileSync('/tmp/chinese-poetry/全唐诗/唐诗三百首.json', 'utf-8'));

const sentences = [];
for (const poem of raw) {
  for (const para of poem.paragraphs) {
    for (const part of para.split(/[，。；！？]/).map(s => s.trim()).filter(s => s.length >= 5 && s.length <= 15)) {
      sentences.push({
        id: String(sentences.length).padStart(5, '0'),
        line: part,
        title: poem.title,
        author: poem.author,
        full_poem: poem.paragraphs.join('\n'),
        tags: { subjects: [], moods: [], seasons: [], scenes: [], palette: [] },
      });
    }
  }
}

console.log(`Total: ${sentences.length} sentences`);

const BATCH = 15;
const totalBatches = Math.ceil(sentences.length / BATCH);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

for (let i = 0; i < sentences.length; i += BATCH) {
  const batch = sentences.slice(i, i + BATCH);
  const bn = Math.floor(i / BATCH) + 1;
  process.stdout.write(`Batch ${bn}/${totalBatches} ... `);

  const vocabText = Object.entries(VOCAB).map(([k, v]) => `- ${k}: ${v.join('/')}`).join('\n');
  const lines = batch.map((s, idx) => `${idx + 1}. [id:"${s.id}"] "${s.line}" — ${s.author}《${s.title}》`).join('\n');
  const prompt = `你是一位精通唐诗的学者。请为以下 ${batch.length} 句唐诗名句打上标签。
每个维度必须从以下词表中选择（如果没有合适的可以留空）：
${vocabText}
返回严格 JSON 数组，顺序与输入一致，不要任何额外解释：
[{"id":"...","subjects":["..."],"moods":["..."],"seasons":["..."],"scenes":["..."],"palette":["..."]}, ...]
诗句列表：
${lines}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    const results = Array.isArray(parsed) ? parsed : [];
    for (let j = 0; j < batch.length; j++) {
      const r = results[j] || {};
      for (const k of ['subjects', 'moods', 'seasons', 'scenes', 'palette']) {
        const v = r[k];
        batch[j].tags[k] = Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
      }
    }
    console.log('OK');
  } catch (e) {
    console.log(`FAIL: ${e.message.slice(0, 80)}`);
  }

  if (i + BATCH < sentences.length) await sleep(2000);
}

const out = sentences.map(s => ({ id: s.id, line: s.line, title: s.title, author: s.author, full_poem: s.full_poem, tags: s.tags }));
fs.writeFileSync('/Users/wonton1984/projects/shi-ru-hua/data/poems.json', JSON.stringify(out, null, 2), 'utf-8');
console.log(`\nSaved ${out.length} tagged poems.`);
