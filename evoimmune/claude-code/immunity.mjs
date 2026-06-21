// 共享免疫库:把 EvoMap「经验免疫」封装成两个动作,供真实 Claude Code agent 群共用。
// 复用项目现有的 gepClient(EvoMap 接入层)与 signals(错误指纹归一化),
// 产出的抗体 summary 形状与现有 src/harness.js、src/contextBuilder.js 完全互通。
// 全程本地模式 → 零 key、零网络:任何 agent 起 stdio 子进程读同一份 .immunedata/ 即共享免疫。
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectGep } from '../src/gepClient.js';
import { extractSignals, signalKey } from '../src/signals.js';

const HERE = dirname(fileURLToPath(import.meta.url));
// 抗体资产/记忆都落在 claude-code/.immunedata/ → 跨 agent、跨进程共享的免疫库。
const IMMUNE_DIR = resolve(HERE, '.immunedata');
// recall 命中阈值:与 src/contextBuilder.js 的 IMMUNE_THRESHOLD 对齐,避免「0.6 信任陷阱」。
const IMMUNE_THRESHOLD = 0.6;
// 免疫库里抗体共用的稳定 geneId(免疫族系):同类错误归并到同一族 → 复用计数随之累加。
const IMMUNE_GENE = 'evoimmune.cc';

// 助手:打开本地免疫库连接(资产/记忆都在 claude-code/.immunedata/)。
export async function openImmuneGep(label = 'evoimmune-cc') {
  return connectGep({
    assetsDir: resolve(IMMUNE_DIR, 'assets'),
    memoryDir: resolve(IMMUNE_DIR, 'memory'),
    label,
  });
}

// 经验级归一化:在 extractSignals 之上,再把"稳定短语 (可变细节)"里的括号细节剥掉,
// 让同一条项目经验/约定在不同 handler、不同字段名上产生同一签名 → 跨任务可继承。
// (extractSignals 已剥引号;这里再剥 " (" 之后的内容。无括号则原样返回,向后兼容。)
function lessonSignals(error) {
  const sig = extractSignals(error);
  const phrase = String(sig[1]).split(' (')[0].trim();
  return [sig[0], phrase || sig[1]];
}

// 召回免疫:从 error 文本抽取经验级签名 → gep.recall → 命中最佳抗体(含 fix/hint/置信/相似)。
// 命中条件:相似度×置信度 ≥ 阈值 且 outcome 为 success(失败/被衰减的抗体不当免疫)。
export async function recallImmunity({ error, gep }) {
  const signals = lessonSignals(error);
  const key = signalKey(signals);
  const r = await gep.recall(`evoimmune ${signals.join(' ')}`, signals);

  const matches = (r.matches || [])
    .filter((m) => m.outcome && m.outcome.status === 'success')
    .map((m) => {
      let payload = null;
      try { payload = JSON.parse(m.outcome.note); } catch { /* 非 JSON note 跳过 */ }
      const conf = (payload && typeof payload.confidence === 'number') ? payload.confidence : (m.outcome.score || 0.9);
      return { sim: Number(m.similarity) || 0, conf, payload, score: (Number(m.similarity) || 0) * conf };
    })
    .filter((m) => m.payload && m.payload.fix)  // 只认带「修复」的抗体
    .sort((a, b) => b.score - a.score);

  const best = matches[0];
  if (!best || best.score < IMMUNE_THRESHOLD) {
    return { hit: false, signals, key, threshold: IMMUNE_THRESHOLD };
  }
  return {
    hit: true,
    signals,
    key,
    threshold: IMMUNE_THRESHOLD,
    similarity: best.sim,
    confidence: best.conf,
    score: best.score,
    fix: best.payload.fix,
    hint: best.payload.hint || '',
    familyId: best.payload.familyId || key,
  };
}

// 沉淀抗体:把「错误指纹 → 修复」当成功 outcome 记进 gep。
// summary 用与现有 console 兼容的 JSON 形状({patchKind, familyId, hint, confidence}),
// 额外带 fix 字段(承载真实修复),老消费者忽略它、新 recall 读它,向后兼容。
export async function sedimentAntibody({ error, fix, hint = '', gep, confidence = 0.9 }) {
  const signals = lessonSignals(error);
  const key = signalKey(signals);
  const summary = JSON.stringify({
    patchKind: 'cc-immune',     // 标记来源:Claude Code 真实 harness 沉淀的抗体
    familyId: key,              // 用归一化签名当族系 id → 同类错聚合
    hint: hint || `修复 ${signals[0]}: ${signals[1]}`,
    confidence,
    fix,                       // 真实修复(召回时直接注入给下一个 agent)
  });
  await gep.record({
    geneId: IMMUNE_GENE,
    signals,
    status: 'success',
    score: confidence,
    summary,
  });
  return { signals, key };
}

export { IMMUNE_THRESHOLD, IMMUNE_DIR };
