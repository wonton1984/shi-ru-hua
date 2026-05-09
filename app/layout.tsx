import './globals.css';

export const metadata = {
  title: '诗入画',
  description: '上传图片，匹配唐诗名句',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&family=Ma+Shan+Zheng&family=Zhi+Mang+Xing&family=ZCOOL+XiaoWei&family=Long+Cang&family=Liu+Jian+Mao+Cao&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
