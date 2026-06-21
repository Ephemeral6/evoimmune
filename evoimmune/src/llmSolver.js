// 真 LLM 解题器(测试时用):EvoMap 网关是 OpenAI 兼容的 Chat Completions 端点。
// POST {baseURL}/chat/completions,Authorization: Bearer sk-evomap-...。用原生 fetch,无需额外依赖。
// 仅当 EVOIMMUNE_SOLVER=llm 且配了 key 时被 makeSolver() 选中 → 只在"未命中"那步烧赞助额度。
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function makeLlmSolver({
  apiKey = process.env.EVOMAP_API_KEY,
  baseURL = process.env.EVOMAP_GATEWAY_URL || 'https://api.evomap.ai/v1',
  model = process.env.EVOIMMUNE_MODEL || 'evomap-gemini-3.1-pro-preview',
} = {}) {
  if (!apiKey) throw new Error('makeLlmSolver 需要 EVOMAP_API_KEY。未配置请用 stub。');
  const endpoint = baseURL.replace(/\/+$/, '') + '/chat/completions';

  return async ({ dir, signals, reflections }) => {
    const file = resolve(dir, 'solution.cjs');
    const buggy = readFileSync(file, 'utf8');
    const testPath = resolve(dir, 'test.cjs');
    const test = existsSync(testPath) ? readFileSync(testPath, 'utf8') : '';
    const refl = reflections ? `\n\n之前尝试的反思(请据此避免重蹈覆辙):\n${reflections}\n` : '';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: '你是修 bug 的 agent。读测试理解期望行为,推理出根因,只输出修好后的完整 solution.cjs 文件内容,不要解释、不要 markdown 围栏。' },
          { role: 'user', content: `运行 \`node test.cjs\` 失败,报错信号:${signals.join(' / ')}\n\n这是测试 test.cjs(据此理解期望行为):\n${test}${refl}\n这是当前 solution.cjs,请修好让测试通过(只回完整 solution.cjs 内容):\n\n${buggy}` },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`gateway ${res.status}: ${t.slice(0, 300)}`);
    }
    const data = await res.json();
    let out = (data.choices?.[0]?.message?.content || '').trim();
    out = out.replace(/^```[a-z]*\n?/i, '').replace(/```\s*$/, '').trim(); // 去 markdown 围栏兜底
    if (out) writeFileSync(file, out);
    const u = data.usage || {};
    return { llm: true, cost_tokens: (u.prompt_tokens || 0) + (u.completion_tokens || 0), solver: 'llm', model };
  };
}
