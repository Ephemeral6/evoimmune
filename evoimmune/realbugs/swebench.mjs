// SWE-bench 风格 loader:把 realbugs 语料映射成 SWE-bench 任务对象。
// 我们复用 SWE-bench 同款契约(FAIL_TO_PASS / PASS_TO_PASS),
// 完整 SWE-bench Docker-per-task 验证留作下一步——本项目验证门已说同一种语言。
import { pathToFileURL } from 'node:url';
import { CASES } from './cases.mjs';

// 单个 case → SWE-bench 风格任务对象
export function toSweBenchTask(c) {
  return {
    instance_id: `evoimmune__realbugs-${c.id}`,
    problem_statement:
      `[${c.name}] ${c.real_world}\n` +
      `修复 solution.cjs 使 FAIL_TO_PASS 测试通过,同时不破坏 PASS_TO_PASS 回归测试。`,
    // SWE-bench 里这两个字段是测试节点 id 列表;我们的测试文件即对应节点。
    FAIL_TO_PASS: ['test.cjs'],
    PASS_TO_PASS: ['regress.cjs'],
    repo_hint: 'minimal-repro (single-file CommonJS) · 对齐 SWE-bench FAIL/PASS_TO_PASS 契约',
  };
}

// 全部 case → SWE-bench 任务数组
export function loadSweBenchTasks() {
  return CASES.map(toSweBenchTask);
}

// 直接运行时打印一份任务清单,便于人工核对(用 pathToFileURL 兼容非 ASCII 路径)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(loadSweBenchTasks(), null, 2));
}
