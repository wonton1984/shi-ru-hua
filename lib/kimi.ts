import OpenAI from 'openai';
import { vocabulary } from './vocab';
import type { ImageAnalysis, GridPosition, PoemTags } from './types';

const kimi = new OpenAI({
  apiKey: process.env.KIMI_API_KEY!,
  baseURL: 'https://api.moonshot.ai/v1',
});

const MODEL = 'kimi-k2.6';

function buildTagPrompt(): string {
  return `你是一位精通唐诗鉴赏的图像分析师。请分析用户上传的图片，按以下受控词表提取标签。每个维度的标签必须从给定词表中选择。

词表：
- subjects（主体，1-4个）：${vocabulary.subjects.join(' / ')}
- moods（情绪，1-3个）：${vocabulary.moods.join(' / ')}
- seasons（季节，0-1个）：${vocabulary.seasons.join(' / ')}
- scenes（场景，1-2个）：${vocabulary.scenes.join(' / ')}
- palette（色彩/光影，1-2个）：${vocabulary.palette.join(' / ')}

额外返回：
- subject_region: 主体在画面中的九宫格位置
- text_placement: 建议放置诗句的九宫格位置（远离主体，视觉平衡）

九宫格可选值：top-left | top | top-right | left | center | right | bottom-left | bottom | bottom-right

返回严格 JSON，不要任何解释：
{
  "tags": {
    "subjects": [...],
    "moods": [...],
    "seasons": [...],
    "scenes": [...],
    "palette": [...]
  },
  "subject_region": "...",
  "text_placement": "..."
}`;
}

function buildSelectionPrompt(
  candidates: { id: string; line: string; author: string; title: string; tags: string }[]
): string {
  const lines = candidates
    .map(
      (c, i) =>
        `${i + 1}. [id: "${c.id}"] "${c.line}" — ${c.author}《${c.title}》\n   tags: ${c.tags}`
    )
    .join('\n');

  return `你是一位唐诗鉴赏家。请从候选诗句中，选出与图片意境最契合的一句。

候选诗句：
${lines}

返回严格 JSON：{"selected_id": "string"}`;
}

function isValidGridPosition(v: unknown): v is GridPosition {
  const valid = [
    'top-left',
    'top',
    'top-right',
    'left',
    'center',
    'right',
    'bottom-left',
    'bottom',
    'bottom-right',
  ];
  return typeof v === 'string' && valid.includes(v);
}

export async function extractTags(base64Image: string): Promise<ImageAnalysis> {
  const response = await kimi.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildTagPrompt() },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
          { type: 'text', text: '请分析这张图片，返回 JSON。' },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content || '{}';
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Kimi returned invalid JSON for tag extraction');
  }

  const tags = (parsed.tags || {}) as ImageAnalysis['tags'];
  const subject_region = isValidGridPosition(parsed.subject_region)
    ? parsed.subject_region
    : 'center';
  const text_placement = isValidGridPosition(parsed.text_placement)
    ? parsed.text_placement
    : 'bottom-right';

  return { tags, subject_region, text_placement };
}

export async function selectBestMatch(
  base64Image: string,
  candidates: {
    id: string;
    line: string;
    author: string;
    title: string;
    tags: PoemTags;
  }[]
): Promise<string> {
  const candidateStrings = candidates.map((c) => ({
    id: c.id,
    line: c.line,
    author: c.author,
    title: c.title,
    tags: JSON.stringify(c.tags),
  }));

  const response = await kimi.chat.completions.create({
    model: MODEL,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: buildSelectionPrompt(candidateStrings) },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
          { type: 'text', text: '请从候选诗句中选出最契合的一句。' },
        ],
      },
    ],
  });

  const content = response.choices[0]?.message?.content || '{}';
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Kimi returned invalid JSON for selection');
  }

  const selectedId = parsed.selected_id;
  if (typeof selectedId !== 'string') {
    throw new Error('Kimi did not return a valid selected_id');
  }

  return selectedId;
}
