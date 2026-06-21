// 解题器 Solver:把一个"感染"的工作区治愈。
// stub 版(离线、零赞助):应用该家族的已知变换,模拟"从零解题"的结果。
// real 版(测试时):换成 Anthropic SDK 走 EvoMap 网关让模型真的读报错→改代码(见 llmSolver,后续接)。
import { applyPatch } from './pathogens.js';
import { makeLlmSolver } from './llmSolver.js';

// 离线 stub:确定性治愈。cost_tokens 是"若用真模型解一次"的保守估算,
// 仅用于离线 demo 的省量曲线;real 版会用真实 usage 覆盖。
export function makeStubSolver({ estTokensPerSolve = 1800 } = {}) {
  return async ({ dir, family }) => {
    applyPatch(dir, family);
    return { llm: false, cost_tokens: estTokensPerSolve, solver: 'stub' };
  };
}

// 统一选择器:默认 stub(离线零消耗);设 EVOIMMUNE_SOLVER=llm 且有 key 时切真模型。
export function makeSolver(opts = {}) {
  if (process.env.EVOIMMUNE_SOLVER === 'llm') {
    try {
      return makeLlmSolver(opts);
    } catch (e) {
      console.warn('[solver] LLM 不可用,回退 stub:', e.message);
    }
  }
  return makeStubSolver(opts);
}
