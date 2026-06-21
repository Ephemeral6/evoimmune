// 协同进化分析:模型不变,免疫库随波次增长 → harness 独立变强。
// 每波引入更多病原家族(逐波 +1),共享同一抗体库;记录每波 命中率 / 平均 token/任务。
// 曲线:命中率↑、token/任务↓ 并趋于平台 = 「Model × Harness 协同进化」的可视化。
import { resolve } from 'node:path';
import { rmSync } from 'node:fs';
import { connectGep } from './gepClient.js';
import { FAMILIES } from './pathogens.js';
import { runSwarm } from './swarm.js';
import { makeProposer } from './proposers.js';

export async function runCoevolution({ root, perFamily = 3 } = {}) {
  const F = FAMILIES.length;
  const waves = F + 2;
  const base = resolve(root, '.gepdata/coevo');
  rmSync(base, { recursive: true, force: true });
  const gep = await connectGep({ assetsDir: resolve(base, 'assets'), memoryDir: resolve(base, 'memory') });
  const proposer = makeProposer({ useLlm: false });
  const series = [];

  for (let w = 0; w < waves; w++) {
    const fams = FAMILIES.slice(0, Math.min(w + 1, F)); // 逐波多曝光一个新家族,封顶 F
    const tasks = [];
    let idx = 0;
    for (let i = 0; i < perFamily; i++) {
      for (const fam of fams) {
        tasks.push({ id: `co_w${w}_${idx}_${fam.id}`, familyId: fam.id, node: idx % 16, files: fam.gen(w * perFamily + i).files });
        idx++;
      }
    }
    const m = await runSwarm({ gep, tasks, immunity: true, workRoot: resolve(base, `w${w}`), proposer, onEvent: () => {} });
    const total = tasks.length;
    series.push({
      wave: w + 1,
      families: fams.length,
      solves: m.solved_by_llm,
      immune: m.immune_inherited,
      hitRate: total ? Math.round((m.immune_inherited / total) * 1000) / 10 : 0,
      tokensPerTask: total ? Math.round(m.tokens_spent / total) : 0,
    });
  }
  await gep.close();
  return { waves, perFamily, families: F, model: 'evomap-gemini-3.1-pro-preview(固定)', series };
}
