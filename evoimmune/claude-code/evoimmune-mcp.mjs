// EvoImmune MCP Server:把共享免疫库暴露成两个 MCP 工具,让真实 Claude Code agent 直接调用。
// 用 @modelcontextprotocol/sdk 的低层 Server + StdioServerTransport(stdio 传输,即 .mcp.json 注册方式)。
// 持久持有一个本地 gep 连接 → 所有工具调用共享同一份免疫库(claude-code/.immunedata/)。
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { openImmuneGep, recallImmunity, sedimentAntibody } from './immunity.mjs';

// 工具定义:immune_recall 召回抗体、immune_sediment 沉淀抗体。
const TOOLS = [
  {
    name: 'immune_recall',
    description:
      '经验免疫·召回:给定一段报错文本,在群体免疫库里查是否有同类错误已被解过。' +
      '命中则返回抗体(修复 fix / 提示 hint / 置信 confidence / 相似 similarity),可直接套用,跳过试错。',
    inputSchema: {
      type: 'object',
      properties: {
        error: { type: 'string', description: '失败命令的 stderr / 报错文本' },
      },
      required: ['error'],
    },
  },
  {
    name: 'immune_sediment',
    description:
      '经验免疫·沉淀:把一次「报错 → 修复」沉淀成抗体写入群体免疫库,' +
      '此后任何 agent 命中同一错误指纹时都能零成本召回。',
    inputSchema: {
      type: 'object',
      properties: {
        error: { type: 'string', description: '当初的报错文本' },
        fix: { type: 'string', description: '解决该错误的修复(命令 / 代码 / 步骤)' },
        hint: { type: 'string', description: '可选:一句话经验提示' },
      },
      required: ['error', 'fix'],
    },
  },
];

// 持久 gep 连接(进程级单例):首次用时建立,后续工具调用复用。
let gepPromise = null;
function getGep() {
  if (!gepPromise) gepPromise = openImmuneGep('evoimmune-mcp');
  return gepPromise;
}

const server = new Server(
  { name: 'evoimmune', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args = {} } = req.params;
  const gep = await getGep();

  if (name === 'immune_recall') {
    const r = await recallImmunity({ error: String(args.error || ''), gep });
    const text = r.hit
      ? `命中免疫抗体(相似 ${r.similarity.toFixed(2)} · 置信 ${r.confidence.toFixed(2)}):\n` +
        `提示:${r.hint}\n修复:\n${r.fix}`
      : `未命中:免疫库中暂无该错误指纹(${r.key})的抗体。`;
    return {
      content: [{ type: 'text', text }],
      structuredContent: r,
    };
  }

  if (name === 'immune_sediment') {
    const r = await sedimentAntibody({
      error: String(args.error || ''),
      fix: String(args.fix || ''),
      hint: String(args.hint || ''),
      gep,
    });
    return {
      content: [{ type: 'text', text: `已沉淀抗体,错误指纹:${r.key}` }],
      structuredContent: { ok: true, ...r },
    };
  }

  return {
    content: [{ type: 'text', text: `未知工具:${name}` }],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // 连接后阻塞在 stdio 上等待请求,这是正常的(不会主动退出)。
  console.error('[evoimmune-mcp] 已启动,等待 stdio 请求…');
}

main().catch((e) => {
  console.error('[evoimmune-mcp] 致命错误:', e);
  process.exit(1);
});
