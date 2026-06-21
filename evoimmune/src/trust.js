// ⑦ 免疫公信层 Trust Layer / 假抗体拒收
// 场景:抗体注册中心被"伪抗体"投毒(自报 0.99 高分,实则不修 bug —— 论文里 84% 的水校验)。
// 对比两种蜂群面对同一被投毒的注册中心:
//   · 盲信蜂群:信任自报分,挑分最高的抗体直接用 → 被伪抗体污染(假治愈)。
//   · EvoImmune 验证蜂群:逐个候选真跑 `node test.cjs`(=EvoMap Validator 沙箱复跑),
//     失败的当场拒收,只接受真能通过校验的 → 0 误判。
// 全程本地,零 key 零赞助消耗。
import { resolve } from 'node:path';
import { rmSync } from 'node:fs';
import { connectGep } from './gepClient.js';
import { FAMILIES, FAMILY_BY_ID, materialize, runValidation, applyPatch, transformSolution, FAKE_PATCH } from './pathogens.js';
import { extractSignals } from './signals.js';

const THRESH = 0.6;

function buildTasks(perFamily) {
  const tasks = [];
  let idx = 0;
  for (let i = 0; i < perFamily; i++) {
    for (const fam of FAMILIES) { tasks.push({ id: `k${idx}_${fam.id}_${i}`, familyId: fam.id, files: fam.gen(i).files }); idx++; }
  }
  return tasks;
}

async function seedPoison(gep) {
  // 每个家族:1 个伪抗体(0.99) + 1 个真抗体(0.90),都进同一注册中心
  for (const fam of FAMILIES) {
    const signals = fam.gen(0).signalsHint;
    await gep.record({ geneId: fam.id, signals, status: 'success', score: 0.99,
      summary: JSON.stringify({ patchKind: 'fake', familyId: fam.id, antibodyId: `fake_${fam.id}` }) });
    await gep.record({ geneId: fam.id, signals, status: 'success', score: 0.90,
      summary: JSON.stringify({ patchKind: 'family', familyId: fam.id, antibodyId: `real_${fam.id}` }) });
  }
}

function applyPayload(dir, fam, payload) {
  if (payload.patchKind === 'fake') transformSolution(dir, FAKE_PATCH);
  else applyPatch(dir, fam);
}

async function runMode(mode, tasks, root) {
  const base = resolve(root, `.gepdata/trust_${mode}`);
  rmSync(base, { recursive: true, force: true });
  const gep = await connectGep({ assetsDir: resolve(base, 'assets'), memoryDir: resolve(base, 'memory') });
  await seedPoison(gep);

  const events = []; let clock = 0;
  const metrics = { mode, tasks: tasks.length, cured: 0, false_cures: 0, rejected: 0, genuine: 0 };

  for (const task of tasks) {
    const dir = resolve(base, 'work', task.id);
    materialize(dir, task.files);
    const fam = FAMILY_BY_ID[task.familyId];
    const res = runValidation(dir);
    const signals = extractSignals(res.stderr);
    const r = await gep.recall(`${fam.name} ${signals.join(' ')}`, signals);
    const matches = (r.matches || [])
      .filter((m) => m.outcome && m.outcome.status === 'success' && m.similarity >= THRESH)
      .sort((a, b) => b.outcome.score - a.outcome.score); // 自报分高在前

    if (mode === 'blind') {
      // 盲信:挑自报分最高 → 伪抗体(0.99),不复跑校验
      const pl = JSON.parse(matches[0].outcome.note);
      applyPayload(dir, fam, pl);
      metrics.cured++; // 自以为治好了
      const truth = runValidation(dir); // 真相
      if (!truth.ok) { metrics.false_cures++; events.push({ t: clock++, family: fam.id, phase: 'false_cure', antibody: pl.antibodyId }); }
      else events.push({ t: clock++, family: fam.id, phase: 'cured', antibody: pl.antibodyId });
    } else {
      // 验证:逐个候选真跑校验,失败拒收,第一个通过的接受
      let accepted = false;
      for (const m of matches) {
        const pl = JSON.parse(m.outcome.note);
        materialize(dir, task.files); // 重置工作区再试
        applyPayload(dir, fam, pl);
        const v = runValidation(dir);
        if (v.ok) { accepted = true; metrics.cured++; metrics.genuine++; events.push({ t: clock++, family: fam.id, phase: 'accepted', antibody: pl.antibodyId }); break; }
        metrics.rejected++; events.push({ t: clock++, family: fam.id, phase: 'rejected', antibody: pl.antibodyId });
      }
      if (!accepted) events.push({ t: clock++, family: fam.id, phase: 'unsolved' });
    }
  }
  await gep.close();
  return { metrics, events };
}

export async function runTrust({ root, perFamily = 6 } = {}) {
  const tasks = buildTasks(perFamily);
  const blind = await runMode('blind', tasks, root);
  const validated = await runMode('validated', tasks, root);
  return { blind, validated, perFamily };
}
