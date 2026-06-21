// 最小验证:只调 1 次真模型,确认 EvoMap 网关通 + 真能修好 bug。
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { FAMILIES, materialize, runValidation } from '../src/pathogens.js';
import { extractSignals } from '../src/signals.js';
import { makeLlmSolver } from '../src/llmSolver.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(resolve(ROOT, '.env'))) process.loadEnvFile(resolve(ROOT, '.env'));
console.log('网关:', process.env.EVOMAP_GATEWAY_URL, '| 模型:', process.env.EVOIMMUNE_MODEL, '| key:', (process.env.EVOMAP_API_KEY || '').slice(0, 12) + '…');

const fam = FAMILIES[0]; // 幽灵方法 .append()
const dir = resolve(ROOT, '.gepdata/verify_llm');
materialize(dir, fam.gen(0).files);

let res = runValidation(dir);
const signals = extractSignals(res.stderr);
console.log('\n修复前:', res.ok ? 'PASS(意外)' : 'FAIL ✓(已感染)', '| 信号:', signals.join(' / '));

const solver = makeLlmSolver();
const r = await solver({ dir, signals });
res = runValidation(dir);

console.log('真模型解题:', r.model, '| tokens =', r.cost_tokens);
console.log('修复后:', res.ok ? 'PASS ✓✓ —— 真模型把 bug 修好了!' : 'FAIL ✗');
if (!res.ok) console.log('stderr:', res.stderr.slice(0, 200), '\n--- 模型产出 ---\n', readFileSync(resolve(dir, 'solution.cjs'), 'utf8').slice(0, 300));
