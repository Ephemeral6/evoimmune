// 运行器:对每个真实世界 bug case,在临时目录落盘 buggy 代码 + test.cjs + regress.cjs,
// 真实用 `node` 跑三态验证(buggy / fixed / wrongPatch),展示 SWE-bench 双门契约。
//   buggy    : FAIL_TO_PASS 应失败(bug 真实存在)
//   fixed    : FAIL_TO_PASS 通过 且 PASS_TO_PASS 通过(真修好、没改坏)
//   wrongPatch: FAIL_TO_PASS 可能过、但 PASS_TO_PASS 挂(双门拦截过拟合)
// 结果落盘 realbugs/proof.json。必须 `node realbugs/run.mjs` 跑通 exit 0。
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { CASES } from './cases.mjs';
import { toSweBenchTask } from './swebench.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

// 落盘一个工作区:solution.cjs + test.cjs + regress.cjs
function materialize(dir, solution, c) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'solution.cjs'), solution);
  writeFileSync(resolve(dir, 'test.cjs'), c.failToPass);
  writeFileSync(resolve(dir, 'regress.cjs'), c.passToPass);
}

// 用 node 跑单个测试文件,exit 0 即通过
function runNode(dir, file) {
  const r = spawnSync('node', [file], { cwd: dir, encoding: 'utf8', timeout: 60000 });
  return { ok: r.status === 0, err: (r.stderr || '') + (r.error ? ` ${r.error.message}` : '') };
}

// 跑双门:返回 { failToPass, passToPass }
function validate(dir) {
  const t = runNode(dir, 'test.cjs');
  const r = runNode(dir, 'regress.cjs');
  return { failToPass: t.ok, passToPass: r.ok, testErr: t.err.trim(), regressErr: r.err.trim() };
}

const mark = (b) => (b ? 'PASS' : 'FAIL');
const proof = { verified_at: new Date().toISOString().slice(0, 10), node: process.version, cases: [] };
let allOk = true;

console.log('═'.repeat(72));
console.log('EvoImmune · realbugs —— 真实世界 bug 语料 三态验证(SWE-bench 双门契约)');
console.log('═'.repeat(72));

for (const c of CASES) {
  const base = resolve(HERE, '.work', c.id);

  // 1) buggy:FAIL_TO_PASS 应失败
  materialize(base, c.buggy, c);
  const vBuggy = validate(base);

  // 2) fixed:FAIL_TO_PASS 通过 且 PASS_TO_PASS 通过
  materialize(base, c.fixed, c);
  const vFixed = validate(base);

  // 3) wrongPatch:FAIL_TO_PASS 可能过、PASS_TO_PASS 应挂
  materialize(base, c.wrongPatch, c);
  const vWrong = validate(base);

  rmSync(base, { recursive: true, force: true });

  // 判定:三态是否符合预期
  const buggyOk = vBuggy.failToPass === false; // bug 真实存在
  const fixedOk = vFixed.failToPass === true && vFixed.passToPass === true; // 真修好
  const wrongOk = vWrong.passToPass === false; // 被回归门拦下(双门起作用)
  const casePass = buggyOk && fixedOk && wrongOk;
  if (!casePass) allOk = false;

  console.log(`\n● [${c.id}] ${c.name}  ${casePass ? '✓ 符合预期' : '✗ 不符'}`);
  console.log(`  出处: ${c.real_world.split('。')[0]}。`);
  console.log('  ┌──────────────┬──────────────┬──────────────┐');
  console.log('  │ 版本         │ FAIL_TO_PASS │ PASS_TO_PASS │');
  console.log('  ├──────────────┼──────────────┼──────────────┤');
  console.log(`  │ buggy        │ ${mark(vBuggy.failToPass).padEnd(12)} │ ${mark(vBuggy.passToPass).padEnd(12)} │  ← 期望 FAIL(bug 真实)`);
  console.log(`  │ fixed        │ ${mark(vFixed.failToPass).padEnd(12)} │ ${mark(vFixed.passToPass).padEnd(12)} │  ← 期望 双 PASS(真修好)`);
  console.log(`  │ wrongPatch   │ ${mark(vWrong.failToPass).padEnd(12)} │ ${mark(vWrong.passToPass).padEnd(12)} │  ← 期望 回归 FAIL(拦过拟合)`);
  console.log('  └──────────────┴──────────────┴──────────────┘');
  if (!buggyOk) console.log(`  [!] buggy 的 FAIL_TO_PASS 没有失败,bug 复现失败`);
  if (!fixedOk) console.log(`  [!] fixed 没有双门通过 — test:${vFixed.testErr || 'ok'} | regress:${vFixed.regressErr || 'ok'}`);
  if (!wrongOk) console.log(`  [!] wrongPatch 未被回归门拦下,过拟合演示失败`);

  proof.cases.push({
    id: c.id,
    name: c.name,
    real_world: c.real_world,
    swebench: toSweBenchTask(c),
    triage: {
      buggy: { failToPass: vBuggy.failToPass, passToPass: vBuggy.passToPass, expect: 'FAIL_TO_PASS=false' },
      fixed: { failToPass: vFixed.failToPass, passToPass: vFixed.passToPass, expect: 'both=true' },
      wrongPatch: { failToPass: vWrong.failToPass, passToPass: vWrong.passToPass, expect: 'PASS_TO_PASS=false' },
    },
    verdict: casePass ? 'OK' : 'MISMATCH',
  });
}

rmSync(resolve(HERE, '.work'), { recursive: true, force: true });

proof.summary = {
  total: CASES.length,
  ok: proof.cases.filter((c) => c.verdict === 'OK').length,
  all_pass: allOk,
};
writeFileSync(resolve(HERE, 'proof.json'), JSON.stringify(proof, null, 2));

console.log('\n' + '═'.repeat(72));
console.log(`总计 ${proof.summary.total} 个 case,符合预期 ${proof.summary.ok} 个,全部通过=${allOk}`);
console.log(`证据已写入 realbugs/proof.json`);
console.log('完整 SWE-bench Docker-per-task 验证为下一步;本验证门与 SWE-bench 说同一种契约语言。');
console.log('═'.repeat(72));

process.exit(allOk ? 0 : 1);
