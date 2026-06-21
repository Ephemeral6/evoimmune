# realbugs —— 真实世界 bug 语料(对齐 SWE-bench 双门契约)

把 EvoImmune 现有的"手写小 bug"升级成**真实开源世界里反复出现的真 bug 类型实例**:
每个 case 都是一类在真实代码/CVE/经典 issue 里踩过的坑的**最小复现**,带**真失败测试**
(FAIL_TO_PASS)+ **回归测试**(PASS_TO_PASS),能在项目验证门里**真跑**。

## 为什么可信

我们用的就是 **SWE-bench 同款契约**:

- **FAIL_TO_PASS**(`test.cjs`):在有 bug 的代码上**失败**、在修复后**通过** —— 证明 bug 真实存在、且补丁真把它修好了。
- **PASS_TO_PASS**(`regress.cjs`):在 buggy 与 fixed 上**都通过** —— 证明没改坏旧用例,并且能**拦截过拟合补丁**(只针对某个测试用例硬编码、却没真正修好的"假修复")。

每个 case 额外带一个 `wrongPatch`(过拟合假修复):它能骗过 FAIL_TO_PASS,但会被 PASS_TO_PASS 抓出来,
直观演示**双门**的价值。

## 收录的真实 bug 类型(5 个)

| id | bug 类型 | 真实出处(诚实标注,不编造 issue/commit) |
|---|---|---|
| `array_sort_numeric` | `Array.sort()` 默认字典序排数字 | `[1,10,2].sort()` 得 `[1,10,2]`;排行榜/价格排序的头号经典坑,MDN 专门举例告警 |
| `parseint_radix` | `parseInt` 缺 radix 误把 `0x` 当十六进制 | `parseInt("0x1A")===26` vs `parseInt("0x1A",10)===0`;eslint `radix` 规则即为此而设 |
| `float_money_rounding` | 浮点金额未分位取整 | `0.1+0.2===0.30000000000000004`(IEEE-754);财务/电商对账的头号经典坑 |
| `proto_pollution_merge` | 对象深合并的原型污染(`__proto__`) | prototype pollution CVE 类型,在 lodash.merge / jQuery.extend / minimist 等库历史上多次出现 |
| `includes_nan` | `indexOf` 找不到 `NaN`(应改用 `includes`) | `indexOf` 用 `===`、`NaN!==NaN`,故 `indexOf(NaN)===-1`;这正是 ES2016 引入 `includes` 的动因 |

> 出处说明保持诚实:我们标注的是**真实 bug 类型 / 类别 / 触发机制**,以及该类型在哪些真实库历史上反复出现,
> **不捏造具体 issue 链接或 commit 号**。

## 文件

- `cases.mjs` —— 5 个 case 的语料:`buggy` / `fixed` / `wrongPatch` 源码 + `failToPass` / `passToPass` 测试 + `real_world` 出处。
- `swebench.mjs` —— loader:把每个 case 映射成 SWE-bench 风格任务对象
  `{ instance_id, problem_statement, FAIL_TO_PASS, PASS_TO_PASS, repo_hint }`。
- `run.mjs` —— 运行器:在临时目录落盘 buggy 代码 + `test.cjs` + `regress.cjs`,用 `node` **真实跑**三态验证,
  打印中文表格,并把结论写入 `proof.json`。
- `proof.json` —— 运行产物:每个 case 的 buggy/fixed/wrong 三态验证结论 + 出处 + SWE-bench 任务对象。

## 跑

```sh
node realbugs/run.mjs        # 真实验证 5 个 case 的三态,exit 0 即全部符合预期
node realbugs/swebench.mjs   # 打印 SWE-bench 风格任务清单(JSON)
```

验证只用 `node`(契合 evolver 沙箱白名单),每个测试就是一个独立 `node <file>` 进程、exit 0 即通过 ——
和 `src/validator.js` 的验证门说**完全同一种语言**。本目录自包含,不依赖也不修改任何现有文件。

## 与完整 SWE-bench 的关系(诚实说明)

这是**真实世界 bug 类型的最小复现 + 真失败/回归测试**,已对齐 SWE-bench 的 FAIL_TO_PASS / PASS_TO_PASS 契约。
**完整 SWE-bench 的 Docker-per-task 验证(每个真实仓库 + commit + 环境镜像)是下一步**;
由于本项目验证门已经和 SWE-bench 说同一种契约语言,接 SWE-bench **本质上只是换数据源**(把这里的最小复现
换成真实仓库快照),验证逻辑与双门判定不变。
