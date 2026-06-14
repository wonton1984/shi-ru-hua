# 诗入画 · Shi Ru Hua

> 上传一张照片，让 AI 为它配一句唐诗名句。

**诗入画**是一个极简的网页应用：你传一张图，它先分析画面中的主体、情绪、季节、场景与色调，再从约 2700 句唐诗名句里选出最契合的一句，最后生成一张可下载的「图 + 诗」图卡。

---

## ✨ 效果

- **上传即得诗**：拖拽或点击上传照片，AI 自动匹配唐诗名句。
- **沉浸式呈现**：图片占满屏幕，诗句以合适的字体、位置、排版浮于画面之上。
- **一键保存图卡**：导出高清 PNG，可直接分享。
- **一图一诗**：相同的图片会得到相同的结果，结果稳定可复现。

---

## 🛠 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Next.js 14 (App Router) + React 18 + TypeScript + Tailwind CSS |
| 上传与预览 | `react-dropzone` + Canvas 压缩 |
| 视觉 / 语言模型 | Google Gemini 2.5 Flash（图片分析与诗句精选） |
| 匹配引擎 | 本地加权 Jaccard 标签打分 + Top-10 AI 二次精选 |
| 图卡导出 | `html-to-image` |
| 测试 | Vitest |

---

## 🚀 本地运行

```bash
git clone https://github.com/wonton1984/shi-ru-hua.git
cd shi-ru-hua
npm install
```

复制环境变量模板并填入你的 Gemini API Key：

```bash
cp .env.local.example .env.local
# 编辑 .env.local，填入 GEMINI_API_KEY=your_key_here
```

启动开发服务器：

```bash
npm run dev
```

打开 http://localhost:3000 即可使用。

---

## 🧪 测试

```bash
npm run test      # 运行单元测试与 API 集成测试
npm run build     # 构建生产版本
```

---

## 📦 部署

项目默认配置即可部署到 Vercel / Netlify。需要在平台后台设置环境变量：

```
GEMINI_API_KEY=your_gemini_api_key_here
```

> 注意：Gemini API Key 是调用图片分析和诗句精选的凭证，请勿提交到仓库。

---

## 📁 项目结构

```
shi-ru-hua/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 主页面（upload → loading → result 状态机）
│   ├── layout.tsx
│   ├── globals.css
│   └── api/match/route.ts  # 图片 → 诗句匹配 API
├── components/
│   ├── UploadZone.tsx      # 拖拽上传
│   ├── LoadingPoetic.tsx   # 诗意 loading
│   ├── ImmersiveView.tsx   # 沉浸式图卡渲染
│   └── SaveButton.tsx      # 导出 PNG
├── lib/
│   ├── gemini.ts           # Gemini API 封装
│   ├── score.ts            # 标签加权 Jaccard 打分
│   ├── style.ts            # 按情绪切换字体/排版风格
│   ├── imageProcessor.ts   # 客户端图片压缩
│   ├── cache.ts            # 图片哈希缓存
│   └── types.ts            # 共享类型
├── data/
│   ├── poems.json          # 带标签的唐诗名句库
│   └── vocab.json          # 受控标签词表
├── scripts/                # 语料生成 / 字体子集化 / 离线打标签脚本
└── tests/                  # Vitest 测试
```

---

## 📝 数据说明

`data/poems.json` 中的诗句基于公开数据集 [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 整理，经分句、去重、长度过滤和标签化后得到约 2700 句。标签维度包括：主体、情绪、季节、场景、色调。

---

## ⚠️ 使用限制

- 本项目为个人作品集，未做公开流量优化。
- 图片会上传到 Gemini API 进行分析，请勿上传敏感或隐私图片。
- 当前仅支持静态图片（JPG / PNG / WebP）。

---

## 📄 License

MIT
