// EvoImmune Console 后端:Fastify + WebSocket,复用 src/ 引擎。
// REST 触发场景,WS 实时推送蜂群事件。支持 live(真跑)/ recorded(回放预生成数据)双模式。
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { WebSocketServer } from 'ws';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FAMILIES } from '../src/pathogens.js';
import { runSwarm } from '../src/swarm.js';
import { connectGep } from '../src/gepClient.js';
import { makeProposer, makeNoisyProposer } from '../src/proposers.js';
import { buildAntibody, ANTIBODY_COUNT } from '../src/publish.js';
import { REAL_BUGS } from '../src/realBugs.js';
import { runHarness } from '../src/harness.js';
import { makeBudget } from '../src/budget.js';

let publishCounter = 0;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
if (existsSync(resolve(ROOT, '.env'))) { try { process.loadEnvFile(resolve(ROOT, '.env')); } catch { /* */ } }

const PORT = Number(process.env.CONSOLE_PORT || 8787);
const FAM_META = FAMILIES.map((f) => ({ id: f.id, name: f.name, emoji: f.emoji }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- WebSocket hub ----------
const clients = new Set();
const wss = new WebSocketServer({ noServer: true });
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.send(JSON.stringify({ type: 'hello', families: FAM_META }));
});
function broadcast(msg) {
  const s = JSON.stringify(msg);
  for (const c of clients) if (c.readyState === 1) c.send(s);
}

// ---------- data helpers ----------
function readJson(name) {
  const p = resolve(ROOT, 'cockpit/data', name);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null;
}
function readSnapshot() {
  let base = {};
  const djs = resolve(ROOT, 'cockpit/data/data.js');
  if (existsSync(djs)) {
    try {
      const t = readFileSync(djs, 'utf8').replace(/^window\.__EVOIMMUNE__=/, '').replace(/;\s*$/, '');
      base = JSON.parse(t);
    } catch { /* */ }
  }
  return { ...base, realproof: readJson('realproof.json'), crossmodel: readJson('crossmodel.json'), publish: readJson('publish.json'), realbug: readJson('realbug.json') };
}

function buildTasks({ perFamily = 4, nodes = 12 } = {}) {
  const tasks = [];
  let idx = 0;
  for (let i = 0; i < perFamily; i++) {
    for (const fam of FAMILIES) {
      tasks.push({ id: `t${idx}_${fam.id}_${i}`, familyId: fam.id, node: idx % nodes, files: fam.gen(i).files });
      idx++;
    }
  }
  return tasks;
}

// ---------- scenario runners ----------
async function replayImmune({ runId }) {
  const snap = readSnapshot();
  const events = snap?.immune?.events || [];
  for (const e of events) {
    broadcast({ type: 'event', runId, ...e });
    await sleep(90);
  }
  broadcast({ type: 'run_end', runId, scenario: 'immune', metrics: snap?.immune?.metrics || {} });
}

async function runLiveImmune({ runId, params }) {
  const perFamily = Math.max(1, Math.min(8, Number(params.perFamily) || 4));
  const useLlm = params.solver === 'llm';
  const tasks = buildTasks({ perFamily });
  const base = resolve(ROOT, `.gepdata/console_${runId}`);
  rmSync(base, { recursive: true, force: true });
  const gep = await connectGep({ assetsDir: resolve(base, 'assets'), memoryDir: resolve(base, 'memory') });
  const metrics = await runSwarm({
    gep, tasks, immunity: true, workRoot: resolve(base, 'work'),
    proposer: makeProposer({ useLlm }),
    onEvent: (e) => broadcast({ type: 'event', runId, ...e }),
  });
  await gep.close();
  rmSync(base, { recursive: true, force: true });
  broadcast({ type: 'run_end', runId, scenario: 'immune', metrics });
}

async function runPublish({ runId }) {
  const { EVOMAP_NODE_ID, EVOMAP_NODE_SECRET, EVOMAP_HUB_URL = 'https://evomap.ai' } = process.env;
  if (!EVOMAP_NODE_ID || !EVOMAP_NODE_SECRET) { broadcast({ type: 'run_error', runId, error: '未注册 A2A 节点(EVOMAP_NODE_ID/SECRET)' }); return; }
  const nonce = String(Date.now()).slice(-6);
  // 轮换家族(跳过 idx 0=append,它最易被 trigger_dedup 限流)
  const idx = 1 + (publishCounter++ % Math.max(1, ANTIBODY_COUNT - 1));
  const { gene, capsule, event, label } = buildAntibody(idx, nonce);
  broadcast({ type: 'publishing', runId, label });
  const gep = await connectGep({ remote: { hubUrl: EVOMAP_HUB_URL, nodeId: EVOMAP_NODE_ID, nodeSecret: EVOMAP_NODE_SECRET }, label: 'evoimmune-publisher' });
  try {
    const r = await gep.publishBundle({ gene, capsule, event, modelName: 'evoimmune-swarm' });
    const p = (r && r.response && r.response.payload) || {};
    broadcast({
      type: 'published', runId, ok: r?.ok === true,
      bundle_id: p.bundle_id || null, decision: p.decision || null, reason: p.reason || null,
      gene_asset_id: r?.gene_asset_id || null, capsule_asset_id: r?.capsule_asset_id || null,
      node: EVOMAP_NODE_ID, at: new Date().toISOString(),
    });
  } catch (e) {
    broadcast({ type: 'run_error', runId, error: String(e?.message || e) });
  } finally {
    await gep.close();
  }
}

async function runHarnessScenario({ runId, mode, params }) {
  const bug = REAL_BUGS.find((b) => b.id === params.bug) || REAL_BUGS[0];
  const useLlm = mode === 'live' && params.solver === 'llm';
  const base = resolve(ROOT, `.gepdata/harness_${runId}`);
  rmSync(base, { recursive: true, force: true });
  const gep = await connectGep({ assetsDir: resolve(base, 'assets'), memoryDir: resolve(base, 'memory') });
  const proposer = useLlm ? makeProposer({ useLlm: true }) : makeNoisyProposer();
  broadcast({ type: 'harness_meta', runId, real: useLlm, bug: { id: bug.id, name: bug.name, emoji: bug.emoji, buggy_line: bug.buggy_line, fix_line: bug.fix_line } });
  try {
    const r = await runHarness({
      task: { id: `hx_${runId}`, node: 0, familyId: bug.id, files: bug.gen(0).files },
      fam: bug, gep, proposer, immunity: false,
      workRoot: resolve(base, 'work'), budget: makeBudget({ maxAttempts: 4 }),
      onEvent: (e) => broadcast({ type: 'harness_event', runId, ...e }),
    });
    broadcast({ type: 'run_end', runId, scenario: 'harness', metrics: r });
  } catch (e) {
    broadcast({ type: 'run_error', runId, error: String(e?.message || e) });
  } finally {
    await gep.close();
    rmSync(base, { recursive: true, force: true });
  }
}

async function runScenario({ scenario, mode, params, runId }) {
  broadcast({ type: 'run_start', runId, scenario, mode });
  if (scenario === 'publish') return runPublish({ runId });
  if (scenario === 'harness') return runHarnessScenario({ runId, mode, params });
  if (scenario === 'immune') {
    if (mode === 'live') return runLiveImmune({ runId, params });
    return replayImmune({ runId });
  }
  // 其他场景先用 recorded 快照回放(P1)
  const snap = readSnapshot();
  broadcast({ type: 'run_end', runId, scenario, metrics: snap?.[scenario]?.metrics || snap?.[scenario] || {} });
}

// ---------- HTTP ----------
const app = Fastify({ logger: false });
await app.register(cors, { origin: true });

app.get('/api/status', async () => ({
  ready: true,
  families: FAM_META,
  node: process.env.EVOMAP_NODE_ID || null,
  model: process.env.EVOIMMUNE_MODEL || 'stub',
  solver: process.env.EVOIMMUNE_SOLVER === 'llm' ? 'llm' : 'stub',
  hub: process.env.EVOMAP_HUB_URL || 'https://evomap.ai',
  clients: clients.size,
}));

app.get('/api/snapshot', async () => readSnapshot());

app.post('/api/run', async (req) => {
  const { scenario = 'immune', mode = 'recorded', params = {} } = req.body || {};
  const runId = 'run_' + Date.now();
  setImmediate(() => runScenario({ scenario, mode, params, runId })
    .catch((e) => broadcast({ type: 'run_error', runId, error: String(e?.message || e) })));
  return { runId, scenario, mode };
});

app.server.on('upgrade', (req, socket, head) => {
  if (req.url && req.url.startsWith('/ws')) {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  } else {
    socket.destroy();
  }
});

app.listen({ port: PORT, host: '0.0.0.0' }).then(() => {
  console.log(`[EvoImmune Console] backend on http://localhost:${PORT}  (WS /ws)`);
});
