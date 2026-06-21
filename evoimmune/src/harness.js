// EvoImmune Harness:验证驱动、免疫增强、预算可控的 bug 修复 agent 执行回路。
// 7 阶段:观察 → 上下文构建(免疫召回)→ 提议 → 执行 → 验证硬闸门 → 评估/反思 → 沉淀抗体。
import { resolve } from 'node:path';
import { materialize, applyPatch } from './pathogens.js';
import { extractSignals } from './signals.js';
import { validate } from './validator.js';
import { recallAntibodies, antibodyContext } from './contextBuilder.js';
import { reflect } from './reflector.js';

export async function runHarness({ task, fam, gep, proposer, immunity, workRoot, budget, onEvent }) {
  const dir = resolve(workRoot, task.id);
  const emit = (phase, extra = {}) => onEvent && onEvent({ node: task.node, taskId: task.id, family: fam.id, phase, ...extra });

  // [1] 观察 Observe
  materialize(dir, task.files);
  let v = validate(dir);
  if (v.ok) { emit('healthy'); return { via: 'healthy', attempts: 0, tokens: 0 }; }
  const signals = extractSignals(v.output);
  emit('infected', { signals });

  // [2] 上下文构建 + 被动免疫(高置信抗体直接套,跳过模型)
  let reflections = '';
  if (immunity) {
    const rec = await recallAntibodies(gep, fam, signals);
    if (rec.best && rec.best.score >= rec.threshold && rec.best.payload.familyId === fam.id) {
      emit('recall_hit', { similarity: rec.best.sim, confidence: rec.best.conf });
      applyPatch(dir, fam);
      const vv = validate(dir);
      if (vv.ok) {
        await gep.record({
          geneId: fam.id, signals, status: 'success', score: 0.95,
          summary: JSON.stringify({ patchKind: 'family', familyId: fam.id, hint: fam.name, confidence: Math.min(0.99, rec.best.conf + 0.02), reused: true }),
        });
        emit('cured', { via: 'immunity', attempts: 0 });
        return { via: 'immunity', attempts: 0, tokens: 0 };
      }
      // 抗体复检失败 → 衰减置信度 + 拒收,落回主动修复
      emit('antibody_rejected', { similarity: rec.best.sim });
      await gep.record({
        geneId: fam.id, signals, status: 'failed', score: 0.2,
        summary: JSON.stringify({ patchKind: 'family', familyId: fam.id, hint: fam.name, confidence: Math.max(0.3, rec.best.conf - 0.3), rejected: true }),
      });
      materialize(dir, task.files);
    }
    reflections = antibodyContext(rec.matches);
  }

  // [3-6] 提议 → 执行 → 验证 → 反思 循环(预算内)
  let tokens = 0, llm = false, lastSig = null;
  while (budget.canRetry()) {
    budget.tick();
    const attempt = budget.attempts;
    emit('propose', { attempt });
    const pr = await proposer({ dir, signals, reflections, attempt, fam, task });
    tokens += pr.cost_tokens || 0; budget.spend(pr.cost_tokens || 0); llm = llm || !!pr.llm;
    v = validate(dir);
    emit('validate', { attempt, ok: v.ok, failToPass: v.failToPass, passToPass: v.passToPass, regressSkipped: v.regressSkipped });
    if (v.ok) {
      await gep.record({
        geneId: fam.id, signals, status: 'success', score: 0.9,
        summary: JSON.stringify({ patchKind: 'family', familyId: fam.id, hint: fam.name, confidence: 0.9 }),
      });
      emit('cured', { via: 'solve', attempts: attempt, cost_tokens: tokens, llm });
      return { via: 'solve', attempts: attempt, tokens, llm };
    }
    // [6] 反思 + 停滞检测
    const sig = (v.output || '').slice(0, 120) + '|' + v.passToPass;
    if (sig === lastSig) { emit('stagnation', { attempt }); break; }
    lastSig = sig;
    const note = reflect({ validation: v, attempt });
    reflections += '\n' + note;
    emit('reflect', { attempt, note });
  }
  emit('failed', { attempts: budget.attempts });
  return { via: 'failed', attempts: budget.attempts, tokens };
}
