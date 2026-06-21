# EvoMap 技术栈速查 + 赛道一(The Forge · A2A 蜂群协作)方案

> 整理时间:2026-06-19 · 黑客松「Beyond the Maze」· 赛道:**The Forge — A2A 蜂群协作**
> 资料来源:evomap.ai 官网(已登录浏览器实读)、evomap.ai/skill.md、GitHub 组织 EvoMap 各仓库 README(关键安装命令已逐条复核)、官方论文。
> 置信度标注:✅=本人直接核对 / ◑=子 agent 读 README 转述,接入时以仓库为准。

---

## 0. 一句话定位
EvoMap = **"Agent 经验的 Git"**。本地 **Evolver** 把一个 agent 踩的坑/成功路径沉淀成带"触发条件 + 校验命令"的 **Gene/Capsule**,push 到中心 **Hub**,经 **GDI 质量闸门**晋升后,**任何 agent 命中同一触发签名即可"继承"** → "One agent learns, a million inherit."

官网核心数据(✅ 首页实读):Total Tokens Saved **190.7B** · Assets Published **1.1M** · Search Hit Rate **96.24%** · Solved & Reused **20.0M**。首页顶部横幅:**"Open Source Rewards Are Live. Open source in. API credits out."**(开源换 API 积分,对应手册里"提交 2-star 项目得额外积分")。

---

## 1. 技术栈全景(GitHub 组织 EvoMap)

| 仓库 | 作用 | 置信 |
|---|---|---|
| `EvoMap/evolver` ⭐ | 进化引擎核心(CLI/daemon,GPL-3.0) | ✅ |
| `EvoMap/gep-mcp-server` | 把进化能力以 MCP 工具暴露给任意 MCP 客户端 | ✅ |
| `EvoMap/gep-sdk-js` | GEP 协议层 JS SDK(资产 ID / 规范化 JSON,无算法) | ◑ |
| `EvoMap/atp-sdk-js` | Agent Transaction Protocol(A2A 经济结算层) | ◑ |
| `EvoMap/developers` | OAuth2 开发者平台(第三方/agent 接入) | ◑ |
| `EvoMap/evolver-claude-code-plugin` | 接 **Claude Code**(我们主力) | ✅ |
| `EvoMap/evolver-codex-plugin` | 接 Codex | ◑ |
| `EvoMap/evolver-cursor-plugin` | 接 Cursor(带自动 hooks) | ◑ |
| `EvoMap/evolver-antigravity-plugin` | 接 Antigravity | ◑ |
| `EvoMap/evolver-workbuddy-plugin` | 接 WorkBuddy/CodeBuddy | ◑ |
| `EvoMap/pdf2gep` · `skill2gep` | 把 PDF / 技能蒸馏成 GEP 资产 | ◑ |
| `EvoMap/awesome-agent-swarm` | 蜂群框架清单 + EvoMap 自定位 | ◑ |

GEP = **Genome Evolution Protocol(基因组进化协议)**。

---

## 2. 核心数据模型(经验如何被表示)

- **Gene(基因)**:抽象"行为蓝图"——精简、可复用的进化单元,带前置条件、约束、**validation 校验命令**;编码"反复出现的修复/优化模式"。
- **Capsule(胶囊)**:在父 Gene 指导下的**具体实现**。三个关键字段:
  - `content`(核心逻辑/代码)
  - `trigger`(**复用触发条件**,如某条 stack trace 签名)← 跨 agent 继承的入口
  - `metadata`(历史表现/打分)
- **EvolutionEvent(进化事件)**:不可篡改审计日志,把每次变更链到父 Gene(写 `events.jsonl`)。
- 本地资产路径(◑):`<workspace>/.evolver/gep/{genes.json, capsules.json, events.jsonl}`
- 资产 ID = 规范化 JSON 的 SHA-256(`computeAssetId`),保证跨 runtime 一致。

---

## 3. A2A 经验共享机制(赛道一核心)

**模型:Hub 中介的"发布—发现—拉取",不是点对点 push。** 论文类比:*每个 agent 本地有 Evolver,像 Git client 把 repo push 到中心 GitHub server。*

流程:
```
Agent A 本地进化 → 沙箱校验(validation) → 发布 Gene/Capsule 到 Hub
         → GDI 质量闸门晋升 → 全网可发现
Agent B 命中相同 trigger 签名 → 从 Hub 检索 Capsule → 直接套用
```

进化生命周期(`evolver` 五阶段 ✅):
1. **Signal Extraction** — 扫 `./memory/` 日志与错误模式
2. **Gene/Capsule Selection** — 用信号匹配本地/网络已有资产
3. **Prompt Generation** — 输出协议绑定的 GEP prompt 到 stdout(**不自动改代码**)
4. **Validation / Solidify** — 跑 Gene 的校验命令(白名单仅 `node/npm/npx`,禁 shell 操作符,超时 180s)← 质量闸门
5. **Event Recording** — 写 EvolutionEvent

**网络三角色**:
- **Proposer/Publisher** — 生成并上传资产
- **Validator(默认开)** — 每个联网节点都是去中心校验者,拉校验任务、沙箱跑命令、回执,赚 credits/reputation
- **Reuser** — 按 trigger 匹配检索复用

**GDI(Genetic Desirability Index)质量闸门**(◑,来自论文):
`GDI = 0.35·Intrinsic + 0.30·Usage + 0.20·Social + 0.15·Freshness`,**GDI ≥ 25** 才从候选池晋升为全网可见。

**Worker Pool**:`WORKER_ENABLED=1` 的节点经 heartbeat 广播能力,从网络待办队列原子领任务。

---

## 4. 接入流程(逐字命令,已复核)

### 4.1 注册节点(skill.md / GEP-A2A v1.0.0 ✅)
把 `https://evomap.ai/skill.md` 内容发给 agent 即可引导注册。机制:
1. 先查本地凭据:`~/.evomap/node_id`(以 `node_` 开头)、`~/.evomap/node_secret`(64 位 hex)、OS keychain、`EVOMAP_NODE_ID` 环境变量。
2. 无则注册 → Hub 返回 `your_node_id` / `node_secret` / `claim_url`。
3. 打开 `claim_url` 把节点绑定到 EvoMap 账户(**用报名邮箱注册的账户**)。
4. 保活:每 ~5 分钟 heartbeat(15 分钟无活动判离线)。
- Hub:`https://evomap.ai`;协议:`GEP-A2A v1.0.0`。
- 安全:`node_secret` 绝不入 chat/log/git;文件 `0600`、目录 `0700`。

### 4.2 装进化引擎(✅)
```bash
npm install -g @evomap/evolver     # Node.js >= 18,工作区需 git init
evolver --help
```
核心命令:`evolver`(单次)、`evolver --review`(人在环)、`evolver --loop`(常驻 daemon)、`evolver setup-hooks --platform=<name>`(接 agent runtime)、`evolver fetch --skill <skill_id>`(从网络下载技能)。

工作目录 `.env`(✅):
```bash
A2A_HUB_URL=https://evomap.ai
A2A_NODE_ID=your_node_id_here
EVOLVE_STRATEGY=balanced          # balanced|innovate|harden|repair-only
WORKER_ENABLED=1
WORKER_DOMAINS=repair,harden
WORKER_MAX_LOAD=5
EVOLVER_VALIDATOR_ENABLED=1       # 默认 ON
MEMORY_DIR=./memory
```
> 注:Hub 连接对核心进化**非必需**;蜂群/网络特性才需要。

### 4.3 接 Claude Code(主力,✅)
```
/plugin marketplace add EvoMap/evolver-claude-code-plugin
/plugin install evolver@evolver
```
Slash 命令:`/evolver:evolve` `/evolver:search` `/evolver:status` `/evolver:run` `/evolver:solidify` `/evolver:review` `/evolver:sync` `/evolver:distill`
环境变量:`EVOMAP_PROXY_PORT=19820`、`A2A_HUB_URL`/`A2A_NODE_ID`、`EVOMAP_HUB_URL`/`EVOMAP_API_KEY`/`EVOMAP_NODE_ID`(开启 Hub 记录)。要求 Node≥18 + Git。

### 4.4 通用 MCP 接入(任意 MCP 客户端,✅)
```bash
npm install -g @evomap/gep-mcp-server   # 或 npx @evomap/gep-mcp-server
```
MCP 配置:
```json
{
  "mcpServers": {
    "gep": {
      "command": "npx",
      "args": ["@evomap/gep-mcp-server"],
      "env": {
        "GEP_ASSETS_DIR": "/path/to/your/gep/assets",
        "GEP_MEMORY_DIR": "/path/to/your/memory/evolution"
      }
    }
  }
}
```
环境变量:`GEP_ASSETS_DIR`、`GEP_MEMORY_DIR`、`EVOMAP_API_KEY`、`EVOMAP_NODE_SECRET`、`EVOMAP_NODE_ID`、`EVOMAP_HUB_URL`。
**15 个 MCP 工具**:`gep_evolve` `gep_recall` `gep_record_outcome` `gep_list_genes` `gep_install_gene` `gep_export` `gep_status` `gep_search_community`(本地/读) + `gep_publish_bundle` `gep_publish_skill` `gep_submit_validation_report` `gep_revoke` `gep_identity` `gep_audit` `gep_protocol_info`(发布/共享)。

### 4.5 Token / 积分(✅ 手册)
- 用报名邮箱注册 EvoMap → 微信告知群主 **Nedtric@evomap.ai** → 充值 Quota。
- 在 `https://evomap.ai/zh/account/api-manage` 查看,正常发放约 **0.94 亿额度(≈188 元)**;拿 API Key 后填入 agent 软件。
- CC Switch 接入:Opus/Sonnet/Haiku 三个位置可随意填模型,请求地址按手册 PDF 1:1 填,仅换自己的 API key。

---

## 5. 评分标准对齐(4 维)
1. **EvoMap 融合度** — 是否深度巧妙用了经验共享机制?进化是否肉眼可见?
2. **技术创新性** — 架构 / 提示词工程 / 底层逻辑是否有新意?
3. **商业/应用潜力** — 需求是否真实?能否落地/商业化?
4. **完成度与表现力** — Demo 是否流畅?路演是否清晰契合主题?

---

## 6. ⚠️ 必须规避的坑(来自官方论文的批判性发现)
- **98% 的资产从不被调用**(仅 2% 被复用);但被复用的 Capsule **97% 成功** → 复用率低、命中即高价值。
- **66% 的 Gene 没有校验命令;84% 用 `console.log()` 之类水校验**绕过质量闸门 → 质量分可造假。
- 资产/收益高度集中(Top 10% agent 占 82% 晋升资产)。

→ **差异化得分点 = 给每个 Gene 写"真·validation"命令 + 提高 trigger 命中率**,正好打在论文揭示的两大痛点上。

---

## 7. 赛道一方案骨架(待与队友敲定方向)

**目标**:N 个异构/同构 agent 各自干活,把经验沉淀为 Gene/Capsule,经 Hub 让全队"即沉淀即继承",可视化展示"群体进化"。

**架构(Hub 星型 + 本地 Evolver)**:
```
[Claude Code] [Codex] [Cursor] ...   ← 多 worker 节点(可分工:repair/harden/innovate)
   plugin       plugin   plugin
     │ 本地 .evolver/gep  本地 memory_graph
     └──── EvoMap Proxy (:19820, MCP 桥) ────┐
                                             ▼
                  A2A_HUB_URL=https://evomap.ai (中心 Hub)
        候选池 → GDI≥25 晋升 → 全网可发现 ; Validator 沙箱回执
```

**落地步骤**:
1. 每 agent 用报名邮箱注册节点,拿 `NODE_ID`/`API_KEY`。
2. 每节点装 `@evomap/evolver`(+ 对应插件),统一 `.env` 指向同一 Hub。
3. 用角色分工:`EVOLVE_STRATEGY=repair-only / harden / innovate` 做修复型/加固型/创新型 agent。
4. 经验回流闭环:成功 → `gep_publish_bundle` 发布;他节点 sessionStart 自动注入近期成功经验 + `evolver sync` 拉全网资产。
5. **强制真 validation** + trigger 命中可视化 = 差异化。

**3 个候选项目方向(待选)**:
- A.「**经验免疫蜂群**」:多 agent 修同类 bug,第一个踩坑后其余"天生免疫"——现场可视化 trigger 命中率随时间上升。
- B.「**跨模型经验迁移**」:GPT/Claude/Gemini 三种 agent 互相继承对方的 Capsule,证明经验跨模型可迁移。
- C.「**真·质量闸门蜂群**」:针对论文"84% 水校验"痛点,做一个强制可信 validation + 共识投票的高质量经验网络。

---

## 8. 关键链接
- 官网:https://evomap.ai · 接入说明:https://evomap.ai/skill.md · 积分管理:https://evomap.ai/zh/account/api-manage
- 作品提交:https://hackathon.evomap.ai · 队长报名问卷:https://autogame.feishu.cn/share/base/form/shrcn3Nw9HmpdwKIZRcBMrTw8Mf
- GitHub:https://github.com/EvoMap · 核心:https://github.com/EvoMap/evolver · MCP:https://github.com/EvoMap/gep-mcp-server
- Claude Code 插件:https://github.com/EvoMap/evolver-claude-code-plugin
- 群主微信邮箱备注:Nedtric@evomap.ai · WiFi:EvoTavern进化酒馆(数字)/ EvoTavern0619

---

## 9. 终版决策(solo · 经验免疫蜂群)
- **方向**:经验免疫蜂群(Direction A)——扣手册"群体免疫"命题。
- **团队**:1 人,全权委托 → 按单人可完成范围裁剪 MVP。
- **节点**:同构,全部 Claude Code(多 agent run 共享同一 EvoMap 账户/Hub)。
- **任务域**:**代码修复,JS/Node 任务**,validation = `npm test` / `npx jest`。
  - 关键约束:evolver 校验命令**白名单只允许 `node`/`npm`/`npx` 前缀**,180s 超时,禁 shell 操作符 → JS 任务是唯一天然契合,"真 validation"差异化点天然成立。
- **trigger 设计**:归一化错误指纹(异常类型 + 消息词干 + 涉及符号)作为 Capsule 的 `trigger`,提高跨 agent 命中率(反击论文"98% 从不复用")。
- **去风险**:evolver 核心离线可用;real Hub(A2A)用于评分维度①的头条,**本地共享资产库**作为 Demo 兜底备份(Hub/积分系统手册已知有 bug)。

### 分层交付(critical path)
- **L0 必达(Day1)**:单 agent 端到端跑通 EvoMap——注册节点→`/evolver:evolve`→`gep_publish_bundle`→另一 run `gep_recall` 命中并复用。证明往返闭环。
- **L1 核心 Demo(Day2)**:埋坑任务集(5–8 个,≥2 个 trap family 共享同 trigger)+ 蜂群 harness + 免疫 ON/OFF 对照跑批 + 指标采集。
- **L2 加分(Day2–3)**:Web 仪表盘(抗体传播动画 + 免疫覆盖率↑/重复犯错↓曲线 + token 省量)+ 真 validation 闸门 + "假抗体被 Validator 拒收"彩蛋。
- **L3 拉伸(余力)**:并行多 agent;跨模型(Codex/Cursor)继承。

### 埋坑任务集设计(trap families)
每个 family 多个任务共享同一报错指纹,免疫才肉眼可见:
- F1 依赖 API 变更:如 `pandas.append`→`pd.concat`(JS 版可用某 npm 库的 breaking change),trigger=`AttributeError/TypeError: ... append`。
- F2 时区/日期 footgun。
- F3 经典 off-by-one。
- F4 async/await 误用。
每任务 = 小 repo + 一个失败的 jest 测试(= validation 命令)。

### 接入待办(只有你能做)
1. 用**报名邮箱**注册 EvoMap 账户。
2. 微信加群主 `Nedtric@evomap.ai` 充 Quota。
3. 到 https://evomap.ai/zh/account/api-manage 取 API Key + Node 凭据,回填 `.env`。

---

## 10. 集成契约(已核真实源码,SCHEMA_VERSION=1.11.0)

### ⚠️ 三个关键纠正(README 是错的/我之前理解有偏)
1. **validation 白名单只有 `node`,不是 `node/npm/npx`!**(`evolver/src/gep/validator/sandboxExecutor.js`:`ALLOWED_EXECUTABLES=new Set(['node'])`,npm/npx 因 lifecycle 脚本风险被移除)。还禁 `-e/-p/-r/--require/--import` 等内联 eval,`node` 必须带脚本文件;`shell:false`;禁 shell 元字符 `| & ; > < \` $`;超时 单命令 60s/上限 120s、整批 180s。
   → **trap 任务的 validation 命令必须是 `node test.js`**(纯 node 测试脚本,失败 exit≠0),**不能用 `npm test`/`jest`**。
2. **`trigger` 是字符串数组,不是对象**,匹配是**模糊 token 匹配**:每个 trigger 串支持 `/正则/flags`、`a|b`(任一)、或大小写不敏感子串;**任一 trigger 命中任一 signal 即算命中**(布尔)。不是精确指纹。→ trigger 写成一组关键词/正则,如 `["is not a function","TypeError.*append","ECONNRESET"]`,命中率反而更好做。
3. **本地/远程判定**:`IS_REMOTE` 当且仅当 `EVOMAP_NODE_ID` 且(`EVOMAP_API_KEY` 或 `EVOMAP_NODE_SECRET`)都在;否则纯本地。

### 数据 schema(必填字段)
- **Gene**(required):`type:"Gene"`、`schema_version`、`id`、`category`(repair/optimize/innovate/explore)、`signals_match:string[]`、`strategy:string[]`、`constraints:{max_files,forbidden_paths[]}`、`validation:string[]`(放 `["node test.js"]`)、`asset_id`。
- **Capsule**(required):`type:"Capsule"`、`schema_version`、`id`、`trigger:string[]`、`gene`(父 gene id)、`summary`、`confidence:0~1`、`blast_radius:{files,lines}`、`outcome:{status,score}`、`asset_id`。`content` 是自由对象或 null;没有顶层 `metadata`(对应的是 source_type/cost_tokens/proof_of_work 等可选字段)。
- `asset_id` = `"sha256:"+sha256(canonicalize(去掉asset_id的对象))`;**必须用 sdk 的 `canonicalize`(按 key 字母序),不能用原生 JSON.stringify**。

### 工具:本地 vs 远程(决定烧不烧赞助额度)
| 工具 | 本地? | 备注 |
|---|---|---|
| gep_evolve / gep_recall / gep_record_outcome / gep_list_genes / gep_install_gene / gep_status / gep_export | ✅纯本地 | 只读写 `GEP_ASSETS_DIR`/`GEP_MEMORY_DIR`,零网络零 key |
| gep_search_community | ◑ 半本地 | 连 `evomap.ai/a2a/assets/semantic-search`,**不需 key**,仅需网络;query≥2 字符 |
| gep_publish_bundle / gep_submit_validation_report | ❗必须远程 | 需 NODE_ID + (API_KEY 或 NODE_SECRET),POST `/a2a/publish`、`/a2a/report` |

- 本地 `recall`:对 memory_graph 事件做 **Jaccard ≥ 0.2** signal 相似度过滤。
- 本地 `record_outcome`:写 `memory_graph.jsonl`;若 `status='success' && score≥0.5` → **自动 upsert 一条 capsule** 到 `capsules.json`(这就是本地免疫闭环的关键!)。
- `publish_bundle`:发 a2a 信封 `{protocol,protocol_version,message_type:'publish',message_id,sender_id,timestamp,payload}`,`payload.assets=[Gene,Capsule,(可选 EvolutionEvent)]`,客户端**不拦 0.7 阈值**(若有在 Hub 服务端)。

### 目录约定(两仓库默认值不同,务必显式设)
- gep-mcp-server 默认 `assets/gep` + `memory/evolution`;evolver 默认 `.evolver/gep` + `memory`。
- → harness 里**显式 `GEP_ASSETS_DIR` 指向同一目录**,两侧别分叉。

### 终版集成架构
- **Harness = 真 gep-mcp-server 的 MCP client**(用 `@modelcontextprotocol/sdk` stdio),所有进化/recall/publish 都调真 EvoMap 代码,不自己复刻协议。
- **本地免疫闭环(离线,dev+大部分 demo)**:每任务先 `gep_recall` → 命中则继承(近零 LLM)→ `gep_record_outcome`;未命中则调模型解 → `gep_record_outcome(success,score≥0.5)` 自动生成 capsule → 下个任务 recall 命中。
- **Hub/A2A 头条(远程,test 时)**:成功的新解构造 Gene+Capsule → `gep_publish_bundle` 上真 Hub;`gep_search_community` 展示"从全网继承"(免 key)。
- **真 validation 闸门**:每个 Gene 的 `validation=["node test.js"]`,Validator 沙箱用纯 node 复跑 → 可信免疫(打论文 84% 水校验)。

### 待补
- `gep-mcp-server/src/protocol.js`(`stampAsset`/`validateGene`/`validateCapsule`)若 publish 校验失败再抓。
- evolver 的 `selector.js`/`memoryGraph.js` 是混淆代码,匹配细节以本地实跑 jsonl 为准。

---

## 11. 构建进度

**项目**:`evoimmune/`(Node ESM)。装了 `@evomap/gep-sdk@1.5.0`、`@evomap/gep-mcp-server@1.7.0`、`@modelcontextprotocol/sdk@1.29.0`、`@anthropic-ai/sdk@0.105.0`。
**实测**:真 gep-mcp-server 本地离线 record→recall **相似度 1.0 命中**(运行版 `schema_version=1.8.0`,17 个工具)。

**T0 ✅(离线零赞助跑通)**:
- 模块:`src/gepClient.js`(MCP client 包真 gep-server)、`signals.js`(归一化错误签名)、`pathogens.js`(3 病原家族 · 校验=`node test.cjs`)、`solver.js`(stub,留 LLM 接口)、`swarm.js`(免疫编排,免疫阈值 0.6 严于 gep 的 0.2)、`runDemo.js`(OFF/ON 对照)。
- 结果:24 任务 → **OFF=24 次 LLM 解;ON=3 次 LLM 解 + 21 次免疫继承(省 88%,≈37800 tokens)**。
- 驾驶舱:`cockpit/index.html`(已截图验证)——OFF 全琥珀 / ON 零号病人琥珀+其余绿✓,4 大指标 + ▶播放疫情时间轴 + 累计曲线。静态服务:`.claude/launch.json` 的 `cockpit`(python3 http.server 5173)。
- 跑命令:`node src/runDemo.js`(重算数据)。

**下一步**:T1 接真 Hub(`gep_publish_bundle`/`gep_search_community`)+ 疫苗接种 + 真 validation/假抗体拒收;T2 变异攻防 + 规模化;T3 跨模型免疫。
**待用户**:EvoMap key 回填(只 L0 真 Hub 那步才用)。

**已追加(离线零赞助,均实测 + 驾驶舱面板已验证)**:
- ⑦ 假抗体拒收 `src/trust.js`:注册中心投毒,盲信蜂群 18/18 假治愈 vs EvoImmune 拦截 18 伪抗体 / 18 真治愈 / 0 误判。打论文 84% 水校验。
- ⑤ 变异攻防 `src/variant.js`:野生株学会抗体 → 交叉株交叉免疫×3 → 逃逸株(变异 .add,recall sim 0.33<0.6 逃逸)造新抗体 → 加强针免疫×4,全程仅 2 次 LLM。展示 recall 模糊匹配泛化边界。
- 驾驶舱 `cockpit/index.html` 已加这两个面板(eval 验证渲染正确)。

**已全部完成(离线零赞助,均实测 + 驾驶舱面板验证)**:
- 病原工厂扩到 **6 家族**(append/length/tostring/touppercase/indexof/const-reassign,校验均 `node test.cjs`)。
- 💉 疫苗接种 `src/vaccinate.js`:第一代 6 次 LLM 学会 → 第二代接种 **0 次 LLM、24 生来免疫**;未接种对照重付 6 次。
- ⚔️ 规模化 `src/scale.js`:**180 任务 · 64 节点 · 省 97% · ≈313,200 tokens**(驾驶舱顶部战报横幅)。
- 真 LLM solver 接口 `src/llmSolver.js` + `makeSolver()`:默认 stub 离线;设 `EVOIMMUNE_SOLVER=llm`(+key/网关)即切真模型,只在"未命中"烧额度。
- ⚡ 性能修复:gepClient 改 `node <入口>` 启动(绕开 npx 联网),全量构建 **29min → 86s**。

**仅剩需 key / 测试时的**:③ 真 Hub `gep_publish_bundle`(A2A 头条)· 真模型解题(`EVOIMMUNE_SOLVER=llm` + 网关地址)· ⑥ 跨模型免疫 · 路演叙事/PPT。
**一键重算**:`node src/runDemo.js`(86s)→ 驾驶舱看全部六屏。

---

## 12. 真实模型接入(已通 ✅)
- **网关**:`https://api.evomap.ai/v1`,**OpenAI 兼容** Chat Completions(`/chat/completions`),认证 `Authorization: Bearer sk-evomap-<KEY>`。
- **Gateway Key**:已在 api-manage 新建(名 `evoimmune`),完整密钥存 `evoimmune/.env`(gitignore 忽略,勿外传)。额度 9400 万。
- **模型 id 形如 `evomap-<名>`**;已绑 6 模型:`evomap-gemini-3.1-pro-preview`(默认/已验证)、DeepSeek V4 Flash(最省 425/850·1K)、Claude Opus 4.7、GLM 5.1、GPT 5.5、Kimi K2.6。
- **代码**:`src/llmSolver.js` 已改为 OpenAI fetch 格式;`.env` 里 `EVOIMMUNE_SOLVER=llm` 即全局切真模型(naive 仍可按需保持 stub 省额度)。
- **已验证**:`scripts/verify-llm.js`(1 次真调,PASS,354 tokens);`scripts/real-proof.js`(12 任务,真模型解 3 零号病人=1149 tokens + 9 免疫继承),驾驶舱顶部有"真实模型实证"徽章(`cockpit/data/realproof.json`)。
- **注意**:Gateway Key ≠ A2A Hub 节点凭据;真 Hub 发布 `gep_publish_bundle` 仍需 `EVOMAP_NODE_ID`+`EVOMAP_NODE_SECRET`(另行注册 A2A 节点)。
- **省额度建议**:大批真跑时把 `EVOIMMUNE_MODEL` 换成 DeepSeek(`evomap-deepseek-v4-flash`,最省)。

---

## 13. 真 Hub 上链(A2A,已通 ✅)
- **节点注册**:`POST https://evomap.ai/a2a/hello`(body 见 `scripts/register-node.js`)→ 返回 `your_node_id`/`node_secret`/`claim_url`(都在 `payload` 里)。节点 `node_f3d62089a8320468`(名 evoimmune),凭据存 `~/.evomap/`(0600)+ `.env` 的 `EVOMAP_NODE_ID`/`EVOMAP_NODE_SECRET`。
- **认领绑定**:浏览器打开 `claim_url` → Confirm Claim → "Agent claimed",绑定到账户。
- **发布**:`scripts/publish-antibody.js` 远程模式(node_secret 认证)调 `gep_publish_bundle` → 抗体 **Gene+Capsule+EvolutionEvent** 上 evomap.ai。结果 `bundle_83fa523165b26af2`,首发 **quarantine/safety_candidate**(候选池待 GDI 晋升),重发 `already_published`(去重=确认在链)。驾驶舱顶部"已上链"徽章(`cockpit/data/publish.json`)。
- **关键坑(已踩平)**:① publish 认证用 **node_secret**,不是 Gateway Key;② Hub `validateGene`:strategy ≥2 步、每步 ≥15 字;validation 必须**自包含 `node -e`**(不能依赖本地文件 `node test.cjs`),且**不能含分号**(`;` 触发 `validation_command_dangerous`);③ Capsule 必须有 `env_fingerprint{platform,arch}` + 实质内容(`code_snippet`/`strategy` 任一)。
- **脚本**:`register-node.js`(注册)、`publish-antibody.js`(发布)、`verify-llm.js`(1 次真解)、`real-proof.js`(真实免疫)、`cross-model.js`(跨模型)。

## 14. 完成度总览
七大子系统 + 真模型解题 + 跨模型免疫 + 真 Hub 上链 **全部完成且实测**。驾驶舱顶部三连证:省97%战报 / 真实模型实证 / 已上链 Hub。**仅剩路演 PPT 与叙事。**

