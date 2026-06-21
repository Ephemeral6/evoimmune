// EvoImmune × Claude Code · 蜂群协作 runner —— 复杂 Web API 项目上的「经验免疫」对照。
//
// 立的 claim:不是 5 个 agent 修同一个一行 bug,而是【4 个 subagent 各做不同 handler、
// 共享一个不断生长的项目知识池】。项目里焊了 4 条非显而易见的「项目约定」(G1~G4),
// 违反每条产生各异的真实测试报错;一个新 agent 不可能凭空知道,只能 debug 多步发现。
//
// 约定 × handler 矩阵(见 project/CONVENTIONS.md):
//   createOrder = G2 + G1 + G3
//   getOrder    = G2 + G1 + G4
//   listOrders  = G2 + G1 + G4
//   refundOrder = G2 + G1 + G3
// G2(codegen 前置闸门)、G1(asyncHandler 全局闸门)4 个 handler 都要;G3/G4 按业务分流。
//
// 跑两轮对照(都用 os.tmpdir() 下的隔离临时免疫库 + 真实 gep 召回/沉淀,跑完清理,不污染共享库):
//   A. 朴素蜂群(无共享):每个 subagent 各自独立踩它 handler 需要的每一条约定 →
//      每条都算一次「经验发现(解题)」。总发现 = 3+3+3+3 = 12。
//   B. 免疫蜂群(共享):按 createOrder→getOrder→listOrders→refundOrder 顺序,每个 handler
//      需要的每条约定先 recallImmunity 查 —— 命中=继承(零成本)、未命中=发现(解题一次)+沉淀。
//      预期:createOrder 发现 3;getOrder 继承 2+发现 1;listOrders 继承 3;refundOrder 继承 3。
//      → 总发现 = 4(去重后的约定数),继承 = 8。
//
// 真实性锚点(必须真跑,不靠模拟):
//   1) 无 codegen 时 `HANDLERS_DIR=gold node test/run-tests.cjs` → 4 个全 FAIL(G2 真报错);
//      `node build/codegen.cjs` 后再跑 → 4 个全 PASS。两步真实结果都打进输出。
//   2) 免疫轮的 recall 命中是真实 gep 召回(打印 sim/conf/score),不是写死的。
//
// 复用 immunity.mjs 的 recallImmunity/sedimentAntibody 与 gepClient.js 的 connectGep,
// 风格对齐 claude-code/scenario/scenario.mjs。
// 跑法:node claude-code/colony/run.mjs   必须 exit 0、可重复。
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, existsSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { connectGep } from '../../src/gepClient.js';
import { recallImmunity, sedimentAntibody } from '../immunity.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, 'project');
const GENERATED = resolve(PROJECT, 'generated'); // codegen 产物(gitignored),G2 闸门

// ── 4 条项目约定(真相档 CONVENTIONS.md 的「报错签名速查」)─────────────────────
// 每条带:稳定短语(免疫召回键)、真实报错文本模板(带括号细节,逐 handler 可变,
// 用来证明「同一约定不同 handler 报错细节不同也命中同一抗体」)、解出后沉淀的 fix/hint。
const CONVENTIONS = {
  G2: {
    id: 'G2',
    name: 'codegen 前置闸门',
    desc: '跑测试前必须先 node build/codegen.cjs 生成 generated/validators.cjs',
    // 真实报错(逐 handler 的 require stack 不同 → 括号/细节不同,签名归一化后同一族)。
    errorFor: (h) =>
      `Error: Cannot find module '../generated/validators.cjs'\n` +
      `Require stack:\n- project/${h}/validators (resolved from handlers/${h}.cjs)`,
    fix:
      '实现前先跑构建步骤生成校验器:\n' +
      '  node build/codegen.cjs            // 写出 generated/validators.cjs\n' +
      "handler 里:const { validateOrder } = require('../generated/validators.cjs')",
    hint: 'G2:先跑 node build/codegen.cjs,否则 require 链解析失败(Cannot find module generated/validators)',
  },
  G1: {
    id: 'G1',
    name: 'asyncHandler 全局闸门',
    desc: 'handler 必须先 asyncHandler(...) 包裹再 registerRoute(...)',
    errorFor: (h) =>
      `Error: handler must be wrapped with asyncHandler (route registered by ${h})`,
    fix:
      '把裸 async function 用 asyncHandler 包过再注册:\n' +
      '  const handler = asyncHandler(async (ctx) => { /* ... */ return { status: "ok", data }; });\n' +
      "  registerRoute(method, path, handler);   // registerRoute 校验 WRAPPED 标记",
    hint: 'G1:handler 必须 asyncHandler 包裹后再 registerRoute,否则注册时当场抛 handler must be wrapped',
  },
  G3: {
    id: 'G3',
    name: '金额整数分',
    desc: '金额全程以整数分存储流转,绝不存浮点元',
    errorFor: (h) =>
      h === 'refundOrder'
        ? 'Error: amount must be integer cents (refunded is not an integer)'
        : 'Error: amount must be integer cents (stored amount is not an integer)',
    fix:
      '金额入库前一律转整数分(12.34 元 → 1234 分):\n' +
      '  const { toCents, assertCents } = require("../src/money.cjs");\n' +
      '  const amount = assertCents(toCents(input.amountYuan));',
    hint: 'G3:金额走 toCents/assertCents 存整数分,别存浮点元(否则 amount must be integer cents)',
  },
  G4: {
    id: 'G4',
    name: 'ISO-8601 日期',
    desc: '对外/入库日期一律走 toISO(),输出 ISO-8601 UTC(带 Z)',
    errorFor: (h) =>
      h === 'listOrders'
        ? 'Error: date must be ISO-8601 (createdAt[0]="Sun Jun 21 2026 16:00:00 GMT+0800 (CST)")'
        : 'Error: date must be ISO-8601 (createdAt="Sun Jun 21 2026 16:00:00 GMT+0800 (China Standard Time)")',
    fix:
      '日期写入/对外一律走 dates.cjs 的 toISO/assertISO,产出带 Z 的 ISO 串:\n' +
      '  const { toISO, assertISO } = require("../src/dates.cjs");\n' +
      '  createdAt: assertISO(toISO(rec.createdAt));',
    hint: 'G4:日期走 toISO()/assertISO() 输出带 Z 的 ISO-8601,别用裸 new Date()(否则 date must be ISO-8601)',
  },
};

// 约定 × handler 矩阵(每个 subagent 领一个 handler,需要踩通这几条约定)。
const HANDLERS = [
  { id: 'createOrder', desc: 'POST /orders 创建订单', needs: ['G2', 'G1', 'G3'] },
  { id: 'getOrder', desc: 'GET /orders/:id 取单个订单', needs: ['G2', 'G1', 'G4'] },
  { id: 'listOrders', desc: 'GET /orders 列出订单', needs: ['G2', 'G1', 'G4'] },
  { id: 'refundOrder', desc: 'POST /orders/:id/refund 退款', needs: ['G2', 'G1', 'G3'] },
];

const line = (ch = '─') => console.log(ch.repeat(76));
const head = (t) => { console.log('\n' + '═'.repeat(76)); console.log(t); console.log('═'.repeat(76)); };

// ── 真实验证锚点 ──────────────────────────────────────────────────────────────
// 跑 project 自带测试总入口(HANDLERS_DIR=gold,真实 spawn,真实 exit code)。
function runGoldTests() {
  const r = spawnSync(process.execPath, ['test/run-tests.cjs'], {
    cwd: PROJECT,
    encoding: 'utf8',
    env: { ...process.env, HANDLERS_DIR: 'gold' },
    timeout: 60000,
  });
  const out = (r.stdout || '') + (r.stderr || '');
  // 抽 SUMMARY 段落(PASS/FAIL 各行 + ALL PASS/SOME FAILED),省掉长 stack。
  const summary = out
    .split('\n')
    .filter((l) => /^(PASS|FAIL)\s|ALL PASS|SOME FAILED|=====/.test(l))
    .join('\n');
  return { exit: r.status, summary };
}

// 真实验证:无 codegen → 全 FAIL(G2);codegen 后 → 全 PASS。打印真实结果。
function realityCheck() {
  head('🔬 真实验证锚点 —— 约定不是装饰,是真焊进测试的(真跑 project/test)');

  // 备份现有 generated(若存在),删掉以复现「未跑 codegen」初始态。
  let backup = null;
  if (existsSync(GENERATED)) {
    backup = mkdtempSync(resolve(tmpdir(), 'gen-backup-'));
    cpSync(GENERATED, resolve(backup, 'generated'), { recursive: true });
    rmSync(GENERATED, { recursive: true, force: true });
  }

  let before;
  let after;
  try {
    // ① 不跑 codegen:gold 实现也应 4 个全 FAIL(撞 G2 前置闸门)。
    console.log('\n① 不跑 codegen 直接 `HANDLERS_DIR=gold node test/run-tests.cjs`(G2 闸门):');
    before = runGoldTests();
    before.summary.split('\n').forEach((l) => console.log('   ' + l));
    console.log(`   → exit ${before.exit}(期望 1:G2「Cannot find module generated/validators」全挂)`);

    // ② 跑 codegen 后再跑:gold 实现 4 个全 PASS。
    console.log('\n② `node build/codegen.cjs` 后再跑同样命令:');
    const gen = spawnSync(process.execPath, ['build/codegen.cjs'], { cwd: PROJECT, encoding: 'utf8' });
    console.log('   ' + (gen.stdout || '').trim());
    after = runGoldTests();
    after.summary.split('\n').forEach((l) => console.log('   ' + l));
    console.log(`   → exit ${after.exit}(期望 0:遵守全部约定 → ALL PASS)`);
  } finally {
    // 还原 generated 到进来时的状态:有备份就还原备份,没备份(进来时本就没有)则删掉本次生成的。
    if (backup) {
      rmSync(GENERATED, { recursive: true, force: true });
      cpSync(resolve(backup, 'generated'), GENERATED, { recursive: true });
      rmSync(backup, { recursive: true, force: true });
    }
  }

  const ok = before.exit === 1 && after.exit === 0;
  console.log(
    '\n   结论:' +
      (ok
        ? '约定为真 —— 不跑 codegen 全挂(G2 真报错)、跑了 codegen + 守约定全过。'
        : '⚠️ 真实验证不符预期!'),
  );
  return { ok, before, after };
}

// ── A. 朴素蜂群(无共享)── 每个 subagent 各自独立踩它需要的每条约定,各算一次发现 ───
function runNaive() {
  head('A. 朴素蜂群(无共享知识池)—— 4 个 subagent 各做一个 handler,互不通气');
  console.log('   每个 subagent 不知道别人也在同一项目里踩同样的约定 → 各自把需要的每条都重新发现一遍。\n');
  let discoveries = 0;
  const rows = [];
  for (let i = 0; i < HANDLERS.length; i++) {
    const h = HANDLERS[i];
    console.log(`🤖 subagent-${i + 1}  负责 ${h.id}() —— ${h.desc}`);
    const found = [];
    for (const cid of h.needs) {
      const c = CONVENTIONS[cid];
      discoveries++;
      found.push(cid);
      const firstLine = c.errorFor(h.id).split('\n')[0];
      console.log(`   🔥 踩约定 ${cid}(${c.name})→ 真实报错「${firstLine}」→ 自己 debug 解题(烧一次成本)`);
    }
    console.log(`   ▸ 本 handler 共发现 ${found.length} 条约定:${found.join(' + ')}(无人可继承)\n`);
    rows.push({ id: h.id, discovered: found, inherited: [] });
  }
  console.log(`小结:4 个 subagent 各踩各的 → 累计发现(解题)= 3+3+3+3 = ${discoveries} 次,继承 0 次。`);
  return { discoveries, inherits: 0, rows };
}

// ── B. 免疫蜂群(共享)── 共享一个不断生长的抗体库,越往后越省 ────────────────────
async function runImmune(gep) {
  head('B. 免疫蜂群(共享生长的项目知识池)—— 同样 4 个 subagent,接入经验免疫库');
  console.log('   顺序:createOrder → getOrder → listOrders → refundOrder。每条约定先 recall 查库:');
  console.log('   命中=继承(零成本,直接套用前人沉淀的修复);未命中=发现(解题一次)+沉淀抗体回库。\n');
  let discoveries = 0;
  let inherits = 0;
  const rows = [];
  for (let i = 0; i < HANDLERS.length; i++) {
    const h = HANDLERS[i];
    console.log(`🤖 subagent-${i + 1}  负责 ${h.id}() —— ${h.desc}`);
    const discovered = [];
    const inherited = [];
    for (const cid of h.needs) {
      const c = CONVENTIONS[cid];
      // 用「该 handler 上这条约定的真实报错文本」(带括号细节)去召回。
      const errText = c.errorFor(h.id);
      const recall = await recallImmunity({ error: errText, gep });
      if (recall.hit) {
        // 命中 → 继承(零成本)。打印真实 gep 召回的相似度/置信/综合分。
        inherits++;
        inherited.push(cid);
        console.log(
          `   ✅ ${cid}(${c.name})：召回命中 → 继承(零成本)` +
            ` · 相似 ${recall.similarity.toFixed(2)} · 置信 ${recall.confidence.toFixed(2)} · 综合 ${recall.score.toFixed(2)}`,
        );
        console.log(`        💉 直接套用前人抗体:${recall.hint}`);
      } else {
        // 未命中 → 发现(解题一次)+ 沉淀,供后续 subagent 继承。
        discoveries++;
        discovered.push(cid);
        const firstLine = errText.split('\n')[0];
        console.log(`   🔥 ${cid}(${c.name})：召回未命中(新约定)→ debug 解题「${firstLine}」`);
        await sedimentAntibody({ error: errText, fix: c.fix, hint: c.hint, gep });
        console.log(`        🧬 把「报错指纹 → 修复」沉淀成抗体写回共享库 → 后面的 subagent 生来免疫`);
      }
    }
    const dTxt = discovered.length ? `发现 ${discovered.join('+')}` : '发现 0';
    const iTxt = inherited.length ? `继承 ${inherited.join('+')}` : '继承 0';
    console.log(`   ▸ 本 handler:${dTxt} · ${iTxt}(知识池越用越大,越往后越省)\n`);
    rows.push({ id: h.id, discovered, inherited });
  }
  console.log(
    `小结:去重后全项目只有 4 条约定 → 共发现(解题)${discoveries} 次、继承(零成本)${inherits} 次。`,
  );
  return { discoveries, inherits, rows };
}

async function main() {
  console.log('\n🧬 EvoImmune × Claude Code · 蜂群协作:4 个 subagent 各做一个 handler,共享生长的项目知识池');
  console.log('   题面:project/ 是个真实 Orders Web API,焊了 4 条非显而易见的项目约定(G1~G4)。');
  console.log('   违反每条 → 各异的真实测试报错;新 agent 只能 debug 多步发现。共享免疫 → 第一个发现,全群继承。');

  // 真实验证锚点(真跑 project/test,真实 exit code)。
  const reality = realityCheck();

  // 隔离临时免疫库(connectGep at os.tmpdir()),跑完整体清理,绝不污染共享库 .immunedata/。
  const tmpRoot = mkdtempSync(resolve(tmpdir(), 'evoimmune-colony-'));
  const gep = await connectGep({
    assetsDir: resolve(tmpRoot, 'assets'),
    memoryDir: resolve(tmpRoot, 'memory'),
    label: 'evoimmune-colony',
  });

  let naive;
  let immune;
  try {
    // 朴素轮纯靠矩阵计数,不碰免疫库(保持纯净对照)。
    naive = runNaive();
    // 免疫轮用同一个隔离临时库:起点为空 → 逐 handler recall/sediment,真实 gep 往返。
    immune = await runImmune(gep);
  } finally {
    await gep.close();
    rmSync(tmpRoot, { recursive: true, force: true });
  }

  // ── 对照表 ────────────────────────────────────────────────────────────────
  // 终端等宽里 CJK/全角占 2 列、ASCII 占 1 列;按显示宽度补空格,表格才对齐。
  head('📊 对照:朴素蜂群 vs 免疫蜂群(4 个不同 handler、4 条项目约定、矩阵 12 个约定点)');
  const saved = naive.discoveries - immune.discoveries;
  const dispW = (s) => [...String(s)].reduce((w, ch) => w + (/[ᄀ-￿]/.test(ch) ? 2 : 1), 0);
  const padW = (s, n) => String(s) + ' '.repeat(Math.max(0, n - dispW(s)));
  const W = [22, 12, 12, 24];
  const bar = (l, m, r) => l + W.map((w) => '─'.repeat(w + 2)).join(m) + r;
  const row = (cells) => '│ ' + cells.map((c, i) => padW(c, W[i])).join(' │ ') + ' │';
  console.log(bar('┌', '┬', '┐'));
  console.log(row(['指标', '朴素(无共享)', '免疫(共享)', '说明']));
  console.log(bar('├', '┼', '┤'));
  console.log(row(['总发现(解题/烧成本)', naive.discoveries, immune.discoveries, '免疫=去重后约定数']));
  console.log(row(['总继承(零成本)', naive.inherits, immune.inherits, '召回命中直接套用']));
  console.log(row(['省下的发现', '—', saved, `12 → 4,省 ${saved} 次`]));
  console.log(bar('└', '┴', '┘'));

  // 逐 subagent「发现/继承」明细(体现越往后越省 = 协作)。
  console.log('\n逐 subagent 明细(免疫轮 · 体现知识池越用越省):');
  console.log('  ' + padW('subagent', 26) + padW('发现(解题)', 20) + '继承(零成本)');
  for (let i = 0; i < immune.rows.length; i++) {
    const r = immune.rows[i];
    const d = r.discovered.length ? r.discovered.join('+') : '—';
    const inh = r.inherited.length ? r.inherited.join('+') : '—';
    console.log('  ' + padW(`subagent-${i + 1} · ${r.id}`, 26) + padW(d, 20) + inh);
  }

  line('═');
  console.log('🏁 结论:同样 4 个 subagent、4 个不同 handler、同一套项目约定 ——');
  console.log(`   · 朴素蜂群:各踩各的 → 把矩阵里 12 个约定点全部重新发现一遍(${naive.discoveries} 次解题)。`);
  console.log(`   · 免疫蜂群:第一个发现某约定就沉淀回共享库,后续 handler 命中即继承 → 只解 ${immune.discoveries} 次、省 ${saved} 次。`);
  console.log('   · createOrder 发现 G2/G1/G3 → getOrder 继承 G2/G1、只新发现 G4 → listOrders/refundOrder 全继承。');
  console.log('   · 这就是「项目特有经验(约定)」的协作沉淀:越往后越省,知识池越用越大。');
  line('═');

  // ── 诚实声明 ──────────────────────────────────────────────────────────────
  head('🪪 诚实声明(哪些是真的、哪些是对开发过程的建模)');
  console.log('  真的(可复现、真跑):');
  console.log('   · gep 召回/沉淀是真实 EvoMap gep-mcp-server 本地往返(recallImmunity/sedimentAntibody),');
  console.log('     免疫轮每次「命中」的相似度/置信/综合分都来自真实 recall,非写死。');
  console.log('   · 4 条约定是真焊进 project/ 的:无 codegen → gold 实现真挂(G2 真报错 exit 1)、');
  console.log('     codegen 后 → gold 实现真过(ALL PASS exit 0),上面真实验证块是真跑 project/test 的结果。');
  console.log('   · 召回键用的是 CONVENTIONS.md 的真实报错签名;同一约定在不同 handler 上报错细节不同,');
  console.log('     经 immunity.mjs 的经验级归一化命中同一抗体(跨 handler 继承为真)。');
  console.log('  对开发过程的建模(非逐字回放某次真实 agent 会话):');
  console.log('   · 「逐约定的发现顺序」「subagent 各领一个 handler」是按约定矩阵的确定性编排,');
  console.log('     用以隔离变量、做可复现对照;真实 Claude Code 跑(见 README 的 live 提示词)发现顺序可能不同,');
  console.log('     但「第一个发现、其余继承」的免疫机制与这里完全一致(同一套 immunity.mjs)。');

  // ── 硬性判定 ──────────────────────────────────────────────────────────────
  const ok =
    reality.ok &&
    naive.discoveries === 12 && naive.inherits === 0 &&
    immune.discoveries === 4 && immune.inherits === 8 &&
    immune.rows[0].discovered.join('+') === 'G2+G1+G3' &&
    immune.rows[1].inherited.join('+') === 'G2+G1' && immune.rows[1].discovered.join('+') === 'G4' &&
    immune.rows[2].inherited.join('+') === 'G2+G1+G4' && immune.rows[2].discovered.length === 0 &&
    immune.rows[3].inherited.join('+') === 'G2+G1+G3' && immune.rows[3].discovered.length === 0;
  if (!ok) {
    console.error('\n❌ 判定不通过:对照数据 / 真实验证 / 发现继承顺序不符合预期。');
    process.exit(1);
  }
  console.log('\n✅ runner 验证通过:朴素总发现 12;免疫总发现 4 + 继承 8;真实验证(无 codegen 全挂 / 有 codegen 全过)真跑真符。\n');
  process.exit(0);
}

main().catch((e) => { console.error('colony runner 失败:', e); process.exit(1); });
