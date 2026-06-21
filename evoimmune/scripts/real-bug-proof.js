// 真实复杂 bug 实证:真模型现场读测试→推理→修复(非 transform,真推理)。
// 再证一次复发免疫(同类 bug 第二次出现,套抗体零模型修好)。写 cockpit/data/realbug.json。
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { REAL_BUGS } from '../src/realBugs.js';
import { materialize, runValidation, transformSolution } from '../src/pathogens.js';
import { extractSignals } from '../src/signals.js';
import { makeLlmSolver } from '../src/llmSolver.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(resolve(ROOT, '.env'))) process.loadEnvFile(resolve(ROOT, '.env'));
const solver = makeLlmSolver();
const sol = (dir) => readFileSync(resolve(dir, 'solution.cjs'), 'utf8');

const out = { model: process.env.EVOIMMUNE_MODEL, verified_at: '2026-06-20', bugs: [] };

for (const bug of REAL_BUGS) {
  const base = resolve(ROOT, `.gepdata/realbug/${bug.id}`);
  rmSync(base, { recursive: true, force: true });

  // 1) 零号病人:真模型现场推理
  const d0 = resolve(base, 'v0');
  materialize(d0, bug.gen(0).files);
  const before = sol(d0);
  let r0 = runValidation(d0);
  const signals = extractSignals(r0.stderr);
  console.log(`\n[${bug.name}] 修复前: ${r0.ok ? 'PASS(意外)' : 'FAIL'} | 信号: ${signals.join(' / ')}`);
  console.log('  ' + (r0.stderr.split('\n').find((l) => l.includes('expected')) || '').trim());
  const fix = await solver({ dir: d0, signals });
  r0 = runValidation(d0);
  const after = sol(d0);
  console.log(`  → 真模型(${fix.model})推理修复: ${r0.ok ? 'PASS ✓✓' : 'FAIL ✗'} | 真 token=${fix.cost_tokens}`);

  // 2) 复发免疫:第二个变体,套抗体(参考修复变换)零模型修好
  const d2 = resolve(base, 'v2');
  materialize(d2, bug.gen(2).files);
  transformSolution(d2, bug.patch);
  const rImm = runValidation(d2);
  console.log(`  → 同类复发(变体2)电报免疫(零模型): ${rImm.ok ? 'PASS ✓' : 'FAIL ✗'}`);

  out.bugs.push({
    id: bug.id, name: bug.name, emoji: bug.emoji,
    buggy_line: bug.buggy_line, fix_line: bug.fix_line,
    diagnostic: (r0.stderr || '').trim().slice(0, 0) || signals.join(' / '),
    model_solved: r0.ok, tokens: fix.cost_tokens,
    immune_ok: rImm.ok,
    before: before.trim(), after: after.trim(),
  });
}

mkdirSync(resolve(ROOT, 'cockpit/data'), { recursive: true });
writeFileSync(resolve(ROOT, 'cockpit/data/realbug.json'), JSON.stringify(out, null, 2));
console.log('\n[OK] cockpit/data/realbug.json');
