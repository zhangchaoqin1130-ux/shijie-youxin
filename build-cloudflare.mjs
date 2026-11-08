import { cp, mkdir, writeFile } from 'node:fs/promises';
import './build.mjs';

const output = 'dist/cloudflare';
await mkdir(output, { recursive: true });
await cp('dist/client', output, { recursive: true });
await cp('dist/server/index.js', `${output}/_worker.js`);
await writeFile(`${output}/_routes.json`, JSON.stringify({
  version: 1,
  include: ['/api/*'],
  exclude: []
}, null, 2) + '\n');
await writeFile(`${output}/404.html`, '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>页面未找到</title><p>页面未找到。</p><a href="/">返回时节有信</a></html>\n');
