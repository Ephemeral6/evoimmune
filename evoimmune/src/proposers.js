// 提议器(harness 的 [3] Propose):产出并应用一个补丁到工作区,返回 {llm, cost_tokens}。
// harness 每次尝试调用它一次;失败会带 reflections 再调。
import { applyPatch, materialize, transformSolution } from './pathogens.js';
import { makeLlmSolver } from './llmSolver.js';

// 玩具家族:一次到位(确定性变换)
export function makeStubProposer({ est = 1500 } = {}) {
  return async ({ dir, fam }) => { applyPatch(dir, fam); return { llm: false, cost_tokens: est }; };
}

// 真坑离线演示:第 1 次过度拟合(过 target 但 regress 挂)→ 第 2 次正解。
// 用来在离线下演示完整 harness 回路 + PASS_TO_PASS 闸门的价值。
export function makeNoisyProposer({ est = 1500 } = {}) {
  return async ({ dir, fam, task, attempt }) => {
    materialize(dir, task.files); // 每次从原始 bug 重来,保证变换可命中
    if (attempt === 1 && fam.wrongPatch) transformSolution(dir, fam.wrongPatch);
    else applyPatch(dir, fam);
    return { llm: false, cost_tokens: est };
  };
}

// 真模型:读 reflections 迭代修(失败的反思会回灌进 prompt)
export function makeLlmProposer(opts = {}) {
  const solve = makeLlmSolver(opts);
  return async ({ dir, signals, reflections }) => solve({ dir, signals, reflections });
}

// 统一选择器:useLlm 显式指定则用之;否则看 env EVOIMMUNE_SOLVER。LLM 不可用回退 stub。
export function makeProposer({ useLlm } = {}) {
  const llm = useLlm === undefined ? process.env.EVOIMMUNE_SOLVER === 'llm' : useLlm;
  if (llm) {
    try { return makeLlmProposer(); } catch (e) { console.warn('[proposer] LLM 不可用,回退 stub:', e.message); }
  }
  return makeStubProposer();
}
