// EvoMap 接入层:把真实 gep-mcp-server 当作 MCP server 拉起,用 MCP client 调它的 gep_* 工具。
// 默认本地模式(不传 remote)→ 零 key、零网络、零赞助消耗,供 dev/离线 demo。
// 传 remote 才进远程模式(测试时接真 Hub:publish/search)。
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// 直接定位已安装的 gep-mcp-server 入口,用 `node` 启动,绕开 npx 的联网解析(每次省数分钟)。
const require = createRequire(import.meta.url);
const SERVER_ENTRY = require.resolve('@evomap/gep-mcp-server');

export async function connectGep({ assetsDir, memoryDir, remote = null, label = 'evoimmune' } = {}) {
  const env = {
    ...process.env,
    GEP_ASSETS_DIR: assetsDir || resolve(ROOT, '.gepdata/assets'),
    GEP_MEMORY_DIR: memoryDir || resolve(ROOT, '.gepdata/memory'),
    // 默认清空远程凭据 → 强制本地模式
    EVOMAP_API_KEY: '',
    EVOMAP_NODE_ID: '',
    EVOMAP_NODE_SECRET: '',
  };
  if (remote) {
    env.EVOMAP_HUB_URL = remote.hubUrl || 'https://evomap.ai';
    env.EVOMAP_NODE_ID = remote.nodeId || '';
    env.EVOMAP_API_KEY = remote.apiKey || '';
    env.EVOMAP_NODE_SECRET = remote.nodeSecret || '';
  }

  const transport = new StdioClientTransport({
    command: process.execPath, // node
    args: [SERVER_ENTRY],
    cwd: ROOT,
    env,
  });
  const client = new Client({ name: label, version: '0.1.0' }, { capabilities: {} });
  await client.connect(transport);

  const call = async (name, args = {}) => {
    const res = await client.callTool({ name, arguments: args });
    const text = (res.content || []).map((c) => c.text).join('\n');
    try { return JSON.parse(text); } catch { return text; }
  };

  return {
    raw: client,
    mode: remote ? 'remote' : 'local',
    status: () => call('gep_status'),
    evolve: (context, intent) => call('gep_evolve', intent ? { context, intent } : { context }),
    recall: (query, signals) => call('gep_recall', signals ? { query, signals } : { query }),
    record: (args) => call('gep_record_outcome', args),
    listGenes: () => call('gep_list_genes'),
    searchCommunity: (query, opts = {}) => call('gep_search_community', { query, ...opts }),
    publishBundle: (args) => call('gep_publish_bundle', args),
    call,
    close: () => client.close(),
  };
}
