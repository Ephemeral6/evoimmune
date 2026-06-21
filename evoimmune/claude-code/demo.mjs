// 可独立运行的演示(不依赖真 Claude Code,也不必启 MCP):直接调 immunity.mjs。
// 剧情:两个 agent 先后踩「同一类」真实报错(只是变量名不同),验证:
//   Agent-1 → recall 未命中(库空)→ 自己解题(烧成本)→ 沉淀抗体;
//   Agent-2 → recall 命中(签名归一化让两个变体撞同一指纹)→ 注入修复 → 零成本痊愈。
// 跑法:node claude-code/demo.mjs   必须 exit 0。
import { rmSync } from 'node:fs';
import { openImmuneGep, recallImmunity, sedimentAntibody, IMMUNE_DIR } from './immunity.mjs';

// 干净起步:清掉上一次的免疫库,保证「库空 → 命中」的对照可复现。
rmSync(IMMUNE_DIR, { recursive: true, force: true });

// Agent-1 踩的真错(注意接收者叫 cart)。
const ERROR_A1 = `TypeError: cart.append is not a function
    at checkout (/srv/shop/order.js:42:10)
    at processQueue (/srv/shop/order.js:88:5)`;

// Agent-2 踩的「同类」真错(接收者换成 basket、行号也不同)——签名归一化后应撞同一指纹。
const ERROR_A2 = `TypeError: basket.append is not a function
    at addItem (/srv/web/handlers.js:17:8)`;

// Agent-1 自己解出来的修复(JS 数组没有 append,要用 push)。
const FIX = `把 Array 上的 .append(...) 改成 .push(...):
  - cart.append(item)
  + cart.push(item)
(JS 数组无 append 方法,append 是 Python list 的 API)`;
const HINT = `Array 没有 append 方法,用 push(这是 Python/JS 串味的经典坑)`;

const line = () => console.log('─'.repeat(64));

async function main() {
  console.log('\n🧬 EvoImmune × Claude Code · 经验免疫接入真实 harness(PoC 演示)');
  console.log('   两个独立 agent 共享同一份本地免疫库(零 key、零网络)\n');

  const gep = await openImmuneGep('demo');

  // ── Agent-1:库空,无免疫,被迫自己解题 ───────────────────────────────
  line();
  console.log('🤖 Agent-1 执行命令,踩坑:');
  console.log('   ' + ERROR_A1.split('\n')[0]);
  const r1 = await recallImmunity({ error: ERROR_A1, gep });
  if (r1.hit) {
    console.log('   ⚠️ 预期未命中却命中了,演示前置状态不干净。');
  } else {
    console.log(`   🔍 召回免疫:未命中(指纹 ${r1.key} 是新抗原,库里没有)`);
  }
  console.log('   🔥 没有免疫 → Agent-1 只能自己「解题」:调模型 / 反复试错,烧掉成本…');
  console.log('   ✅ Agent-1 解出来了,把「错误指纹 → 修复」沉淀成抗体写回免疫库:');
  await sedimentAntibody({ error: ERROR_A1, fix: FIX, hint: HINT, gep });
  console.log(`   💉 抗体已入库(geneId 族系聚合,signals=${r1.signals.join(' | ')})`);

  // ── Agent-2:踩同类错(换变量名),命中免疫,零成本痊愈 ────────────────
  line();
  console.log('🤖 Agent-2(另一个 agent,毫不知情)执行命令,踩了「同一类」坑:');
  console.log('   ' + ERROR_A2.split('\n')[0] + '   ← 注意:变量名 basket≠cart、行号也不同');
  const r2 = await recallImmunity({ error: ERROR_A2, gep });
  if (!r2.hit) {
    console.error('   ❌ 召回未命中——签名归一化失败,演示判定不通过。');
    await gep.close();
    process.exit(1);
  }
  console.log(`   🔍 召回免疫:命中!(签名归一化让 basket/cart 两个变体撞同一指纹)`);
  console.log(`        相似度 ${r2.similarity.toFixed(2)} · 置信度 ${r2.confidence.toFixed(2)} · 综合分 ${r2.score.toFixed(2)}`);
  console.log('   💉 注入的免疫修复(Agent-2 直接套用,跳过全部试错):');
  console.log('      经验提示:' + r2.hint);
  r2.fix.split('\n').forEach((l) => console.log('      ' + l));
  console.log('   ⚡ Agent-2 零成本痊愈,没调一次模型、没试错一轮。');

  // ── 对照收尾 ─────────────────────────────────────────────────────
  line();
  const st = await gep.status();
  console.log('🏁 对照:');
  console.log('   · Agent-1 烧了「解题」(模型 + 试错)才换来这次修复 → 成本付一次。');
  console.log('   · Agent-2 命中免疫,零成本继承 → 成本省下来。第 N 个 agent 同样免疫。');
  console.log('   · 这正是「经验免疫」:踩过的坑,全群只付一次费。');
  if (st && typeof st === 'object') {
    console.log('   · 免疫库状态:' + JSON.stringify(st).slice(0, 160));
  }
  line();
  console.log('✅ demo 完成:recall 命中已真实发生(非合成)。\n');

  await gep.close();
  process.exit(0);
}

main().catch((e) => { console.error('demo 失败:', e); process.exit(1); });
