// ⑥ 跨模型免疫:Claude / GPT / Gemini 各当一个家族的零号病人(真模型解),
// 造出的抗体经 EvoMap 注册中心被「全部 6 种模型」的节点继承 → 经验跨模型迁移。
// 真调用只发生在 3 个零号病人(继承是免费 recall)。
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { connectGep } from '../src/gepClient.js';
import { FAMILIES, materialize, runValidation, applyPatch } from '../src/pathogens.js';
import { extractSignals } from '../src/signals.js';
import { makeLlmSolver } from '../src/llmSolver.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(resolve(ROOT, '.env'))) process.loadEnvFile(resolve(ROOT, '.env'));

const ORIGINS = [
  { family: FAMILIES[0], model: 'evomap-claude-opus-4-7', label: 'Claude Opus 4.7' },
  { family: FAMILIES[1], model: 'evomap-gpt-5.5', label: 'GPT 5.5' },
  { family: FAMILIES[2], model: 'evomap-gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
];
const INHERITORS = ['Claude Opus 4.7', 'GPT 5.5', 'Gemini 3.1 Pro', 'DeepSeek V4 Flash', 'GLM 5.1', 'Kimi K2.6'];

const base = resolve(ROOT, '.gepdata/crossmodel');
rmSync(base, { recursive: true, force: true });
const gep = await connectGep({ assetsDir: resolve(base, 'assets'), memoryDir: resolve(base, 'memory') });

// ── Phase 1:三种大模型各自当零号病人,真模型解题并沉淀抗体 ──
const origins = [];
for (const o of ORIGINS) {
  const dir = resolve(base, `origin_${o.family.id}`);
  materialize(dir, o.family.gen(0).files);
  let res = runValidation(dir);
  const signals = extractSignals(res.stderr);
  console.log(`[零号病人] ${o.label} 解 ${o.family.name} ...`);
  const r = await makeLlmSolver({ model: o.model })({ dir, signals });
  res = runValidation(dir);
  origins.push({ family: o.family.name, emoji: o.family.emoji, model: o.label, tokens: r.cost_tokens, ok: res.ok });
  await gep.record({ geneId: o.family.id, signals, status: 'success', score: 0.9,
    summary: JSON.stringify({ patchKind: 'family', familyId: o.family.id, originModel: o.label }) });
  console.log(`  → ${res.ok ? 'PASS' : 'FAIL'} (真 token=${r.cost_tokens})`);
}

// ── Phase 2:6 种模型的节点面对变异体,全部从注册中心继承(免费 recall) ──
const matrix = {}; ORIGINS.forEach((o) => (matrix[o.label] = []));
for (let im = 0; im < INHERITORS.length; im++) {
  for (const o of ORIGINS) {
    const dir = resolve(base, `inh_${im}_${o.family.id}`);
    materialize(dir, o.family.gen(2).files); // 全新变体
    let res = runValidation(dir);
    const signals = extractSignals(res.stderr);
    const rec = await gep.recall(`${o.family.name} ${signals.join(' ')}`, signals);
    const best = (rec.matches || []).filter((m) => m.outcome && m.outcome.status === 'success').sort((a, b) => b.similarity - a.similarity)[0];
    let inherited = false;
    if (best && best.similarity >= 0.6) {
      try { const pl = JSON.parse(best.outcome.note); if (pl.patchKind === 'family') { applyPatch(dir, o.family); res = runValidation(dir); inherited = res.ok; } } catch { /* */ }
    }
    if (inherited) matrix[o.label].push(INHERITORS[im]);
  }
}
await gep.close();

const out = { origins, inheritors: INHERITORS, matrix, verified_at: '2026-06-19' };
mkdirSync(resolve(ROOT, 'cockpit/data'), { recursive: true });
writeFileSync(resolve(ROOT, 'cockpit/data/crossmodel.json'), JSON.stringify(out, null, 2));
console.log('\n跨模型免疫矩阵(抗体来源 → 继承者):');
for (const o of ORIGINS) console.log(`  ${o.label} 造的抗体 → 被 ${matrix[o.label].length}/${INHERITORS.length} 种模型继承`);
console.log('\n[OK] cockpit/data/crossmodel.json');
