# EvoImmune · 真实开发场景 demo:5 个 subagent 加排行榜函数,经验免疫让后来者「生来免疫」

一个**真实感的小项目**:数据看板要加 5 个排行榜/指标函数(`topN` / `rankByScore` /
`sortPrices` / `leaderboard` / `percentile`),每个都要对**数字数组**排序。它们都踩了同一个
JS 经典坑——

> `Array.prototype.sort()` 默认把元素转成字符串、按**字典序**比较:
> `[1, 10, 2].sort()` 得 `[1, 10, 2]` 而非 `[1, 2, 10]`。
> 数字排序必须传比较器:`arr.sort((a, b) => a - b)`(升序),降序 `(a, b) => b - a`。

这正是「派多个 subagent 并行开发」会反复撞上的那种坑:**第一个 subagent 踩了、解了,
后面的 subagent 如果各自重来,就是在重复试错烧成本。** 接入「经验免疫」后,第一个解出的
subagent 把「错误指纹 → 修复」沉淀成抗体,**后面的 subagent 生来免疫、命中即套用、跳过试错。**

## 这个目录有什么

```
scenario/
├── project/                  ← 真实感小项目:5 个待修的看板模块 + 各自真实测试
│   ├── topN.cjs / topN.test.cjs              取分数最高的前 N 名(降序)
│   ├── rankByScore.cjs / rankByScore.test.cjs 分数升序排行
│   ├── sortPrices.cjs / sortPrices.test.cjs   价格升序
│   ├── leaderboard.cjs / leaderboard.test.cjs 积分降序排行榜
│   └── percentile.cjs / percentile.test.cjs   p 分位数(先升序再取下标)
├── scenario.mjs              ← 场景驱动器:跑「免疫 OFF vs ON」两轮对照
└── README.md                 ← 本文件
```

- 5 个 `*.cjs` 模块内部都用了**错误的裸 `.sort()`**(字典序 bug)。
- 5 个 `*.test.cjs` 用**真实数据**断言正确的数字序:**buggy 版必挂、修复版必过**,
  可被 `node xxx.test.cjs` 单独验证(exit 0 = 过)。

## 跑场景驱动器(自包含,不依赖真 Claude Code)

```bash
# 在 evoimmune/ 目录下
node claude-code/scenario/scenario.mjs
```

它模拟「5 个 subagent 各领一个函数去实现/修复」,跑两轮对照:

- **A. 朴素蜂群(免疫 OFF)**:5 个 subagent 各自独立踩到同一类 `.sort()` 测试失败 →
  各自解题(一次有成本的解题)→ 各自修好。**总成本 = 5 次解题。**
- **B. 免疫蜂群(免疫 ON)**:subagent-1 踩坑 → 解题 → `sedimentAntibody` 沉淀抗体;
  subagent-2~5 踩**同类**失败 → `recallImmunity` **命中**(相似 1.00)→ 直接套用修复、
  跳过全部试错。**总成本 = 1 次解题 + 4 次零成本继承。**

每个模块都用**真实 validator**:把代码落盘到 `os.tmpdir()` 下的隔离工作区,连同 `project/`
里的真实 `*.test.cjs` 一起真用 `node` 跑——buggy 真挂、fixed 真过,不是纯打印。

> **隔离免疫库,不污染共享库。** 驱动器用 `connectGep({assetsDir, memoryDir})` 在
> `os.tmpdir()` 下开一个**临时 gep** 当免疫库,跑完整体清理。每次跑都是干净对照、可重复,
> 绝不写进真实共享库 `claude-code/.immunedata/`。

### 真实输出(对照表)

```
┌────────────────────┬─────────────┬─────────────┬────────────────────────┐
│ 指标               │ 朴素(OFF)   │ 免疫(ON)    │ 说明                   │
├────────────────────┼─────────────┼─────────────┼────────────────────────┤
│ 解题次数(烧成本)   │ 5           │ 1           │ 免疫只付第一次         │
│ 继承次数(零成本)   │ 0           │ 4           │ 召回命中直接套用       │
│ 省下的解题         │ —           │ 4           │ 5 → 1,省 4 次          │
└────────────────────┴─────────────┴─────────────┴────────────────────────┘
```

## 如何在你自己的 Claude Code 里用真实 subagent 体验

装好上一层 `claude-code/README.md` 里的两条接线——**evoimmune MCP**(agent 主动
`immune_recall` / `immune_sediment`)+ **immune-hook**(`PostToolUse`,命令失败时自动召回注入)——
之后让 Claude Code 派 subagent 真刀真枪实现这 5 个函数,**后面的 subagent 会自动 recall
命中、跳过重复踩坑**。

### 可直接发给 Claude Code 的任务提示词(原文复制即可)

```
请用 5 个 subagent 并行实现/修复 claude-code/scenario/project/ 下的这 5 个看板函数:
topN、rankByScore、sortPrices、leaderboard、percentile。每个 subagent 负责一个函数,
要求:实现后运行该函数各自的 *.test.cjs(例如 `node claude-code/scenario/project/topN.test.cjs`),
确认 exit 0 通过才算完成。

如果某个 test 因为「数字排序」失败,先调 evoimmune MCP 的 immune_recall 查一下群体免疫库里
有没有同类错误的抗体;命中就直接套用修复、不要自己从头试错。第一个解出该类错误的 subagent,
请在确认测试通过后调 immune_sediment 把「报错 → 修复」沉淀成抗体,后面的 subagent 就能召回命中。
```

预期现象:第一个跑到 `.sort()` 字典序失败的 subagent 召回**未命中**、自己解出并沉淀抗体;
之后其余 subagent 一撞同一类失败(`immune-hook` 会在命令失败时自动注入抗体上下文,或 subagent
主动 `immune_recall`),就**命中同一指纹**、直接套用 `(a,b)=>a-b` 比较器,跳过重复试错——
这就是「经验免疫」在真实 subagent 蜂群里的效果。

> 错误指纹由 `src/signals.js` 归一化:5 个函数、5 组不同数据、不同报错细节行,都会归并到同一
> 签名 `Error | numeric sort mismatch` → 高 recall 命中率,跨函数共享一份抗体。

## 验证

- `node claude-code/scenario/scenario.mjs` → 跑通 exit 0;朴素 5 次解题、免疫 1 解题 + 4 继承,
  对照数据与逐模块「buggy 真挂 / fixed 真过」均由脚本内置硬性判定。
- 每个模块可单独验证:`node claude-code/scenario/project/<名>.test.cjs` —— buggy 版 exit 1(真挂),
  改成带比较器的 `.sort()` 后 exit 0(真过)。
