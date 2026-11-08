import { readFile, writeFile, mkdir } from 'node:fs/promises';
const source = await Promise.all(['season-chat.js', 'worker.js'].map(file => readFile(file,'utf8')));
await mkdir('dist/server',{recursive:true});
await writeFile('dist/server/index.js',source.join('\n'));
