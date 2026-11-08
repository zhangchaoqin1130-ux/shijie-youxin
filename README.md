# 时节有信

围绕二十四节气与七十二候的互动网页，包含节气读物、物候动效、音乐、小游戏和 AI 问答。

## 本地预览

在项目目录运行 `python -m http.server 8000 --directory dist/client`，然后打开 http://localhost:8000 。此方式可体验静态页面。

## AI 问答与部署

使用 Node.js 运行 `node build-cloudflare.mjs`，将生成的 `dist/cloudflare` 目录部署到 Cloudflare Pages。在部署环境设置服务端变量 `DEEPSEEK_API_KEY` 后即可启用 AI 问答。
