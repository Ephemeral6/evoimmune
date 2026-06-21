// 探针:同一 signals 写入多条 outcome,recall 是返回多个候选,还是按 signal_key 去重/合并?
// 决定"假抗体 vs 真抗体"投毒场景的设计。
import { connectGep } from '../src/gepClient.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { rmSync } from 'node:fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = resolve(ROOT, '.gepdata/probe');
rmSync(base, { recursive: true, force: true });

const gep = await connectGep({ assetsDir: resolve(base, 'assets'), memoryDir: resolve(base, 'memory') });
const signals = ['TypeError', 'append is not a function'];

await gep.record({ geneId: 'gene_x', signals, status: 'success', score: 0.99, summary: JSON.stringify({ kind: 'FAKE', id: 'fake_1' }) });
await gep.record({ geneId: 'gene_x', signals, status: 'success', score: 0.90, summary: JSON.stringify({ kind: 'REAL', id: 'real_1' }) });

const r = await gep.recall('append is not a function', signals);
console.log('matches 数量:', (r.matches || []).length);
console.log(JSON.stringify(r.matches, null, 2));
await gep.close();
