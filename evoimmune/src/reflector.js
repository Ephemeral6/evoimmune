// 反思:把验证失败转成可回灌的言语经验(Reflexion 外循环),喂给下一次提议。
import { firstError } from './validator.js';

export function reflect({ validation, attempt }) {
  const lines = [`第 ${attempt} 次尝试未通过。`];
  if (!validation.failToPass) lines.push(`目标测试仍失败:${firstError(validation.output)}`);
  if (validation.failToPass && !validation.passToPass) {
    lines.push(`目标测试过了,但引入回归(regress 变红):${firstError(validation.regressOut)} —— 说明修复过度拟合,只对付了当前用例。`);
  }
  lines.push('下一次:对照测试期望值定位真正根因,修通用逻辑而非硬编码个例,且不要破坏其他用例。');
  return lines.join(' ');
}
