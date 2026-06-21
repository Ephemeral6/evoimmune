// EvoImmune Harness 离线演示:展示完整 7 阶段回路。
// Run1:真坑(分页 off-by-one),noisy 提议器第1次过度拟合→回归闸门抓出→反思→第2次正解。
// Run2:同类复发,被动免疫(recall 命中,0 次提议)。全程离线,零赞助消耗。
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, rmSync } from 'node:fs';
import { connectGep } from '../src/gepClient.js';
import { REAL_BUGS } from '../src/realBugs.js';
import { runHarness } from '../src/harness.js';
import { makeBudget } from '../src/budget.js';
import { makeNoisyProposer } from '../src/proposers.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(resolve(ROOT, '.env'))) { try { process.loadEnvFile(resolve(ROOT, '.env')); } catch { /* */ } }

const ICON = { infected: '🛑', recall_hit: '📡', propose: '✍️ ', validate: '🔬', reflect: '🤔', cured: '✅', failed: '❌', antibody_rejected: '⛔', stagnation: '🥱', healthy: '🟢' };
function printer(prefix) {
  return (e) => {
    let line = `${prefix} ${ICON[e.phase] || '·'} ${e.phase}`;
    if (e.phase === 'infected') line += ` [${e.signals.join(' / ')}]`;
    if (e.phase === 'recall_hit') line += ` sim=${Number(e.similarity).toFixed(2)} conf=${Number(e.confidence).toFixed(2)}`;
    if (e.phase === 'propose') line += ` 第${e.attempt}次`;
    if (e.phase === 'validate') line += ` 第${e.attempt}次 → ${e.ok ? 'PASS' : 'FAIL'} (failToPass=${e.failToPass}, passToPass=${e.passToPass})`;
    if (e.phase === 'reflect') line += ` ${e.note.slice(0, 90)}…`;
    if (e.phase === 'cured') line += ` via=${e.via} attempts=${e.attempts}${e.cost_tokens ? ' tok=' + e.cost_tokens : ''}`;
    console.log(line);
  };
}

const base = resolve(ROOT, '.gepdata/harness_demo');
rmSync(base, { recursive: true, force: true });
const gep = await connectGep({ assetsDir: resolve(base, 'assets'), memoryDir: resolve(base, 'memory') });
const bug = REAL_BUGS[0]; // 分页边界错位
const proposer = makeNoisyProposer();

console.log(`\n=== Run 1:零号病人「${bug.name}」· 主动修复(noisy:先过度拟合,被回归闸门抓出)===`);
const r1 = await runHarness({
  task: { id: 'hd_v0', node: 0, familyId: bug.id, files: bug.gen(0).files },
  fam: bug, gep, proposer, immunity: false,
  workRoot: resolve(base, 'work'), budget: makeBudget({ maxAttempts: 4 }), onEvent: printer('  '),
});
console.log('  结果:', JSON.stringify(r1));

console.log(`\n=== Run 2:同类复发(变体2)· 被动免疫(recall 命中,0 次提议)===`);
const r2 = await runHarness({
  task: { id: 'hd_v2', node: 1, familyId: bug.id, files: bug.gen(2).files },
  fam: bug, gep, proposer, immunity: true,
  workRoot: resolve(base, 'work'), budget: makeBudget({ maxAttempts: 4 }), onEvent: printer('  '),
});
console.log('  结果:', JSON.stringify(r2));

await gep.close();
console.log('\n[OK] Harness 7 阶段回路验证完成');
