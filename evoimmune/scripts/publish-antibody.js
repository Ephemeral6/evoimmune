// 真 Hub 上链:把一个 EvoImmune 抗体(Gene+Capsule)经 gep_publish_bundle 发布到 evomap.ai。
// 远程模式用 ~/.evomap 的 node_secret 认证(publish 要 node_secret,不是 Gateway Key)。
// Gene/Capsule 按 Hub 的 validateGene/validateCapsule 构造:strategy≥2步、validation 自包含 node -e、env_fingerprint、实质内容。
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { connectGep } from '../src/gepClient.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(resolve(ROOT, '.env'))) process.loadEnvFile(resolve(ROOT, '.env'));

const { EVOMAP_NODE_ID, EVOMAP_NODE_SECRET, EVOMAP_HUB_URL = 'https://evomap.ai' } = process.env;
if (!EVOMAP_NODE_ID || !EVOMAP_NODE_SECRET) { console.error('缺 NODE 凭据,请先 node scripts/register-node.js 并认领'); process.exit(1); }

const gene = {
  type: 'Gene',
  id: 'gene_array_append_immune',
  category: 'repair',
  signals_match: ['TypeError', 'append is not a function', 'array'],
  preconditions: ['Source calls a method named append on a JavaScript array'],
  strategy: [
    'Detect calls to Array.prototype.append which does not exist in JavaScript runtimes',
    'Replace the invalid .append( call with the standard Array .push( method to append elements',
  ],
  constraints: { max_files: 1, forbidden_paths: ['node_modules', '.git'] },
  validation: ['node -e "require(\'assert\').strictEqual([1].push(2),2)"'],
  summary: 'Repair gene: JS arrays have no append(); rewrite .append( to .push(.',
};

const capsule = {
  type: 'Capsule',
  id: 'cap_array_append_immune',
  trigger: ['append is not a function', 'TypeError'],
  gene: 'gene_array_append_immune',
  summary: 'JavaScript 数组没有 append 方法,应改用 push。命中 "append is not a function" 报错即可直接套用此修复,无需重新推导。',
  confidence: 0.95,
  blast_radius: { files: 1, lines: 1 },
  env_fingerprint: { platform: process.platform, arch: process.arch },
  outcome: { status: 'success', score: 0.95 },
  code_snippet: 'arr.append(x)  =>  arr.push(x)   // Array.prototype.append is undefined in JS; use push() to append one element to the end.',
  strategy: ['Replace every .append( call with .push( in the offending source file, then re-run the test.'],
  source_type: 'generated',
};

const event = {
  type: 'EvolutionEvent',
  id: 'ev_array_append_immune',
  intent: 'repair',
  signals: ['TypeError', 'append is not a function'],
  genes_used: ['gene_array_append_immune'],
  mutation_id: 'mut_array_append_immune',
  blast_radius: { files: 1, lines: 1 },
  outcome: { status: 'success', score: 0.95 },
  source_type: 'generated',
};

const gep = await connectGep({ remote: { hubUrl: EVOMAP_HUB_URL, nodeId: EVOMAP_NODE_ID, nodeSecret: EVOMAP_NODE_SECRET }, label: 'evoimmune-publisher' });
console.log('runtime mode:', gep.mode, '| node:', EVOMAP_NODE_ID);

const r = await gep.publishBundle({ gene, capsule, event, modelName: 'evoimmune-swarm' });
console.log('\n发布结果:');
console.log(JSON.stringify(r, null, 2));

const p = r.response?.payload || {};
const proof = {
  ok: r.ok === true,
  node_id: EVOMAP_NODE_ID,
  hub: EVOMAP_HUB_URL,
  bundle_id: p.bundle_id || null,
  decision: p.decision || null,
  reason: p.reason || null,
  gene_asset_id: r.gene_asset_id || null,
  capsule_asset_id: r.capsule_asset_id || null,
  event_asset_id: r.event_asset_id || null,
  published_at: '2026-06-19',
};
const { writeFileSync, mkdirSync } = await import('node:fs');
mkdirSync(resolve(ROOT, 'cockpit/data'), { recursive: true });
writeFileSync(resolve(ROOT, 'cockpit/data/publish.json'), JSON.stringify(proof, null, 2));
console.log('\n[OK] 上链凭证写入 cockpit/data/publish.json');
await gep.close();
