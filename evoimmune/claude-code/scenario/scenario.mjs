// 真实开发场景 demo:用 Claude Code 派 5 个 subagent 给数据看板加 5 个排行榜/指标函数,
// 每个都要对数字数组排序。经典坑:Array.prototype.sort() 默认按字典序,[1,10,2].sort() 得
// [1,10,2];数字排序必须传比较器 (a,b)=>a-b。project/ 下 5 个模块都内置了这个 bug。
//
// 本驱动器跑两轮对照,验证「经验免疫」的价值:
//   A. 朴素蜂群(免疫 OFF):5 个 subagent 各自独立踩同一类 .sort() 测试失败 → 各自解题 →
//      各自修好。总成本 = 5 次解题。
//   B. 免疫蜂群(免疫 ON):subagent-1 踩坑 → 解题 → sedimentAntibody 沉淀抗体;
//      subagent-2~5 踩同类失败 → recallImmunity 命中 → 直接套用修复、跳过试错。
//      总成本 = 1 次解题 + 4 次零成本继承。
//
// 每个模块都用「真实 validator」:把代码落盘到临时工作区 + 跑它在 project/ 里的真实
// *.test.cjs,buggy 真挂、fixed 真过(node <test> exit 0=过),不是纯打印。
// 免疫库用 os.tmpdir() 下的隔离临时 gep(每次干净对照、跑完清理),不污染共享库
// claude-code/.immunedata/。复用 immunity.mjs 的 recallImmunity/sedimentAntibody 与
// gepClient.js 的 connectGep,风格对齐 src/ 与 claude-code/。
// 跑法:node claude-code/scenario/scenario.mjs   必须 exit 0。
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, mkdtempSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { connectGep } from '../../src/gepClient.js';
import { recallImmunity, sedimentAntibody } from '../immunity.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT = resolve(HERE, 'project');

// ── 5 个待实现/有 bug 的看板模块 ───────────────────────────────────────────
// 每个给:模块文件名、导出函数名、buggy 源(从 project/ 读真实落盘)、fixed 源(传比较器的正解)、
// 以及「解题产物」fix/hint —— subagent-1 解出后沉淀,subagent-2~5 召回后直接套用。
const MODULES = [
  {
    id: 'topN',
    desc: '取分数最高的前 N 名(Top-N 排行,数字降序)',
    fixed:
      'function topN(scores, n) {\n' +
      '  const sorted = scores.slice().sort((a, b) => b - a);\n' +
      '  return sorted.slice(0, n);\n' +
      '}\n' +
      'module.exports = { topN };\n',
  },
  {
    id: 'rankByScore',
    desc: '把分数从小到大排成榜(升序排行)',
    fixed:
      'function rankByScore(scores) {\n' +
      '  return scores.slice().sort((a, b) => a - b);\n' +
      '}\n' +
      'module.exports = { rankByScore };\n',
  },
  {
    id: 'sortPrices',
    desc: '把价格从低到高排序(价格升序)',
    fixed:
      'function sortPrices(prices) {\n' +
      '  return prices.slice().sort((a, b) => a - b);\n' +
      '}\n' +
      'module.exports = { sortPrices };\n',
  },
  {
    id: 'leaderboard',
    desc: '玩家积分排行榜,按积分从高到低(降序排行)',
    fixed:
      'function leaderboard(points) {\n' +
      '  return points.slice().sort((a, b) => b - a);\n' +
      '}\n' +
      'module.exports = { leaderboard };\n',
  },
  {
    id: 'percentile',
    desc: '取一组数值的 p 分位数(先按数字升序排,再按比例取下标)',
    fixed:
      'function percentile(values, p) {\n' +
      '  const sorted = values.slice().sort((a, b) => a - b);\n' +
      '  const idx = Math.ceil((p / 100) * sorted.length) - 1;\n' +
      '  return sorted[Math.max(0, idx)];\n' +
      '}\n' +
      'module.exports = { percentile };\n',
  },
];

// subagent-1 解出来的修复(数字排序要传比较器),沉淀成抗体供后续 subagent 召回。
const FIX = [
  'Array.prototype.sort() 默认把元素转成字符串、按字典序比较 —— 排数字必须传比较器:',
  '  - arr.sort()              // 字典序:[1,10,2].sort() === [1,10,2]',
  '  + arr.sort((a, b) => a - b)   // 升序;降序用 (a, b) => b - a',
  '把每个看板函数里裸 .sort() 改成带数字比较器的 .sort((a,b)=>a-b)(降序 b-a)即可。',
].join('\n');
const HINT = 'Array.sort 默认字典序,数字排序要传比较器 (a,b)=>a-b(降序 b-a)';

// ── 真实 validator ─────────────────────────────────────────────────────────
// 把一份模块源落盘到临时工作区,连同 project/ 里的真实 *.test.cjs 一起,真用 node 跑测试。
// 返回 { ok, stderr };exit 0 即测试通过。绝不靠打印假装 —— 真跑真判。
function runTest(workDir, mod, source) {
  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });
  // 落盘被测模块源
  writeFileSync(resolve(workDir, `${mod.id}.cjs`), source);
  // 拷贝该模块在 project/ 里的真实测试(test 用真实数据断言正确数字序)
  copyFileSync(resolve(PROJECT, `${mod.id}.test.cjs`), resolve(workDir, `${mod.id}.test.cjs`));
  const r = spawnSync('node', [`${mod.id}.test.cjs`], { cwd: workDir, encoding: 'utf8', timeout: 60000 });
  return { ok: r.status === 0, stderr: ((r.stderr || '') + (r.error ? ` ${r.error.message}` : '')).trim() };
}

// 读 project/ 里真实落盘的 buggy 源(裸 .sort()),保证 demo 用的就是仓库里那份带坑代码。
function readBuggy(mod) {
  const r = spawnSync('cat', [resolve(PROJECT, `${mod.id}.cjs`)], { encoding: 'utf8' });
  return r.stdout;
}

const line = (ch = '─') => console.log(ch.repeat(72));
const head = (t) => { console.log('\n' + '═'.repeat(72)); console.log(t); console.log('═'.repeat(72)); };

// ── 朴素蜂群(免疫 OFF):5 个 subagent 各自独立踩坑、各自解题 ────────────────
function runNaive(work) {
  head('A. 朴素蜂群(免疫 OFF)—— 5 个 subagent 各领一个函数,互不通气');
  let solves = 0;
  const rows = [];
  for (let i = 0; i < MODULES.length; i++) {
    const mod = MODULES[i];
    const buggy = readBuggy(mod);
    const wd = resolve(work, `naive-${mod.id}`);

    // 1) subagent 先交了 buggy 版(裸 .sort())→ 真跑测试,真挂
    const vBuggy = runTest(wd, mod, buggy);
    const firstErrLine = vBuggy.stderr.split('\n')[0];
    console.log(`\n🤖 subagent-${i + 1}  负责 ${mod.id}() —— ${mod.desc}`);
    console.log(`   ▸ 交了初版(裸 .sort())→ node ${mod.id}.test.cjs → ${vBuggy.ok ? '过' : '挂'}:${firstErrLine}`);
    if (vBuggy.ok) throw new Error(`[${mod.id}] buggy 版竟通过,坑没埋好`);

    // 2) 没有免疫 → 只能自己解题(调模型/反复试错,烧成本)
    solves++;
    console.log('   🔥 没免疫 → 自己解题:翻文档 / 反复试错,才悟到「sort 要传数字比较器」(烧掉一次成本)');

    // 3) 套用自己解出的修复 → 真跑测试,真过
    const vFixed = runTest(wd, mod, mod.fixed);
    console.log(`   ✅ 改成 .sort((a,b)=>a-b) → node ${mod.id}.test.cjs → ${vFixed.ok ? '过 (exit 0)' : '仍挂'}`);
    if (!vFixed.ok) throw new Error(`[${mod.id}] fixed 版没通过:${vFixed.stderr}`);

    rows.push({ id: mod.id, mode: '解题', buggy: vBuggy.ok, fixed: vFixed.ok });
    rmSync(wd, { recursive: true, force: true });
  }
  console.log(`\n小结:5 个 subagent 谁都不知道别人也在踩同一个坑 → 各解一次 → 共 ${solves} 次解题。`);
  return { solves, inherits: 0, rows };
}

// ── 免疫蜂群(免疫 ON):1 个解题沉淀抗体,其余召回命中、零成本继承 ─────────────
async function runImmune(work, gep) {
  head('B. 免疫蜂群(免疫 ON)—— 同样 5 个 subagent,接入经验免疫库');
  let solves = 0;
  let inherits = 0;
  const rows = [];
  for (let i = 0; i < MODULES.length; i++) {
    const mod = MODULES[i];
    const buggy = readBuggy(mod);
    const wd = resolve(work, `immune-${mod.id}`);

    // 1) subagent 先交了 buggy 版 → 真跑测试,真挂(抗原出现)
    const vBuggy = runTest(wd, mod, buggy);
    const errText = vBuggy.stderr;
    const firstErrLine = errText.split('\n')[0];
    console.log(`\n🤖 subagent-${i + 1}  负责 ${mod.id}() —— ${mod.desc}`);
    console.log(`   ▸ 交了初版(裸 .sort())→ node ${mod.id}.test.cjs → ${vBuggy.ok ? '过' : '挂'}:${firstErrLine}`);
    if (vBuggy.ok) throw new Error(`[${mod.id}] buggy 版竟通过,坑没埋好`);

    // 2) 失败即先召回免疫:库里有没有同类错误的抗体?
    const recall = await recallImmunity({ error: errText, gep });

    if (recall.hit) {
      // 命中 → 直接套用抗体里的修复,跳过全部试错(零成本继承)
      inherits++;
      console.log(`   🔍 召回免疫:命中!(指纹「${recall.signals.join(' | ')}」此前已有 subagent 解过)`);
      console.log(`        相似 ${recall.similarity.toFixed(2)} · 置信 ${recall.confidence.toFixed(2)} · 综合 ${recall.score.toFixed(2)}`);
      console.log(`   💉 直接套用免疫修复(经验提示:${recall.hint})—— 不翻文档、不试错`);
    } else {
      // 未命中(只会发生在第 1 个)→ 自己解题 → 把「指纹 → 修复」沉淀成抗体
      solves++;
      console.log(`   🔍 召回免疫:未命中(指纹「${recall.signals.join(' | ')}」是新抗原,库里没有)`);
      console.log('   🔥 没现成免疫 → 自己解题(烧一次成本),悟到「sort 要传数字比较器」');
      await sedimentAntibody({ error: errText, fix: FIX, hint: HINT, gep });
      console.log('   💉 把「错误指纹 → 修复」沉淀成抗体写回免疫库 → 后面的 subagent 生来免疫');
    }

    // 3) 套用修复 → 真跑测试,真过(无论解题还是继承,落地都要真过测试)
    const vFixed = runTest(wd, mod, mod.fixed);
    console.log(`   ✅ 改成带比较器的 .sort() → node ${mod.id}.test.cjs → ${vFixed.ok ? '过 (exit 0)' : '仍挂'}`);
    if (!vFixed.ok) throw new Error(`[${mod.id}] fixed 版没通过:${vFixed.stderr}`);

    rows.push({ id: mod.id, mode: recall.hit ? '继承' : '解题', buggy: vBuggy.ok, fixed: vFixed.ok });
    rmSync(wd, { recursive: true, force: true });
  }
  console.log(`\n小结:第 1 个 subagent 解题 + 沉淀抗体 → 后 4 个全部召回命中、零成本继承 → 共 ${solves} 次解题、${inherits} 次继承。`);
  return { solves, inherits, rows };
}

async function main() {
  console.log('\n🧬 EvoImmune × Claude Code · 真实开发场景:5 个 subagent 给数据看板加排行榜/指标函数');
  console.log('   坑:Array.sort() 默认字典序,[1,10,2].sort() 得 [1,10,2] —— 数字排序必须传比较器。');
  console.log('   每个模块都真跑它的 *.test.cjs:buggy 真挂、fixed 真过(不是打印,是真判)。');

  // 隔离临时工作区(落盘被测代码)+ 隔离临时免疫库(connectGep),跑完整体清理,绝不污染共享库。
  const tmpRoot = mkdtempSync(resolve(tmpdir(), 'evoimmune-scenario-'));
  const work = resolve(tmpRoot, 'work');
  mkdirSync(work, { recursive: true });
  const gep = await connectGep({
    assetsDir: resolve(tmpRoot, 'assets'),
    memoryDir: resolve(tmpRoot, 'memory'),
    label: 'evoimmune-scenario',
  });

  let naive;
  let immune;
  try {
    // 先跑朴素蜂群(此免疫库全程未被它写入,保持纯净对照)
    naive = runNaive(work);
    // 再跑免疫蜂群(用同一个隔离临时库:起点为空 → 第 1 个沉淀 → 后续命中)
    immune = await runImmune(work, gep);
  } finally {
    await gep.close();
    rmSync(tmpRoot, { recursive: true, force: true });
  }

  // ── 对照表 ────────────────────────────────────────────────────────────────
  // 终端等宽字体里 CJK / 全角字符占 2 列、ASCII 占 1 列;按「显示宽度」补空格,表格才对得齐。
  head('📊 对照:朴素蜂群 vs 免疫蜂群(5 个相同的看板函数,同一个 .sort() 坑)');
  const saved = naive.solves - immune.solves;
  const dispW = (s) => [...String(s)].reduce((w, ch) => w + (/[ᄀ-￿]/.test(ch) ? 2 : 1), 0);
  const padW = (s, n) => String(s) + ' '.repeat(Math.max(0, n - dispW(s)));
  const W = [18, 11, 11, 22];                       // 四列显示宽度
  const bar = (l, m, r) => l + W.map((w) => '─'.repeat(w + 2)).join(m) + r;
  const row = (cells) => '│ ' + cells.map((c, i) => padW(c, W[i])).join(' │ ') + ' │';
  console.log(bar('┌', '┬', '┐'));
  console.log(row(['指标', '朴素(OFF)', '免疫(ON)', '说明']));
  console.log(bar('├', '┼', '┤'));
  console.log(row(['解题次数(烧成本)', naive.solves, immune.solves, '免疫只付第一次']));
  console.log(row(['继承次数(零成本)', naive.inherits, immune.inherits, '召回命中直接套用']));
  console.log(row(['省下的解题', '—', saved, `5 → 1,省 ${saved} 次`]));
  console.log(bar('└', '┴', '┘'));

  // 逐模块真跑结论(buggy 真挂 / fixed 真过)
  console.log('\n逐模块真跑结论(免疫轮):');
  console.log('  ' + padW('模块', 16) + padW('initial(buggy)', 18) + padW('final(fixed)', 16) + '免疫蜂群里的角色');
  for (const r of immune.rows) {
    console.log('  ' + padW(r.id, 16) + padW(r.buggy ? 'PASS' : 'FAIL(真挂)', 18) + padW(r.fixed ? 'PASS(真过)' : 'FAIL', 16) + r.mode);
  }

  line('═');
  console.log('🏁 结论:同样 5 个 subagent、同一个坑 ——');
  console.log('   · 朴素蜂群:5 个各踩各的、各解各的 → 重复试错 5 次。');
  console.log(`   · 免疫蜂群:第 1 个解题并沉淀抗体,后 4 个召回命中、跳过试错 → 只解 1 次、省 ${saved} 次。`);
  console.log('   · 这就是「经验免疫」:第一个 subagent 踩的坑,后面的 subagent 生来免疫。');
  line('═');

  // 硬性判定:必须正好「朴素 5 解题、免疫 1 解题 + 4 继承」,且每个模块 buggy 真挂、fixed 真过。
  const ok =
    naive.solves === 5 && naive.inherits === 0 &&
    immune.solves === 1 && immune.inherits === 4 &&
    naive.rows.every((r) => r.buggy === false && r.fixed === true) &&
    immune.rows.every((r) => r.buggy === false && r.fixed === true);
  if (!ok) {
    console.error('\n❌ 判定不通过:对照数据或真跑结论不符合预期。');
    process.exit(1);
  }
  console.log('\n✅ 场景验证通过:朴素 5 次解题、免疫 1 解题 + 4 继承,每个模块真跑真挂真过。\n');
  process.exit(0);
}

main().catch((e) => { console.error('scenario 失败:', e); process.exit(1); });
