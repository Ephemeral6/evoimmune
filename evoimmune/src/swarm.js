// 免疫蜂群编排:调度 N 个 EvoImmune Harness 实例(每任务一个 7 阶段回路),共享同一 EvoMap 资产库。
// 事件流转发给疫情驾驶舱;返回流行病学 + harness 指标。
import { resolve } from 'node:path';
import { FAMILY_BY_ID } from './pathogens.js';
import { runHarness } from './harness.js';
import { makeBudget } from './budget.js';

export async function runSwarm({ gep, tasks, immunity, workRoot, proposer, onEvent, maxAttempts = 4 }) {
  let clock = 0;
  const emit = (e) => onEvent && onEvent({ t: clock++, ...e });
  const metrics = {
    mode: immunity ? 'immune' : 'naive',
    tasks: tasks.length,
    solved_by_llm: 0, immune_inherited: 0, failed: 0,
    tokens_spent: 0, attempts_total: 0,
    by_family: {}, immunity_coverage: [],
  };
  const familiesSeen = new Set();
  const totalFamilies = new Set(tasks.map((t) => t.familyId)).size;

  for (const task of tasks) {
    const fam = FAMILY_BY_ID[task.familyId];
    metrics.by_family[fam.id] = metrics.by_family[fam.id] || { solved: 0, immune: 0 };
    const budget = makeBudget({ maxAttempts });
    const r = await runHarness({ task, fam, gep, proposer, immunity, workRoot, budget, onEvent: emit });
    metrics.attempts_total += r.attempts || 0;
    if (r.via === 'immunity') { metrics.immune_inherited++; metrics.by_family[fam.id].immune++; }
    else if (r.via === 'solve') { metrics.solved_by_llm++; metrics.tokens_spent += r.tokens || 0; metrics.by_family[fam.id].solved++; familiesSeen.add(fam.id); }
    else if (r.via === 'failed') { metrics.failed++; }
    metrics.immunity_coverage.push(immunity ? familiesSeen.size / totalFamilies : 0);
  }
  return metrics;
}
