# 🧬 EvoImmune · 经验免疫蜂群

> **一个 agent 学会,百万 agent 生来免疫。**
>
> EvoMap「进化酒馆」第三届 Agent 黑客松 · 赛道一 **The Forge / A2A 蜂群协作**

把"经验共享"做成"**群体免疫**":一个 agent 踩过的坑,被压缩成带报错指纹的「抗体」(EvoMap **Capsule**),经 EvoMap Hub 共享;其他 agent 命中同一指纹就 **生来免疫**——不再重犯、不再烧 token。

整套免疫机制 **全部由真实 EvoMap 驱动**(`gep_recall` / `gep_record_outcome` / `gep_publish_bundle`),不是模拟:真模型解题、跨 6 模型继承、真 A2A 节点上链,均已跑通且可现场互动。

---

## 它为什么不是玩具

| 维度 | 实证 |
|---|---|
| **真模型** | Gemini 3.1 Pro 经 EvoMap 网关真解两个**真实逻辑 bug**(分页 off-by-one、发票折扣/税顺序——输出错误而非语法 typo) |
| **真上链** | 注册并认领真 A2A 节点 `node_f3d62089a8320468`,`gep_publish_bundle` 上 evomap.ai;实测有 `candidate` 也有 `accept / auto_promoted` |
| **跨模型继承** | Claude / GPT / Gemini / DeepSeek / GLM / Kimi —— 一家造抗体,6 家全继承(矩阵全绿) |
| **验证驱动** | 自建 `FAIL_TO_PASS + PASS_TO_PASS` 双门闸,过拟合补丁当场拦下,只有真治愈才允许沉淀成抗体 |
| **受控基准** | 180 任务 · 64 节点 · 6 病原家族 → 免疫前 180 次解,免疫后 **6** 次,**省 97% · ≈313,200 tokens** |
| **协同进化** | 模型一字不改,随抗体库变大:免疫命中率 66.7%→100%、token/任务 500→0 —— 能力增长来自 harness,而非换模型 |

## 核心回路

```
感染(命中 bug,报错=抗原)
   → 解题(大模型解 + 双门验证)
      → 沉淀抗体(打包成 EvoMap Capsule,经 GDI 质量门上链)
         → 群体免疫(他人 gep_recall 命中 → 零模型调用、零 token、秒级痊愈)
```

Agent Harness 7 阶段执行回路:**观察 → 构建上下文(免疫召回)→ 提案 → 执行 → 验证(双门)→ 反思 → 沉淀**。
能力 = 模型 × harness:模型负责"解得出",harness 负责"学得住、传得开、信得过"。

## 仓库结构

```
evoimmune/        系统本体(引擎 + Harness + 后端 + React 实时 Console)
  ├─ src/         7 阶段 harness、validator 双门、recall/反思/预算、真模型 solver、各场景
  ├─ server/      Fastify + WebSocket 实时推流(live / recorded)
  ├─ web/         React + Vite + Tailwind 实时 Console(进化酒馆·西部世界 美术)
  ├─ scripts/     真 EvoMap 验证脚本(recall / 跨模型 / 注册节点 / 上链 / 真 bug)
  └─ README.md    ← 完整文档:架构 / 跑起来 / 真实性证据
pitch/            路演 PPT + A4 作品海报(西部酒馆报刊风)
EvoMap技术栈与赛道一方案.md   技术栈调研 + 方案设计 + 进度日志
```

## 快速开始

```bash
cd evoimmune
npm install && npm --prefix web install

# 离线验证免疫闭环(零赞助消耗)
node scripts/verify-gep-local.js     # record → recall 命中
node src/runDemo.js                  # 全量离线 demo

# 实时 Console
node server/index.js                 # 后端 :8787
npm --prefix web run dev             # 前端 :5174 → 点「▶ 全场战役演示」
```

接真模型 / 真 Hub 时,在 `evoimmune/` 下按 [`.env.example`](evoimmune/.env.example) 建 `.env`(已 gitignore,绝不入库)。

完整文档见 **[evoimmune/README.md](evoimmune/README.md)**。

---

*赛道一 The Forge · A2A 蜂群协作 · 真 EvoMap 全栈。免疫机制由真实 `gep-mcp-server` 驱动。*
