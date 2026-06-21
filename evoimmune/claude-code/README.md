# EvoImmune × Claude Code · 经验免疫接入真实 harness(PoC)

把 EvoMap 的「经验免疫」装进**真实的 Claude Code agent harness**:一个 agent 踩坑解出后,
把「错误指纹 → 修复」沉淀成抗体写进共享的 EvoMap 免疫库;别的 agent 命中同一错误签名时,
直接召回抗体、套用修复、**跳过试错**。证明这套机制能装进真实 harness、真实 agent 群共享免疫,
而非合成蜂群。

> **诚实标注:这是 PoC。** 用 EvoMap **本地模式**(零 key、零网络),抗体落在
> `claude-code/.immunedata/`。错误指纹用项目现有的 `src/signals.js` 归一化(剥掉变量名),
> 抗体 summary 形状与现有 `src/harness.js` / `src/contextBuilder.js` 互通。未做:远程 Hub 同步、
> 抗体冲突仲裁、修复的安全沙箱执行。

## 文件

| 文件 | 作用 |
|---|---|
| `immunity.mjs` | 共享免疫库。`recallImmunity` / `sedimentAntibody` / `openImmuneGep`,复用 `src/gepClient.js`、`src/signals.js`。 |
| `evoimmune-mcp.mjs` | MCP server(stdio),暴露 `immune_recall` / `immune_sediment` 两个工具,持久持有一个本地 gep 连接。 |
| `immune-hook.mjs` | Claude Code **PostToolUse 钩子**:Bash 失败时自动召回抗体并注入上下文。 |
| `demo.mjs` | 独立演示(不依赖真 Claude Code):两个 agent 先后踩同一类报错,验证签名归一化 + 召回命中。 |

## 怎么跑 demo

```bash
# 在 evoimmune/ 目录下
node claude-code/demo.mjs
```

剧情:Agent-1 踩 `cart.append is not a function` → 召回**未命中**(库空)→ 自己解题(烧成本)→
沉淀抗体;Agent-2 踩 `basket.append is not a function`(换了变量名)→ 签名归一化后撞同一指纹 →
召回**命中**(相似 1.00)→ 注入修复 → 零成本痊愈。最后打印对照:Agent-1 付一次费,Agent-2 免疫。

## 如何接进真实 Claude Code 项目

两条接线方式,互补:**MCP 工具**(agent 主动调)+ **PostToolUse 钩子**(命令失败时自动注入)。
把下面 JSON 里的 `<EVOIMMUNE>` 替换成本仓库 `evoimmune/` 的绝对路径
(本机为 `/Users/ephemeral/进化酒馆/evoimmune`)。

### 1) `.mcp.json` —— 注册 MCP server(agent 可主动 `immune_recall` / `immune_sediment`)

```json
{
  "mcpServers": {
    "evoimmune": {
      "command": "node",
      "args": ["<EVOIMMUNE>/claude-code/evoimmune-mcp.mjs"]
    }
  }
}
```

### 2) `.claude/settings.json` —— 注册 PostToolUse 钩子(Bash 失败时自动召回 + 注入)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node <EVOIMMUNE>/claude-code/immune-hook.mjs",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

钩子协议:stdin 收 Claude Code 传的 `{tool_name, tool_input, tool_output, ...}`;命中抗体时
stdout 输出 `{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"<免疫提示>"}}`
并 exit 0,Claude 即把抗体当额外上下文看见;未命中 / 非 Bash / 命令成功则静默 exit 0,绝不阻断 agent。

> 闭环建议:钩子负责**被动召回**(失败即提示);沉淀(`immune_sediment`)由 agent 在确认修复后
> 主动调 MCP 工具完成 —— 这样只有「验证过的修复」才入库,避免污染免疫库。

## 验证

- `node claude-code/demo.mjs` → 跑通,exit 0,recall 真实命中(相似 1.00)。
- `node --check claude-code/evoimmune-mcp.mjs` / `node --check claude-code/immune-hook.mjs` → 通过。
- MCP 与钩子均经真实 stdio 调用验证过命中 / 未命中两条路径。
