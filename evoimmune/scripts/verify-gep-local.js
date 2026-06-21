// 实测:gep-mcp-server 在「纯本地离线」模式下的免疫闭环 round-trip。
// 不设 EVOMAP_API_KEY/NODE_ID → 强制 IS_REMOTE=false → 零网络、零赞助消耗。
// 流程:status → record_outcome(success) → recall(应命中刚写入的经验) → status。
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const GEP_ASSETS_DIR = resolve(ROOT, '.gepdata/assets');
const GEP_MEMORY_DIR = resolve(ROOT, '.gepdata/memory');

function pretty(label, text) {
  console.log(`\n===== ${label} =====`);
  try { console.log(JSON.stringify(JSON.parse(text), null, 2)); }
  catch { console.log(text); }
}

async function main() {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@evomap/gep-mcp-server'],
    cwd: ROOT,
    env: {
      ...process.env,
      GEP_ASSETS_DIR,
      GEP_MEMORY_DIR,
      // 强制本地模式:清掉任何远程凭据
      EVOMAP_API_KEY: '',
      EVOMAP_NODE_ID: '',
      EVOMAP_NODE_SECRET: '',
    },
  });

  const client = new Client({ name: 'evoimmune-verify', version: '0.1.0' }, { capabilities: {} });
  await client.connect(transport);

  const tools = await client.listTools();
  console.log('可用工具:', tools.tools.map((t) => t.name).join(', '));

  const call = async (name, args = {}) => {
    const res = await client.callTool({ name, arguments: args });
    return (res.content || []).map((c) => c.text).join('\n');
  };

  pretty('① status (初始)', await call('gep_status'));

  const signals = ['TypeError', 'is not a function', 'append'];
  pretty(
    '② record_outcome (零号病人成功修复 → 应生成抗体/capsule)',
    await call('gep_record_outcome', {
      geneId: 'ad_hoc',
      signals,
      status: 'success',
      score: 0.9,
      summary: 'Fixed: array.append() does not exist in JS; replaced with array.push().',
    })
  );

  pretty(
    '③ recall (另一节点遇到同类报错 → 应命中继承=免疫)',
    await call('gep_recall', {
      query: 'array append is not a function TypeError',
      signals,
    })
  );

  pretty('④ status (闭环后)', await call('gep_status'));

  await client.close();
  console.log('\n[OK] 本地免疫闭环 round-trip 完成。');
}

main().catch((e) => {
  console.error('[FAIL]', e);
  process.exit(1);
});
