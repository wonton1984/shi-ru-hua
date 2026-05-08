# 诗入画 (shi-ru-hua) — 设计规格

**状态：** 设计完成、待实现
**日期：** 2026-05-09
**项目类型：** 个人项目 / 作品集

## 一、项目愿景

一个上传图片即可获得"配图唐诗名句"的极简网页 APP。最终产出是一张可下载的"图 + 诗句"图卡。

## 二、核心决策一览

| 维度 | 决策 |
|------|------|
| 受众 | 自己玩 / 作品集（成本和用户量都不重要） |
| 匹配灵魂 | 混合（主体 + 情绪 + 季节多维叠加） |
| 输出形式 | 极简（一句名句 + 作者 + 出处） |
| 资料库 | 千古名句精选（~3000 句） |
| 视觉风格 | 沉浸式（图占满屏 + 诗句浮层） |
| 交互 / 分享 | 一键保存图卡（PNG），无重匹配按钮、无历史 |
| 匹配引擎 | 检索（标签匹配 top 10）+ AI 二次精选 |
| 部署形态 | 单 Next.js 应用 + Vercel 部署，URL 不公开 |
| 视觉 LLM | Kimi K2.6（通过 Kimi Code Plan API key） |

## 三、用户流程

1. 访问首页 → 大尺寸拖拽 / 点选上传区
2. 选图 → 浏览器立即预览 + "显灵"按钮
3. 点击 → 诗意 loading 动画（"AI 正在沉吟…"）
4. 切到沉浸式呈现：图占满屏 + 诗句浮层 + 作者出处
5. 一角"保存图卡" → Canvas 合成精致 PNG 自动下载
6. 想再来 → "重新开始" 回到 1

**核心约束：** 一图一诗（同一张图多次得同一句，确定性），无登录、无账号、无历史、无社交分享按钮。

## 四、架构

```
浏览器                   Next.js API Route             Kimi K2.6 (Moonshot API)
  │                            │                            │
  │─ POST /api/match (image) ─>│                            │
  │                            │─ 调用 1: 读图 → 标签 ─────>│
  │                            │<──────────── 返回标签 ─────│
  │                            │                            │
  │                            │  本地: 标签 → 名句库       │
  │                            │  加权 Jaccard → top 10     │
  │                            │                            │
  │                            │─ 调用 2: 图+10候选 → 选最配>│
  │                            │<───────── 返回所选 ID ─────│
  │<────── { line, author, title, text_placement, ... } ───┤          │
  │                                                          │
  │  Canvas 合成图卡 → blob → 下载 PNG                      │
```

**技术栈：**

| 角色 | 选择 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 样式 | Tailwind CSS |
| 上传 | `react-dropzone` |
| 视觉 LLM | Kimi K2.6 (model: `kimi-k2.6`) |
| SDK | `openai` 库 + 改 `baseURL` → `https://api.moonshot.ai/v1` |
| 图卡导出 | `html-to-image` |
| 部署 | Vercel |

**API 接入示例：**
```ts
import OpenAI from "openai";
const kimi = new OpenAI({
  apiKey: process.env.KIMI_API_KEY,
  baseURL: "https://api.moonshot.ai/v1",
});
```

**配额特性：**
- Kimi Code Plan 订阅制，无按次成本
- 5 小时滚动窗口约 300-1200 次请求（视档位）
- CLI / VS Code / 本项目共享同账户配额
- URL 不公开发布以避免访客流量消耗个人配额

**环境变量：**
- `KIMI_API_KEY` — 在 Kimi Code Console 创建（最多 5 个，每个仅创建时显示一次）

## 五、数据 — 名句库

**目标规模：** 2500-3500 句

**基底数据：** [`chinese-poetry/chinese-poetry`](https://github.com/chinese-poetry/chinese-poetry) GitHub 仓库（公开数据，约 5 万首全唐诗 JSON）

**筛选漏斗：**

1. 按 "，" / "。" 把每首诗切成独立句子
2. 保留以下集合的并集：
   - 《唐诗三百首》所有句子（~2500 句）
   - 名诗人代表作中的传世名句（人工补充 ~500-1000 句）
3. 去重 + 长度过滤（5-15 字）
4. 最终 ~3000 句

**Schema（`data/poems.json` 单元素结构）：**
```jsonc
{
  "id": "0001",
  "line": "床前明月光，疑是地上霜。",
  "title": "静夜思",
  "author": "李白",
  "full_poem": "床前明月光，疑是地上霜。举头望明月，低头思故乡。",
  "tags": {
    "subjects": ["月", "霜"],     // 1-4 主体名词
    "moods":    ["思乡", "孤独"], // 1-3 情绪
    "seasons":  ["秋"],           // 0-1 季节，可空
    "scenes":   ["夜"],           // 1-2 场景
    "palette":  ["清冷"]          // 1-2 色彩 / 光影
  }
}
```

**受控词表（`data/vocab.json`）：** 每个 tag 维度 ~50 词的**手工白名单**（避免"先有蛋还是先有鸡"问题）。维度示例：
- `subjects`：山 / 水 / 月 / 风 / 云 / 雨 / 雪 / 花 / 柳 / 鸟 / 马 / 酒 / 楼 / 江 / 桥 / 寺 / 钟 / 灯 …
- `moods`：思乡 / 孤独 / 闲适 / 豪迈 / 离愁 / 怀古 / 怅惘 / 喜悦 / 寂寥 / 幽静 …
- `seasons`：春 / 夏 / 秋 / 冬
- `scenes`：山水 / 边塞 / 田园 / 宫闱 / 江上 / 室内 / 夜 / 远景 / 雨景 / 雪景 …
- `palette`：清冷 / 苍翠 / 暮色 / 皎洁 / 浓烈 / 素淡 / 金色 / 玄色 …

打标签脚本和图片标签提取**都从同一份词表选择**，确保两端同构可对位。词表初版手工写，跑完一遍语料库后根据未命中率手工增补。

**离线打标签脚本：** `scripts/tag-corpus.ts`
- 批量调 Kimi K2.6（每次 20 句一批入 prompt）让它返回 JSON
- 强约束 schema + few-shot 示例 + JSON mode
- 失败重试 + 抽查 100 句人工校对
- 跑完落到 `data/poems.json`（git 入库，~2-3 MB）

## 六、匹配引擎

```
请求图片 ──> [缓存命中?] ──yes──> 返回缓存结果
                │ no
                ▼
       ┌─────────────────────┐
       │  Step 1: 图 → 标签  │  Kimi K2.6 调用 1
       │  (受控词表 + JSON)  │  T=0
       └────────┬────────────┘
                ▼
       ┌─────────────────────┐
       │  Step 2: 标签打分    │  纯本地计算，无 API
       │  按维度加权 + Jaccard │
       └────────┬────────────┘
                ▼
       ┌─────────────────────┐
       │  Step 3: 取 top 10  │  多样性 tie-break
       └────────┬────────────┘
                ▼
       ┌─────────────────────┐
       │  Step 4: AI 选最配  │  Kimi K2.6 调用 2
       │  图 + 10 候选 → ID  │  T=0
       └────────┬────────────┘
                ▼
       hash(image) ─> 写缓存 ─> 返回 { line, author, title, text_placement, ... }
```

### Step 1：图片 → 结构化标签

- 调 Kimi K2.6 视觉 + JSON mode
- 提供受控词表（每维度 ~50 词）确保和诗句标签同构
- 输出 schema 包含 tags + **subject_region** + **text_placement**：
  ```jsonc
  {
    "tags": {
      "subjects": ["山", "云"],
      "moods":    ["闲适"],
      "seasons":  [],
      "scenes":   ["远景"],
      "palette":  ["苍翠"]
    },
    "subject_region":  "bottom-right",  // 主体九宫格位置
    "text_placement":  "top-left"       // 建议放诗句的九宫格位置（远离主体且视觉平衡）
  }
  ```
- 九宫格枚举：`top-left | top | top-right | left | center | right | bottom-left | bottom | bottom-right`

### Step 2：本地打分（无 API）

每首诗的 tag 与图片 tag 算加权 Jaccard：
```
score = 0.35·subj_J + 0.30·mood_J + 0.15·season_J + 0.10·scene_J + 0.10·palette_J
```
- 主体和情绪权重最高
- 季节如果图片为空，跳过该维度并把权重摊给主体

### Step 3：取 top 10

- 排序取 10
- 相同分数时优先不同作者（避免 10 句全同一人）

### Step 4：AI 二次精选

- 把图 + 这 10 句（带 tag）给 Kimi K2.6
- prompt："从下列 10 句唐诗名句中选与本图意境最契合的一句，仅返回 ID。"
- T=0、JSON mode、固定 system prompt（吃 Kimi automatic context cache）
- 返回 ID → 查表得 line / author / title

### 确定性保障（"一图一诗"）

- **主要靠 T=0**：温度 0 + 同 prompt + 同图片 ≈ 同输出，这本身就给出"一图一诗"
- **缓存只是优化**：`hash(image bytes)` → 结果，**Vercel serverless 是按 invocation 拉起的，内存 Map 不跨实例共享**。所以缓存仅在同一 Lambda 生存期内有效；冷启动 / 多实例时缓存会丢，但因为 T=0，重算结果仍一致
- 想要跨实例的强缓存可后续上 Vercel KV，YAGNI 阶段暂不做

### 失败兜底

| 场景 | 处理 |
|------|------|
| Step 1 返回非 JSON | 重试 1 次 → 用默认 tag 继续 |
| Step 4 返回坏 ID | 取 Step 3 的 top-1 |
| 全 score 为 0 | 从"安全名句子集"（最有名的 100 句）随机挑一句 |
| Kimi 不返回 text_placement | 本地 9 宫格 variance 扫描挑最"平静"的格子 |

**单次匹配的 Kimi 调用次数：** 2 次（缓存命中 0 次）

## 七、前端 / 视觉

### 页面结构
```
app/
├── page.tsx              # 单页:状态机切 3 个 view (upload | loading | result)
├── api/match/route.ts    # POST 图片 → { line, author, title, text_placement, ... }
├── components/
│   ├── UploadZone.tsx    # 拖拽 / 点选上传 + 客户端压缩
│   ├── LoadingPoetic.tsx # "AI 正在沉吟…" 动画
│   ├── ImmersiveView.tsx # 图占满屏 + 诗句浮层
│   └── SaveButton.tsx    # 调 html-to-image 导出
data/poems.json           # 名句库（带 tags）
data/vocab.json           # 受控词表
lib/
├── kimi.ts               # OpenAI SDK 包 baseURL
├── score.ts              # 加权 Jaccard 打分（纯函数）
└── cache.ts              # imageHash → 结果，内存 Map
scripts/
└── tag-corpus.ts         # 离线打标签脚本
```

### 沉浸式视觉细节

- 图占满 viewport，`object-fit: cover`
- **诗句位置由 Kimi 调用 1 返回的 `text_placement` 决定**，不再固定右下
- **方向 / 排版按 placement 自动切换：**
  - 上 / 下条带 → 横排
  - 左 / 右条带 → 竖排（呼应中式诗笺感）
  - 四角 → 短横排小字
- **可读性保险**：在 placement 区域采 8×8 像素抽样算平均亮度
  - 亮 → 黑字描白边 / 加淡色磨砂矩形背景
  - 暗 → 白字描深边
- 字体栈：`"Noto Serif SC", "Source Han Serif SC", "Songti SC", serif`（系统 fallback；想升级再上 subset 字体）
- 作者 + 出处：诗句下方小字 `— 李白《静夜思》`
- 移动端横屏 / 竖屏自适应

### 保存图卡

- 用 `html-to-image` 库把 `ImmersiveView` 整体导出 PNG
- 输出尺寸：2x viewport（高清）
- 字体在导出前需 `document.fonts.ready` 等待加载完成
- 文件名：`唐诗-${author}-${title}-${timestamp}.png`

### 客户端图片压缩

- 上传前用 Canvas 压到 max 1024px 长边
- 减少 Kimi token 消耗 + 减少传输时间

## 八、错误处理

| 场景 | 处理 |
|------|------|
| 文件 > 10MB | 客户端拒绝并提示 |
| 非图片格式 | 客户端 type guard |
| Kimi 调用 1 失败 | 重试 1 次 → 用默认 tag 继续 |
| Kimi 调用 2 返回坏 ID | 取 Step 3 top-1 |
| Kimi 配额耗尽 (429) | 显示 "AI 今天累了，明日再来" 友好页面 |
| 名句库加载失败 | API route 启动崩，部署时验证就好 |
| iOS Safari `download` 属性失效 | fallback 到打开新 tab + 提示长按保存 |

## 九、测试策略（YAGNI 优先）

- ✅ `score.ts` 单元测试（纯函数，几个 fixture 就够）
- ✅ `/api/match` 集成测试（mock Kimi 返回，验证整条链路）
- ✅ 手动跑 5-10 张代表性图片做烟雾测试（雪山、夕阳、樱花、寒夜、人物、抽象等）
- ❌ 跳过 E2E（Playwright）
- ❌ 跳过视觉回归

## 十、非目标 / 显式 YAGNI

以下功能在本次设计中**故意不做**：

- 用户登录 / 账号系统
- 历史记录 / 收藏夹
- "换一句"按钮 / 多候选切换
- 社交分享按钮（用户保存 PNG 自己发即可）
- 多语言（中文 only）
- 公开 URL / SEO
- 数据库 / Vercel KV（内存 Map 已够）
- 自定义字幕样式 / 主题切换
- 视频 / GIF 输入支持

## 十一、风险 / 已知不确定性

1. **图片标签的"控制词表"对齐效果**：如果 Kimi 没法严格遵守词表会出现匹配失败。需要在 §5 离线打标签时同步落实词表，并在 §6 Step 1 prompt 强校验。
2. **`html-to-image` 在中文字体上的渲染**有时会因字体未加载完成而 fallback 到 sans-serif。实现时需用 `document.fonts.ready` 等待字体加载。
3. **Kimi 配额**作品集若展示给招聘方看，被多人点击有耗尽风险。决策：URL 不公开，只在面试 / 简历中私下贴。
4. **图卡保存**在 iOS Safari 上 `download` 属性表现不一致，需 fallback 到打开新 tab + 提示长按保存。

## 十二、下一步

- [ ] 用户 review 本规格
- [ ] 调用 writing-plans 技能产出实现计划
