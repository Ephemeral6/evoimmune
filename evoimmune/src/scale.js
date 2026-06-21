// 规模化压测 Scale:免疫让规模变便宜——大蜂群解大批任务,只有每个病原的"零号病人"烧模型。
// 产出"战报"级大数字(省 token / 命中率)。只跑免疫组(朴素基线 = 任务总数,无需真跑)。
// 全程本地,零 key 零赞助消耗。
import { resolve } from 'node:path';
import { rmSync } from 'node:fs';
import { connectGep } from './gepClient.js';
import { FAMILIES } from './pathogens.js';
import { runSwarm } from './swarm.js';
import { makeProposer } from './proposers.js';

const NODES = 64;
const EST = 1800;

function tasksFor(perFamily) {
  const tasks = [];
  let idx = 0;
  for (let i = 0; i < perFamily; i++) {
    for (const fam of FAMILIES) { tasks.push({ id: `s${idx}_${fam.id}`, familyId: fam.id, node: idx % NODES, files: fam.gen(i).files }); idx++; }
  }
  return tasks;
}

export async function runScale({ root, perFamily = 30 } = {}) {
  const tasks = tasksFor(perFamily);
  const base = resolve(root, '.gepdata/scale');
  rmSync(base, { recursive: true, force: true });
  const gep = await connectGep({ assetsDir: resolve(base, 'assets'), memoryDir: resolve(base, 'memory') });
  const m = await runSwarm({ gep, tasks, immunity: true, workRoot: resolve(base, 'work'), proposer: makeProposer({ useLlm: false }), onEvent: () => {} });
  await gep.close();

  const total = tasks.length;
  return {
    total, families: FAMILIES.length, nodes: NODES,
    naive_solves: total,
    immune_solves: m.solved_by_llm,
    immune_inherited: m.immune_inherited,
    saved_pct: Math.round((1 - m.solved_by_llm / total) * 100),
    saved_tokens: (total - m.solved_by_llm) * EST,
  };
}
