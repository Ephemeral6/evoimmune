// 注册 EvoMap A2A 节点:POST /a2a/hello → 拿 node_id / node_secret / claim_url。
// 凭据存 ~/.evomap/(0600)并写入项目 .env;打印 claim_url 供浏览器认领绑定账户。
// 密钥不打印到日志。
import { writeFileSync, mkdirSync, existsSync, readFileSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HUB = 'https://evomap.ai';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(homedir(), '.evomap');
const idPath = resolve(dir, 'node_id'), secPath = resolve(dir, 'node_secret');

if (existsSync(idPath) && existsSync(secPath)) {
  console.log('已有节点凭据:', readFileSync(idPath, 'utf8').trim(), '(如需重注册先删 ~/.evomap/)');
  process.exit(0);
}

const now = Date.now();
const rand = Math.random().toString(36).slice(2, 6);
const msg = {
  protocol: 'gep-a2a', protocol_version: '1.0.0', message_type: 'hello',
  message_id: `msg_${now}_${rand}`,
  timestamp: new Date().toISOString(),
  payload: {
    capabilities: { evolve: true, recall: true, validate: true },
    model: 'evoimmune-swarm',
    name: 'evoimmune',
    env_fingerprint: { platform: process.platform, arch: process.arch },
  },
};

const res = await fetch(`${HUB}/a2a/hello`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) });
if (!res.ok) { console.error('hello 失败:', res.status, (await res.text()).slice(0, 300)); process.exit(1); }
const data = await res.json();
const p = data.payload || data;

const nodeId = p.your_node_id || p.node_id;
const nodeSecret = p.node_secret;
const claimUrl = p.claim_url;
if (!nodeId || !nodeSecret) {
  const masked = JSON.stringify(data).replace(/("node_secret":")[^"]+/, '$1<隐藏>').replace(/(node_[A-Za-z0-9_-]{6})[A-Za-z0-9_-]+/g, '$1…');
  console.error('响应缺凭据,完整结构:\n', masked);
  process.exit(1);
}

// 存 ~/.evomap/
mkdirSync(dir, { recursive: true }); chmodSync(dir, 0o700);
writeFileSync(idPath, nodeId); chmodSync(idPath, 0o600);
writeFileSync(secPath, nodeSecret); chmodSync(secPath, 0o600);

// 写入项目 .env(替换占位注释行)
const envPath = resolve(ROOT, '.env');
let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
env = env.replace(/^#?\s*EVOMAP_NODE_ID=.*$/m, `EVOMAP_NODE_ID=${nodeId}`)
         .replace(/^#?\s*EVOMAP_NODE_SECRET=.*$/m, `EVOMAP_NODE_SECRET=${nodeSecret}`);
if (!/EVOMAP_NODE_ID=/.test(env)) env += `\nEVOMAP_NODE_ID=${nodeId}\nEVOMAP_NODE_SECRET=${nodeSecret}\n`;
writeFileSync(envPath, env);

console.log('✅ 节点已注册,凭据存于 ~/.evomap/ 与项目 .env');
console.log('NODE_ID:', nodeId);
console.log('heartbeat_interval_ms:', data.heartbeat_interval_ms);
console.log('\n⚠️ 请在已登录 EvoMap 的浏览器打开认领链接,绑定到你的账户:');
console.log('   CLAIM_URL:', claimUrl);
