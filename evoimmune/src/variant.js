// ⑤ 变异攻防 Variant Arena
// 病原会变异。抗体的 trigger 是模糊匹配(EvoMap recall 真实机制),于是:
//   · 交叉免疫:变异株换了写法但报错签名不变 → 老抗体 recall 命中 + 载荷变换仍适用 → 免疫。
//   · 免疫逃逸:变异株换了报错签名(.append → .add)→ recall 相似度跌破阈值 → 逃逸 → 需新抗体(加强针)。
// 抗体载荷 = 数据化的代码变换 {from,to},随 capsule note 传播(= capsule.content 的精神)。
// 全程本地,零 key 零赞助消耗。
import { resolve } from 'node:path';
import { rmSync } from 'node:fs';
import { connectGep } from './gepClient.js';
import { materialize, runValidation, transformSolution } from './pathogens.js';
import { extractSignals } from './signals.js';

const THRESH = 0.6;
const sum = (n) => (n * (n + 1)) / 2;

function files(fn, body, n) {
  return {
    'solution.cjs': body,
    'test.cjs': `const {${fn}}=require('./solution.cjs');\nconst got=${fn}(${n});\nif(got!==${sum(n)}){console.error('AssertionError: expected ${sum(n)} got '+got);process.exit(1);}\nconsole.log('PASS');\n`,
  };
}

// 野生株:loop + .append
function genWild(i) {
  const fn = `wild${i}`, n = 4 + i;
  return { strain: 'wild', label: '野生株', fix: { from: '.append(', to: '.push(' },
    files: files(fn, `function ${fn}(n){\n  const a=[];\n  for(let k=1;k<=n;k++) a.append(k);\n  return a.reduce((x,y)=>x+y,0);\n}\nmodule.exports={${fn}};\n`, n) };
}
// 交叉株:换成 forEach,但仍是 .append → 同签名、同变换可治
function genCross(i) {
  const fn = `cross${i}`, n = 4 + i;
  return { strain: 'cross', label: '交叉株(换写法,同症状)', fix: { from: '.append(', to: '.push(' },
    files: files(fn, `function ${fn}(n){\n  const a=[];\n  [...Array(n)].forEach((_,k)=>a.append(k+1));\n  return a.reduce((x,y)=>x+y,0);\n}\nmodule.exports={${fn}};\n`, n) };
}
// 逃逸株:变异成 .add → 报错签名改变,老抗体认不出
function genEscape(i) {
  const fn = `esc${i}`, n = 4 + i;
  return { strain: 'escape', label: '逃逸株(变异 .add)', fix: { from: '.add(', to: '.push(' },
    files: files(fn, `function ${fn}(n){\n  const a=[];\n  for(let k=1;k<=n;k++) a.add(k);\n  return a.reduce((x,y)=>x+y,0);\n}\nmodule.exports={${fn}};\n`, n) };
}

export async function runVariant({ root } = {}) {
  const base = resolve(root, '.gepdata/variant');
  rmSync(base, { recursive: true, force: true });
  const gep = await connectGep({ assetsDir: resolve(base, 'assets'), memoryDir: resolve(base, 'memory') });

  // 疫情时间线:2 野生 → 3 交叉 → 3 逃逸 → 2 加强针(再来逃逸)
  const seq = [
    ...[0, 1].map(genWild),
    ...[0, 1, 2].map(genCross),
    ...[0, 1, 2].map(genEscape),
    ...[3, 4].map(genEscape),
  ];

  const events = []; let clock = 0;
  const metrics = { wild_solved: 0, cross_immune: 0, escape_solved: 0, booster_immune: 0, solves: 0 };

  for (let idx = 0; idx < seq.length; idx++) {
    const task = seq[idx];
    const dir = resolve(base, 'work', `v${idx}_${task.strain}`);
    materialize(dir, task.files);
    let res = runValidation(dir);
    const signals = extractSignals(res.stderr);

    const r = await gep.recall(`variant ${signals.join(' ')}`, signals);
    const all = (r.matches || []).filter((m) => m.outcome && m.outcome.status === 'success');
    const bestSim = all.length ? Math.max(...all.map((m) => m.similarity)) : 0;
    const candidates = all.filter((m) => m.similarity >= THRESH).sort((a, b) => b.similarity - a.similarity);

    let immune = false;
    for (const m of candidates) {
      let pl; try { pl = JSON.parse(m.outcome.note); } catch { continue; }
      if (pl.patchKind !== 'transform') continue;
      materialize(dir, task.files);
      transformSolution(dir, (src) => src.split(pl.from).join(pl.to));
      if (runValidation(dir).ok) { immune = true; break; }
    }

    let outcome;
    if (immune) {
      outcome = task.strain === 'cross' ? 'cross_immune' : task.strain === 'escape' ? 'booster_immune' : 'immune';
      metrics[outcome] = (metrics[outcome] || 0) + 1;
    } else {
      // 解题(stub:应用本株已知变换)+ 沉淀新抗体
      transformSolution(dir, (src) => src.split(task.fix.from).join(task.fix.to));
      const ok = runValidation(dir).ok;
      metrics.solves++;
      outcome = task.strain === 'escape' ? 'escape_solved' : 'wild_solved';
      metrics[outcome] = (metrics[outcome] || 0) + 1;
      if (ok) await gep.record({ geneId: `gene_variant_${task.fix.from}`, signals, status: 'success', score: 0.9,
        summary: JSON.stringify({ patchKind: 'transform', from: task.fix.from, to: task.fix.to, label: task.label }) });
    }
    events.push({ t: clock++, idx, strain: task.strain, label: task.label, outcome, signals, bestSim: +bestSim.toFixed(2) });
  }

  await gep.close();
  return { metrics, events };
}
