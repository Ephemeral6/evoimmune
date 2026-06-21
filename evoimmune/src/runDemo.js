// T0 离线 demo 入口:同一批任务跑两遍 —— 朴素蜂群(免疫OFF) vs 免疫蜂群(免疫ON),
// 对照"LLM 解题次数 / 免疫继承次数 / 省 token",并把事件流+指标写给疫情驾驶舱。
// 全程本地 gep 资产库,零 key、零网络、零赞助消耗。
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { connectGep } from './gepClient.js';
import { FAMILIES } from './pathogens.js';
import { runSwarm } from './swarm.js';
import { makeProposer } from './proposers.js';
import { runTrust } from './trust.js';
import { runVariant } from './variant.js';
import { runVaccinate } from './vaccinate.js';
import { runScale } from './scale.js';
import { runCoevolution } from './coevolution.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function buildTasks({ perFamily, nodes }) {
  const tasks = [];
  let idx = 0;
  // 交错:同家族任务分散到不同节点不同时间 → 免疫扩散更明显
  for (let i = 0; i < perFamily; i++) {
    for (const fam of FAMILIES) {
      const spec = fam.gen(i);
      tasks.push({ id: `t${idx}_${fam.id}_${i}`, familyId: fam.id, node: idx % nodes, files: spec.files });
      idx++;
    }
  }
  return tasks;
}

async function runOnce({ immunity, tasks, runId }) {
  const base = resolve(ROOT, `.gepdata/${runId}`);
  rmSync(base, { recursive: true, force: true });
  const gep = await connectGep({ assetsDir: resolve(base, 'assets'), memoryDir: resolve(base, 'memory') });
  const events = [];
  const metrics = await runSwarm({
    gep, tasks, immunity,
    workRoot: resolve(base, 'work'),
    proposer: makeProposer({ useLlm: false }),
    onEvent: (e) => events.push(e),
  });
  const status = await gep.status();
  await gep.close();
  return { metrics, events, status };
}

async function main() {
  // 自动加载项目根 .env(放 EvoMap key / 网关地址);文件不存在则忽略,保持离线默认。
  try {
    const envPath = resolve(ROOT, '.env');
    if (existsSync(envPath)) { process.loadEnvFile(envPath); console.log(`[env] 已加载 .env(solver=${process.env.EVOIMMUNE_SOLVER || 'stub'})`); }
  } catch (e) { console.warn('[env] .env 加载失败:', e.message); }

  const nodes = 12, perFamily = 8;
  const tasks = buildTasks({ perFamily, nodes });
  console.log(`\n蜂群规模:${nodes} 节点 · ${tasks.length} 任务 (${FAMILIES.length} 病原家族 × ${perFamily} 变体)\n`);

  const naive = await runOnce({ immunity: false, tasks, runId: 'run_naive' });
  const immune = await runOnce({ immunity: true, tasks, runId: 'run_immune' });

  // ⑦ 免疫公信层:伪抗体投毒 → 盲信 vs 验证
  console.log('\n[Trust] 抗体注册中心投毒,跑 盲信 vs 验证 ...');
  const trust = await runTrust({ root: ROOT, perFamily: 6 });

  // ⑤ 变异攻防:野生 → 交叉免疫 → 免疫逃逸 → 加强针
  console.log('[Variant] 变异攻防 ...');
  const variant = await runVariant({ root: ROOT });

  // 疫苗接种:第一代学会 → 第二代生来免疫
  console.log('[Vaccinate] 疫苗接种(生来免疫)...');
  const vaccinate = await runVaccinate({ root: ROOT, perGen: 4 });

  // 规模化压测:大蜂群战报
  console.log('[Scale] 规模化压测 ...');
  const scale = await runScale({ root: ROOT, perFamily: 30 });

  // 协同进化:免疫库随波次增长,harness 独立变强
  console.log('[Coevo] 协同进化分析 ...');
  const coevolution = await runCoevolution({ root: ROOT, perFamily: 3 });

  const outDir = resolve(ROOT, 'cockpit/data');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, 'naive.json'), JSON.stringify(naive, null, 2));
  writeFileSync(resolve(outDir, 'immune.json'), JSON.stringify(immune, null, 2));
  // 供疫情驾驶舱直接 file:// 打开(免 fetch/CORS)
  writeFileSync(resolve(outDir, 'data.js'),
    `window.__EVOIMMUNE__=${JSON.stringify({ naive, immune, trust, variant, vaccinate, scale, coevolution, families: FAMILIES.map((f) => ({ id: f.id, name: f.name, emoji: f.emoji })) })};\n`);

  const N = naive.metrics, I = immune.metrics;
  const savedTok = N.tokens_spent - I.tokens_spent;
  const pct = N.solved_by_llm ? Math.round((1 - I.solved_by_llm / N.solved_by_llm) * 100) : 0;

  console.log('─'.repeat(56));
  console.log(`朴素蜂群 OFF :  LLM解题=${N.solved_by_llm}  免疫继承=${N.immune_inherited}  失败=${N.failed}  tokens≈${N.tokens_spent}`);
  console.log(`免疫蜂群 ON  :  LLM解题=${I.solved_by_llm}  免疫继承=${I.immune_inherited}  失败=${I.failed}  tokens≈${I.tokens_spent}`);
  console.log('─'.repeat(56));
  console.log(`→ LLM 解题次数:${N.solved_by_llm} → ${I.solved_by_llm}  (省 ${pct}%)`);
  console.log(`→ 群体免疫继承:${I.immune_inherited} 次`);
  console.log(`→ 估算省下 token:≈ ${savedTok}（@1800/次)`);
  console.log(`→ 本地抗体库 capsules:OFF=${naive.status.statistics.total_capsules}  ON=${immune.status.statistics.total_capsules}`);
  const TB = trust.blind.metrics, TV = trust.validated.metrics;
  console.log('\n免疫公信层(伪抗体投毒,各 ' + TB.tasks + ' 任务):');
  console.log(`  盲信蜂群   :  假治愈(被污染)=${TB.false_cures}/${TB.tasks}`);
  console.log(`  验证蜂群   :  拒收伪抗体=${TV.rejected}  真治愈=${TV.genuine}  假治愈=${TV.false_cures}`);

  const VM = variant.metrics;
  console.log('\n变异攻防:');
  console.log(`  野生株解题=${VM.wild_solved}  交叉免疫=${VM.cross_immune}  免疫逃逸→解题=${VM.escape_solved}  加强针免疫=${VM.booster_immune}  (总 LLM 解题=${VM.solves})`);

  const VA = vaccinate;
  console.log('\n疫苗接种(每代 ' + VA.bootstrap.tasks + ' 任务):');
  console.log(`  第一代(学习)    :  LLM解题=${VA.bootstrap.solved_by_llm}`);
  console.log(`  第二代·已接种    :  LLM解题=${VA.vaccinated.solved_by_llm}  生来免疫=${VA.vaccinated.immune_inherited}`);
  console.log(`  第二代·未接种对照:  LLM解题=${VA.control.solved_by_llm}`);

  console.log('\n规模化战报:');
  console.log(`  ${scale.total} 任务 · ${scale.nodes} 节点 · ${scale.families} 病原家族`);
  console.log(`  免疫前 ${scale.naive_solves} 次解 → 免疫后 ${scale.immune_solves} 次  (省 ${scale.saved_pct}%, ≈${scale.saved_tokens.toLocaleString()} tokens)`);

  console.log('\n协同进化(模型固定,库随波增长):');
  console.log('  ' + coevolution.series.map((s) => `w${s.wave}:命中${s.hitRate}%/${s.tokensPerTask}tok`).join('  '));

  console.log(`\n[OK] 数据已写入 cockpit/data/data.js(含 trust + variant + vaccinate + scale + coevolution)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
