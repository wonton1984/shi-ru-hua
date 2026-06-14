const Fontmin = require('fontmin');
const fs = require('fs');
const path = require('path');

// 1. 提取 poems.json 中所有唯一字符
const poems = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/poems.json'), 'utf-8'));
const charSet = new Set();
for (const p of poems) {
  for (const c of p.line + p.title + p.author) {
    charSet.add(c);
  }
}
// 加入基本拉丁字符（数字、字母、标点）
for (let i = 0x20; i <= 0x7E; i++) {
  charSet.add(String.fromCharCode(i));
}
const text = Array.from(charSet).sort().join('');
console.log(`Total unique chars: ${charSet.size}`);
fs.writeFileSync(path.join(__dirname, '../public/fonts/chars.txt'), text, 'utf-8');

// 2. 字体配置
const fonts = [
  { src: '/tmp/fonts/mashanzheng.ttf', name: 'MaShanZheng', displayName: 'Ma Shan Zheng' },
  { src: '/tmp/fonts/zhimangxing.ttf', name: 'ZhiMangXing', displayName: 'Zhi Mang Xing' },
  { src: '/tmp/fonts/zcoolxiaowei.ttf', name: 'ZCOOLXiaoWei', displayName: 'ZCOOL XiaoWei' },
  { src: '/tmp/fonts/longcang.ttf', name: 'LongCang', displayName: 'Long Cang' },
  { src: '/tmp/fonts/liujianmaocao.ttf', name: 'LiuJianMaoCao', displayName: 'Liu Jian Mao Cao' },
];

const outputDir = path.join(__dirname, '../public/fonts');

// 3. 为每种字体生成子集
async function subsetFont(font) {
  return new Promise((resolve, reject) => {
    const fontmin = new Fontmin()
      .src(font.src)
      .dest(outputDir)
      .use(Fontmin.glyph({
        text: text,
        hinting: false,
      }))
      .use(Fontmin.ttf2woff2());

    fontmin.run((err, files) => {
      if (err) {
        console.error(`❌ ${font.name}:`, err.message);
        reject(err);
        return;
      }
      const woff2File = files.find(f => f.path.endsWith('.woff2'));
      if (woff2File) {
        const size = (woff2File.contents.length / 1024).toFixed(1);
        console.log(`✅ ${font.name}: ${size} KB`);
      }
      resolve(files);
    });
  });
}

(async () => {
  console.log('\nGenerating font subsets...\n');
  for (const font of fonts) {
    await subsetFont(font);
  }
  console.log('\nDone! Output: public/fonts/');
})();
