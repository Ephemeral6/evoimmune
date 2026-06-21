# EvoImmune Colony · 蜂群协作 = 共享生长的项目知识池

> 更大的 claim:**不是 5 个 agent 修同一个一行 bug,而是 4 个 subagent 在一个复杂 Web API 项目上各做不同 handler、共享一个不断生长的「项目特有经验(约定)」知识池来协作 —— 越往后越省。**

一个真实软件项目的难点,往往不在某个孤立 bug,而在那些**非显而易见的项目约定**:
"金额要存整数分"、"日期要走 toISO()"、"跑测试前先跑 codegen"、"handler 要 asyncHandler 包"。
一个新接手的 agent 不可能凭空知道,只能 debug 多步才发现。
当 4 个 subagent 各领一个 handler 并行开发时,朴素做法是**每人把同样的项目约定重新踩一遍**;
而接入「经验免疫」后,**第一个发现某约定的 subagent 把它沉淀进共享知识池,后面的 subagent 命中即继承、零成本**。

## 题面项目:`project/`(一个真实 Orders Web API)

`project/` 是个自包含、零依赖的订单微服务,要实现 4 个 handler。里头**焊了 4 条非显而易见的项目约定**,
违反每条产生**各异的真实测试报错**(详见 `project/CONVENTIONS.md`,那是给 runner / 评审看的"真相档",不给被测 agent):

| 约定 | 内容 | 违反时的稳定报错短语 |
| --- | --- | --- |
| **G1** | handler 必须 `asyncHandler` 包裹再注册 | `handler must be wrapped with asyncHandler` |
| **G2** | 跑测试前必须先 `node build/codegen.cjs` 生成校验器 | `Cannot find module ...generated/validators` |
| **G3** | 金额一律存整数分(走 `toCents`) | `amount must be integer cents` |
| **G4** | 日期一律走 `toISO()`,输出 ISO-8601(带 Z) | `date must be ISO-8601` |

**约定 × handler 矩阵**(每个 subagent 领一个 handler,需要踩通这几条):

| handler | 需要的约定 |
| --- | --- |
| `createOrder` | G2 + G1 + G3 |
| `getOrder`    | G2 + G1 + G4 |
| `listOrders`  | G2 + G1 + G4 |
| `refundOrder` | G2 + G1 + G3 |

> G2 是"前置闸门"(4 个 handler 都 require 生成的校验器),G1 是"全局闸门"(4 个都要包),
> G3/G4 按业务分流(金额类 vs 日期类)。去重后**全项目只有 4 条约定**,但朴素蜂群会把矩阵里 **12 个约定点**全踩一遍。

## 确定性 runner:`run.mjs`

按约定矩阵模拟"4 个 subagent 各领一个 handler",跑**两轮对照**(都用 `os.tmpdir()` 下的隔离临时免疫库 +
真实 gep 召回/沉淀,跑完清理,不污染共享库 `claude-code/.immunedata/`):

- **A. 朴素蜂群(无共享)**:每个 subagent 各自独立踩它 handler 需要的每一条约定 →
  每条都算一次"经验发现(解题)"。总发现 = 3+3+3+3 = **12**。
- **B. 免疫蜂群(共享)**:按 `createOrder → getOrder → listOrders → refundOrder` 顺序,每个 handler
  需要的每条约定先 `recallImmunity` 查库 —— **命中=继承(零成本)**,**未命中=发现(解题一次)+ `sedimentAntibody` 沉淀**。
  - `createOrder` 发现 G2/G1/G3(库空,3 个新)
  - `getOrder` 继承 G2/G1,只新发现 G4
  - `listOrders` 继承 G2/G1/G4(全继承)
  - `refundOrder` 继承 G2/G1/G3(全继承)
  - → 总发现 = **4**(去重后的约定数),继承 = **8**。

```bash
# 在 evoimmune/ 目录下
node claude-code/colony/run.mjs
```

### 关键机制:同一约定、不同 handler、不同报错细节 → 命中同一抗体

召回/沉淀用的是**真实报错文本**(CONVENTIONS.md 的签名,带括号细节,逐 handler 可变,例如
`amount must be integer cents (refunded is not an integer)` vs `(stored amount is not an integer)`)。
`../immunity.mjs` 做了**经验级归一化**(把 `稳定短语 (可变细节)` 的括号细节剥掉),
所以**同一条约定在不同 handler 上(报错细节不同)命中同一抗体** —— 这正是"跨 handler 继承"为真的根因。
runner 直接把真实报错文本传进去即可,不必自己归一化。

### 真实性锚点(runner 里真跑,不靠模拟)

1. **约定是真的**:runner 先删掉 `project/generated/`(codegen 产物,gitignored),
   `HANDLERS_DIR=gold node test/run-tests.cjs` → **4 个全 FAIL**(G2 真报错,exit 1);
   再 `node build/codegen.cjs` 后跑同样命令 → **4 个全 PASS**(exit 0)。两步真实结果打进输出,跑完还原 `generated/`。
2. **召回命中是真的**:免疫轮每次"命中"的相似度/置信/综合分都来自**真实 gep 召回**(本地 EvoMap gep-mcp-server),
   不是写死的(实测 sim 1.00 · conf 0.90 · score 0.90)。

### 输出包含

- 逐 subagent 叙事(发现了哪几条新约定、继承了哪几条,体现越往后越省)。
- 对照表(朴素 vs 免疫:总发现 / 总继承 / 省下的发现)。
- 真实验证块(无 codegen 全挂、有 codegen + gold 全过,贴真实 exit/结果)。
- 结尾**诚实声明**:哪些是真的(gep 召回/沉淀、最终测试真跑真过、约定真报错),哪些是"对开发过程的建模"(逐约定发现顺序)。

---

## Live 体验:让真实 Claude Code 用 4 个 subagent 跑这个项目

装上 evoimmune 的 **MCP server**(`immune_recall` / `immune_sediment`)+ **PostToolUse 钩子**(命令失败时自动召回注入),
"踩约定报错 → 召回 → 继承 / 第一个解出就沉淀"这套就**自动发生**。接线见 `../README.md`(`.mcp.json` + `.claude/settings.json`,
把 `<EVOIMMUNE>` 换成本机绝对路径 `/Users/ephemeral/进化酒馆/evoimmune`)。

> 演示前请先确认 `project/generated/` 已删除(`rm -rf project/generated`),让 subagent 真切踩到 G2 前置闸门。

### 可直接发给 Claude Code 的任务提示词

> **任务:实现 `claude-code/colony/project/src/handlers/` 下的 4 个 handler,让测试全过。**
>
> 这是一个订单 Web API(`project/`,CommonJS、零依赖)。请**派 4 个 subagent 并行**,各负责一个 handler:
> 1. `createOrder.cjs`(POST /orders)
> 2. `getOrder.cjs`(GET /orders/:id)
> 3. `listOrders.cjs`(GET /orders)
> 4. `refundOrder.cjs`(POST /orders/:id/refund)
>
> 每个 subagent 的验收:`node test/<handler>.test.cjs` 通过(默认 `HANDLERS_DIR` 跑自己 `src/handlers/` 下的实现,
> 不是 gold)。**严禁查看 `project/gold/` 和 `project/CONVENTIONS.md`** —— 那是答案与真相档,看了就不算"自主发现"。
> 只读 `project/README.md`、`project/src/` 下的零件(`server.cjs` / `money.cjs` / `dates.cjs` / `store.cjs`)、`project/test/*.test.cjs`(测试即真相)。
>
> **协作纪律(关键)**:这个项目有几条非显而易见的约定,违反会让测试报特定错误。每次某个命令/测试**失败**时:
> - **先 `immune_recall`** 把报错文本查一遍。若命中,直接套用返回的修复,别重新 debug —— 那是别的 subagent 已经替全群踩过的坑。
> - 若未命中,自己 debug 解出来;**确认测试通过后**,用 `immune_sediment` 把「报错文本 → 你的修复」沉淀进共享免疫库,
>   这样后面接手别的 handler 的 subagent 就能直接继承,不必重踩。
> - 装了 evoimmune MCP + PostToolUse 钩子后,命令失败时还会**自动召回**并把抗体注入你的上下文。
>
> 期望现象:第一个 subagent 会撞上几条约定(如"先跑 codegen"、"asyncHandler 包裹"、"金额整数分"/"日期 ISO"),
> 解出后沉淀;后续 subagent 接手别的 handler 时,对**同样的约定**直接召回命中、零成本继承,只需自己发现本 handler 独有的那条。
> 最后 `node test/run-tests.cjs` 应 `ALL PASS`(记得先 `node build/codegen.cjs`)。

### 这条 live 提示词与 `run.mjs` 的关系

`run.mjs` 是**确定性对照**:用约定矩阵精确编排发现顺序,隔离变量、保证可复现的数字(朴素 12 / 免疫 4+8)。
上面的 live 提示词是**同一套机制的真实跑法**:真实 Claude Code 的发现顺序可能不同(取决于哪个 subagent 先撞哪条约定),
但"第一个发现、其余继承"的免疫机制与 `run.mjs` 完全一致 —— 因为两者都走同一份 `../immunity.mjs`(同一个 gep、同一套归一化)。

## 不改题面

本目录只新增 `run.mjs` 与本 `README.md`。**不改 `project/` 下任何文件**(那是题面,得保持"带坑")。
`run.mjs` 在真实验证时会临时删除并还原 `project/generated/`(它是 codegen 产物、被 `.gitignore` 忽略,不属于源文件)。
