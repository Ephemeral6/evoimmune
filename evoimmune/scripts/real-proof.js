// 真实模型实证:免疫蜂群跑一小批,零号病人用真模型解,其余免疫继承。证明端到端真链路。
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { connectGep } from '../src/gepClient.js';
import { FAMILIES } from '../src/pathogens.js';
import { runSwarm } from '../src/swarm.js';
import { makeProposer } from '../src/proposers.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(resolve(ROOT, '.env'))) process.loadEnvFile(resolve(ROOT, '.env'));

const fams = FAMILIES.slice(0, 3);
const perFamily = 4;
const tasks = [];
let idx = 0;
for (let i = 0; i < perFamily; i++) for (const fam of fams) { tasks.push({ id: `rp${idx}_${fam.id}`, familyId: fam.id, node: idx % 6, files: fam.gen(i).files }); idx++; }

const base = resolve(ROOT, '.gepdata/realproof');
rmSync(base, { recursive: true, force: true });
const gep = await connectGep({ assetsDir: resolve(base, 'assets'), memoryDir: resolve(base, 'memory') });
const m = await runSwarm({ gep, tasks, immunity: true, workRoot: resolve(base, 'work'), proposer: makeProposer({ useLlm: true }), onEvent: () => {} });
await gep.close();

const real = {
  model: process.env.EVOIMMUNE_MODEL,
  tasks: tasks.length,
  real_solves: m.solved_by_llm,
  immune_inherited: m.immune_inherited,
  real_tokens: m.tokens_spent,
  verified_at: '2026-06-19',
};
const outDir = resolve(ROOT, 'cockpit/data');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'realproof.json'), JSON.stringify(real, null, 2));
console.log('真实模型实证:', JSON.stringify(real, null, 2));
console.log(`\n→ ${real.tasks} 任务:真模型解 ${real.real_solves} 个零号病人(真 token=${real.real_tokens})+ ${real.immune_inherited} 个免疫继承(零模型)`);
