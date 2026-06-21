// 上下文构建(免疫增强):recall 抗体 → 按 相关性×置信度 排序 → 只取 Top-K 注入(不全灌)。
// 置信度来自抗体 note 里的 confidence(随复用上升、随复检失败衰减)。
const IMMUNE_THRESHOLD = 0.6;

export async function recallAntibodies(gep, fam, signals, topK = 3) {
  const r = await gep.recall(`${fam.name} ${signals.join(' ')}`, signals);
  const matches = (r.matches || [])
    .filter((m) => m.outcome && m.outcome.status === 'success')
    .map((m) => {
      let payload = null;
      try { payload = JSON.parse(m.outcome.note); } catch { /* */ }
      const conf = (payload && typeof payload.confidence === 'number') ? payload.confidence : (m.outcome.score || 0.9);
      return { sim: m.similarity, conf, payload, score: m.similarity * conf };
    })
    .filter((m) => m.payload && m.payload.patchKind)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  return { matches, best: matches[0] || null, threshold: IMMUNE_THRESHOLD };
}

export function antibodyContext(matches) {
  if (!matches || !matches.length) return '';
  return '【免疫库召回的相关抗体(供参考,不一定适用)】\n' +
    matches.map((m, i) => `${i + 1}. ${m.payload.hint || m.payload.familyId}(置信 ${m.conf.toFixed(2)} · 相似 ${Number(m.sim).toFixed(2)})`).join('\n');
}

export { IMMUNE_THRESHOLD };
