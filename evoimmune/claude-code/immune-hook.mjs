#!/usr/bin/env node
// Claude Code PostToolUse 钩子:Bash 工具一旦失败,自动到群体免疫库召回抗体并注入上下文。
// 协议(见 code.claude.com/docs hooks):stdin 收 {tool_name, tool_input, tool_output/tool_response,...};
// 命中则 stdout 输出 {hookSpecificOutput:{hookEventName:"PostToolUse", additionalContext:"<免疫提示>"}} 并 exit 0;
// 未命中(或不是 Bash / 没抽到真错)就静默 exit 0,不打扰 agent。
// 钩子必须健壮:任何异常都吞掉并静默退出 0,绝不阻断主 agent。
import { extractSignals } from '../src/signals.js';
import { openImmuneGep, recallImmunity } from './immunity.mjs';

// 读 stdin 全文。
function readStdin() {
  return new Promise((resolve) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (buf += c));
    process.stdin.on('end', () => resolve(buf));
    process.stdin.on('error', () => resolve(buf));
  });
}

// 静默成功:不产出上下文。
function silent() { process.exit(0); }

// 注入免疫上下文。
function inject(text) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: text,
    },
  }));
  process.exit(0);
}

async function main() {
  const raw = await readStdin();
  let evt;
  try { evt = JSON.parse(raw); } catch { return silent(); }

  // 只管 Bash 类工具(真实命令的 stderr 才是抗原)。
  const tool = evt.tool_name || '';
  if (!/Bash/i.test(tool)) return silent();

  // 兼容字段名:不同版本可能用 tool_output 或 tool_response。
  const out = evt.tool_output || evt.tool_response || {};
  const exit = out.exit_code;
  const stderr = String(out.stderr || '');
  const stdout = String(out.stdout || '');
  // 成功(exit 0)且没有 stderr → 没病原,放行。
  if (exit === 0 && !stderr.trim()) return silent();

  // 从 stderr(兜底拼 stdout)抽签名;抽不到真错就放行。
  const text = (stderr + '\n' + stdout).trim();
  const signals = extractSignals(text);
  if (!signals || signals[0] === 'UnknownError') return silent();

  // 召回免疫(本地库,零 key)。任何异常都静默放行。
  let gep;
  try {
    gep = await openImmuneGep('evoimmune-hook');
    const r = await recallImmunity({ error: text, gep });
    await gep.close();
    if (!r.hit) return silent();
    return inject(
      `【EvoImmune 群体免疫·已召回抗体】\n` +
      `检测到错误指纹「${r.signals.join(' | ')}」,此前已有 agent 解过(相似 ${r.similarity.toFixed(2)} · 置信 ${r.confidence.toFixed(2)})。\n` +
      `经验提示:${r.hint}\n` +
      `建议修复(直接套用,跳过试错):\n${r.fix}`,
    );
  } catch {
    try { if (gep) await gep.close(); } catch { /* */ }
    return silent();
  }
}

main().catch(() => silent());
