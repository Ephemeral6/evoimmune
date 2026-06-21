// 疫苗接种 Vaccination:扣手册原话"让其他节点生来就具备群体免疫"。
// 第一代蜂群付代价学会抗体 → 第二代共享同一抗体注册中心,面对全新变体「生来免疫」(0 次 LLM)。
// 对照组:第二代若不接种(空注册中心),要把代价重新付一遍。
// 全程本地,零 key 零赞助消耗。
import { resolve } from 'node:path';
import { rmSync } from 'node:fs';
import { connectGep } from './gepClient.js';
import { FAMILIES } from './pathogens.js';
import { runSwarm } from './swarm.js';
import { makeProposer } from './proposers.js';

function tasksFor(count, offset) {
  const tasks = [];
  let idx = 0;
  for (let i = 0; i < count; i++) {
    for (const fam of FAMILIES) {
      tasks.push({ id: `g${offset}_${idx}_${fam.id}`, familyId: fam.id, node: idx % 12, files: fam.gen(offset + i).files });
      idx++;
    }
  }
  return tasks;
}

export async function runVaccinate({ root, perGen = 4 } = {}) {
  const proposer = makeProposer({ useLlm: false });
  const setA = tasksFor(perGen, 0);      // 第一代变体 0..(perGen-1)
  const setB = tasksFor(perGen, 100);    // 第二代:全新变体(数据不同,病原签名相同)

  // 第一代 + 第二代接种:共享同一注册中心
  const base = resolve(root, '.gepdata/vacc');
  rmSync(base, { recursive: true, force: true });
  const gep = await connectGep({ assetsDir: resolve(base, 'assets'), memoryDir: resolve(base, 'memory') });
  const bootstrap = await runSwarm({ gep, tasks: setA, immunity: true, workRoot: resolve(base, 'boot'), proposer, onEvent: () => {} });
  const vEvents = [];
  const vaccinated = await runSwarm({ gep, tasks: setB, immunity: true, workRoot: resolve(base, 'g2'), proposer, onEvent: (e) => vEvents.push(e) });
  await gep.close();

  // 对照:第二代未接种(全新空注册中心)
  const cbase = resolve(root, '.gepdata/vacc_control');
  rmSync(cbase, { recursive: true, force: true });
  const gep2 = await connectGep({ assetsDir: resolve(cbase, 'assets'), memoryDir: resolve(cbase, 'memory') });
  const control = await runSwarm({ gep: gep2, tasks: setB, immunity: true, workRoot: resolve(cbase, 'g2'), proposer, onEvent: () => {} });
  await gep2.close();

  return {
    families: FAMILIES.length,
    bootstrap,
    vaccinated: { ...vaccinated, events: vEvents },
    control,
  };
}
