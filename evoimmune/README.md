# 🧬 EvoImmune · 硅基生命的群体免疫系统

> **进化酒馆·边境免疫志** — EvoMap「进化酒馆」黑客松 · 赛道一 The Forge / A2A 蜂群协作
>
> 一个 agent 踩坑,把失败压缩成「抗体」,经 EvoMap 中央电报局让全族群继承 —— **一个 agent 学会,百万 agent 生来免疫。**

免疫机制**全部由真实 EvoMap 驱动**(`gep_recall` / `gep_record_outcome` / `gep_publish_bundle`),不是模拟:真模型解题、跨模型继承、真 A2A 节点上链,都跑通并可现场互动。

---

## 一句话

把"经验共享"做成"群体免疫":agent 把踩过的坑沉淀成带 `trigger`(报错指纹)的 **Capsule(抗体)**,经 EvoMap Hub 共享;别的 agent 命中同一指纹就**生来免疫**——不再犯、不再烧 token。直接回答赛事手册命题:*"失败经验如何被压缩成整个种群的本能,让其他节点生来就具备群体免疫?"*

## 免疫概念 ↔ 真实 EvoMap 原语

| 免疫概念 | EvoMap 真实原语 |
|---|---|
| 抗体(对某类坑的免疫) | **Capsule**(`content` + `trigger` + `outcome`) |
| 识别 / 继承 | **`gep_recall`**(模糊 trigger 匹配) |
| 沉淀抗体 | **`gep_record_outcome`**(成功即生成 Capsule) |
| 可信免疫(拒收水抗体) | **validation 沙箱(node)+ Validator + GDI 闸门** |
| 抗体上链扩散 | **`gep_publish_bundle` → A2A Hub**(真节点已注册+认领) |

## 真实性证据(非注水)

- **真模型实证**:Gemini 3.1 Pro 经 EvoMap 网关真解零号病人(`scripts/verify-llm.js` / `real-proof.js`)。
- **跨模型免疫**:Claude / GPT / Gemini 各造抗体,被全 6 种模型继承(3×6 矩阵全绿,`scripts/cross-model.js`)。
- **真 A2A 上链**:注册并认领真节点(`scripts/register-node.js`),`gep_publish_bundle` 上 evomap.ai;实测决策有 `quarantine/safety_candidate` 也有 `accept/auto_promoted`(`scripts/publish-antibody.js`)。
- **真坑实证**:两个真实逻辑 bug(分页 off-by-one、发票折扣/税顺序——输出错误而非语法 typo),真模型读测试反推业务意图修复(`scripts/real-bug-proof.js`),同类复发即零模型免疫。
- **受控基准**:180 任务 · 64 节点 · 6 病原家族 → 免疫前 180 次解,免疫后 6 次,**省 97% · ≈313,200 tokens**。

## 架构

```
src/                引擎(复用)
  gepClient.js      MCP client 包真 gep-mcp-server(本地/远程)
  pathogens.js      病原工厂(6 家族,校验 = node test.cjs)
  realBugs.js       真实逻辑 bug(分页 / 发票)
  signals.js        归一化错误签名(抗体 trigger)
  ── EvoImmune Harness(7 阶段执行回路)──
  harness.js        观察→上下文/免疫召回→提议→执行→验证闸门→反思重试→沉淀
  validator.js      FAIL_TO_PASS + PASS_TO_PASS 自建验证闸门(test.cjs + regress.cjs)
  contextBuilder.js recall 抗体 → 相关性×置信度 排序 Top-K 注入(置信度会衰减)
  reflector.js      失败反思回灌下一次提议(Reflexion 外循环)
  budget.js         尝试/token 预算 + 停滞终止
  proposers.js      stub / noisy(离线演示循环)/ llm(真模型) + makeProposer
  ── 调度与场景 ──
  swarm.js          调度 N 个 harness 实例(免疫蜂群)
  llmSolver.js      真模型解题(OpenAI 兼容网关,读测试+反思)
  scale/variant/vaccinate/trust/cross-model/publish ...   各场景

server/index.js     后端:Fastify + WebSocket,REST 触发 + WS 实时推流(live/recorded)
web/                前端:React + Vite + Tailwind 实时 Console(西部世界美术)
cockpit/            零依赖静态兜底版(单文件 HTML)
```

## 跑起来

```bash
# 1) 安装
npm install
npm --prefix web install

# 2) 离线验证免疫闭环(零赞助消耗)
node scripts/verify-gep-local.js     # record→recall 命中
node src/runDemo.js                  # 全量离线 demo,写 cockpit/data

# 3) 实时 Console(推荐)
node server/index.js                 # 后端 :8787
npm --prefix web run dev             # 前端 :5174(代理 /api、/ws)
```

打开 http://localhost:5174 → 点 **「▶ 全场战役演示」** 一键看完整故事(蜂群免疫 → 曲线 → 真上链),或逐个场景互动。

### 接真模型 / 真 Hub(测试时)

项目根建 `.env`(见 `.env.example`):

```bash
EVOIMMUNE_SOLVER=llm
EVOMAP_API_KEY=sk-evomap-...            # evomap.ai/zh/account/api-manage 的 Gateway Key
EVOMAP_GATEWAY_URL=https://api.evomap.ai/v1   # OpenAI 兼容 Chat Completions
EVOIMMUNE_MODEL=evomap-gemini-3.1-pro-preview
EVOMAP_NODE_ID=node_...                 # node scripts/register-node.js 注册并认领
EVOMAP_NODE_SECRET=...
EVOMAP_HUB_URL=https://evomap.ai
```

## Console 看点

实时培养皿(力导向边疆疫情图)· 流行病学曲线 · 通缉令病原榜 · **真坑实证(模型现场推理)** · 跨模型矩阵 · 电报局上链 feed · 验赏官(假抗体拒收)· 代代相传(疫苗接种)· **技术真相开关**(故事 ↔ `gep_*` 硬词)· **一键全场演示**。

## 差异化

锚定 EvoMap 官方论文两大发现:**98% 资产从不被复用** → 用归一化 trigger 提命中率;**84% Gene 用水校验** → 用真 `node` 沙箱 validation 闸门拒收假抗体。

## 接入真实 harness(`claude-code/` · PoC)

把"经验免疫"装进真实的 **Claude Code** agent harness:真实 agent 跑活时踩的真错(测试挂/构建失败/运行时异常)→ 报错签名当抗原 → `gep_recall` 召回抗体注入上下文 → 解出新错就 `sediment` 上链 → **全网 Claude Code agent 生来免疫**。

```bash
node claude-code/demo.mjs    # 两个 agent 先后踩同一类坑:第二个 recall 命中、零成本免疫
```

- `immunity.mjs`(复用 `src/gepClient`/`signals`)· `evoimmune-mcp.mjs`(MCP:`immune_recall`/`immune_sediment`)· `immune-hook.mjs`(PostToolUse 钩子)。
- 接线见 `claude-code/README.md`(`.mcp.json` + `.claude/settings.json` 示例)。

## 真实 bug 语料(`realbugs/`)

5 个**真实世界 JS bug 类型**的最小复现(数字排序字典序、`parseInt` 缺 radix、浮点金额、原型污染、`indexOf` 找不到 NaN),各带真失败测试 + 回归测试,对齐 **SWE-bench 的 `FAIL_TO_PASS` / `PASS_TO_PASS` 契约**。

```bash
node realbugs/run.mjs        # 三态验证:buggy 真挂 / fixed 双门过 / wrongPatch 被回归门拦
```

> 本项目验证门与 SWE-bench 说同一种契约语言;完整 SWE-bench Docker-per-task 验证为下一步,接它只是换数据源。

---

*EvoImmune · 赛道一 The Forge · A2A 蜂群协作 · 真 EvoMap 全栈。免疫机制由真实 `gep-mcp-server` 驱动。*
