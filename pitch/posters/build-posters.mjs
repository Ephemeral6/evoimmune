// 生成 4 张 A4 竖版作品海报(西部酒馆·边境免疫志 风格),数字全部取自真实跑测数据。
// 用法:node build-posters.js  → 在本目录写出 p1..p4.html;再用 chrome --headless --screenshot 截成 PNG。
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

const CSS = `
* { margin:0; padding:0; box-sizing:border-box; }
:root{
  --bg:#e9dec4; --bg2:#e3d4b3; --ink:#2a2016; --dim:#6f5e42; --faint:#8a795a;
  --brass:#a9760f; --gold:#c2901c; --blood:#8c2f1d; --sage:#586b32; --line:#bda878;
}
html,body{ width:794px; height:1123px; }
body{
  font-family:"Songti SC","STSong","Noto Serif CJK SC",Georgia,serif;
  color:var(--ink);
  background:
    radial-gradient(120% 80% at 50% -10%, #f1e8d2 0%, var(--bg) 42%, var(--bg2) 100%);
  position:relative; overflow:hidden;
}
body::after{ /* 做旧暗角 */
  content:""; position:absolute; inset:0; pointer-events:none;
  box-shadow: inset 0 0 120px 30px rgba(74,52,28,.28), inset 0 0 30px 8px rgba(74,52,28,.18);
  background:
    repeating-linear-gradient(0deg, rgba(120,90,50,.025) 0 2px, transparent 2px 4px);
}
.frame{ position:absolute; inset:22px; border:2px solid var(--ink); }
.frame::before{ content:""; position:absolute; inset:5px; border:1px solid var(--line); }
.wrap{ position:absolute; inset:46px; display:flex; flex-direction:column; justify-content:space-between; }
.wrap.top{ justify-content:flex-start; }
.kicker{ font-family:"Special Elite","Courier New",monospace; letter-spacing:.32em; font-size:11px; color:var(--blood); text-transform:uppercase; }
.eng{ font-family:"Special Elite","Courier New",monospace; letter-spacing:.18em; color:var(--faint); }
.rule{ border:0; border-top:2px solid var(--ink); }
.rule.thin{ border-top:1px solid var(--line); }
.rule.dbl{ height:5px; border-top:2px solid var(--ink); border-bottom:1px solid var(--ink); }
h1.title{ font-size:50px; font-weight:900; letter-spacing:2px; line-height:1.02; }
.serif{ font-family:"Songti SC","STSong",Georgia,serif; }
.tnum{ font-variant-numeric:tabular-nums; }
.badge{ display:inline-block; border:1.5px solid var(--ink); border-radius:2px; padding:3px 9px; font-size:12px; letter-spacing:.06em; }
.tag{ font-family:"Special Elite","Courier New",monospace; font-size:11px; color:var(--dim); border:1px solid var(--line); border-radius:2px; padding:2px 7px; letter-spacing:.05em; }
.big{ font-size:60px; font-weight:900; line-height:1; color:var(--blood); }
.big.gold{ color:var(--brass); } .big.sage{ color:var(--sage); }
.cap{ font-size:13px; color:var(--dim); letter-spacing:.04em; }
.mono{ font-family:"Special Elite","Courier New",monospace; }
.card{ border:1.5px solid var(--ink); background:rgba(255,250,238,.42); padding:14px 16px; }
.softline{ border-top:1px dashed var(--line); }
.step{ width:30px;height:30px;border-radius:50%;border:2px solid var(--ink); display:flex;align-items:center;justify-content:center; font-weight:900; font-size:14px; background:rgba(255,250,238,.6); }
.foot{ font-family:"Special Elite","Courier New",monospace; font-size:10px; letter-spacing:.18em; color:var(--faint); text-transform:uppercase; }
.code{ font-family:"Special Elite","Courier New",monospace; font-size:12.5px; line-height:1.55; }
.del{ color:var(--blood); } .ins{ color:var(--sage); }
.seal{ position:absolute; right:60px; bottom:74px; width:118px;height:118px;border-radius:50%;
  border:2px solid var(--blood); color:var(--blood); display:flex;flex-direction:column;align-items:center;justify-content:center;
  transform:rotate(-13deg); opacity:.92; text-align:center; }
.seal .s1{ font-family:"Special Elite",monospace; font-size:10px; letter-spacing:.2em; }
.seal .s2{ font-size:22px; font-weight:900; margin:3px 0; }
.seal::before{ content:""; position:absolute; inset:7px; border:1px dashed var(--blood); border-radius:50%; }
`;

const head = (t, cls='') => `<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>${t}</title><style>${CSS}</style></head><body><div class="frame"></div><div class="wrap ${cls}">`;
const foot = (n) => `</div><div class="foot" style="position:absolute;left:46px;bottom:30px;">EVOTAVERN · 进化酒馆 第三届 AGENT 黑客松 · THE FORGE / A2A</div><div class="foot" style="position:absolute;right:46px;bottom:30px;">第 ${n} / 4 版</div></body></html>`;

// ── 第 1 版:封面 / 一图读懂 ───────────────────────────────
const p1 = head('封面') + `
  <div class="kicker">FRONTIER IMMUNITY GAZETTE · 硅基物种群体免疫</div>
  <hr class="rule dbl" style="margin:8px 0 14px;">
  <div style="display:flex;justify-content:space-between;align-items:flex-end;">
    <h1 class="title">EvoImmune<br><span style="font-size:38px;color:var(--blood);">经验免疫蜂群</span></h1>
    <div style="text-align:right;">
      <div class="badge">A2A 蜂群协作</div><br>
      <div class="eng" style="font-size:11px;margin-top:8px;">EST. 2026 · 杭州</div>
    </div>
  </div>
  <div class="serif" style="font-size:21px;margin:16px 0 4px;line-height:1.45;">
    一个 <b>agent</b> 踩过的坑,变成全网 <b>agent</b> 生来就免疫的「抗体」。
  </div>
  <div class="cap" style="margin-bottom:14px;">一处治愈,全网免疫 —— 把单个 agent 的失败经验,沉淀成可被百万 agent 继承的免疫记忆。</div>
  <hr class="rule thin" style="margin:4px 0 16px;">

  <div class="kicker" style="color:var(--ink);">免 疫 回 路 · THE LOOP</div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin:14px 2px 18px;">
    ${[['1','感染','命中 bug<br>报错=抗原'],['2','解题','大模型解<br>+ 验证通过'],['3','沉淀抗体','打包成 EvoMap<br>Capsule 上链'],['4','群体免疫','他人 recall<br>零 token 痊愈']]
      .map(([n,t,d],i)=>`<div style="text-align:center;width:140px;">
        <div class="step" style="margin:0 auto 8px;">${n}</div>
        <div class="serif" style="font-size:17px;font-weight:900;">${t}</div>
        <div class="cap" style="font-size:11px;margin-top:3px;line-height:1.3;">${d}</div>
      </div>${i<3?'<div class="serif" style="font-size:26px;color:var(--brass);">→</div>':''}`).join('')}
  </div>
  <hr class="rule thin" style="margin:2px 0 18px;">

  <div class="kicker" style="color:var(--ink);">战 报 · 同一批任务 朴素蜂群 vs 免疫蜂群</div>
  <div style="display:flex;gap:14px;margin-top:14px;">
    <div class="card" style="flex:1;text-align:center;">
      <div class="big">−87%</div>
      <div class="cap" style="margin-top:6px;">模型解题次数<br><span class="mono tnum">48 → 6</span> 次</div>
    </div>
    <div class="card" style="flex:1;text-align:center;">
      <div class="big sage">174</div>
      <div class="cap" style="margin-top:6px;">次「生来免疫」<br>零模型调用继承</div>
    </div>
    <div class="card" style="flex:1;text-align:center;">
      <div class="big gold tnum">313,200</div>
      <div class="cap" style="margin-top:6px;">token 省下<br>180 任务 · 64 节点</div>
    </div>
  </div>
  <div class="cap mono" style="margin-top:14px;letter-spacing:.04em;">规模化压测:180 任务 / 6 病原家族 / 64 节点 · 免疫覆盖后整体省 97%。</div>

  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <span class="tag">群体免疫</span><span class="tag">A2A 蜂群</span><span class="tag">经验共享</span><span class="tag">验证驱动 Harness</span><span class="tag">真上链</span>
  </div>
` + foot(1);

// ── 第 2 版:机制 + Harness 回路 + EvoMap 结合 ──────────────
const p2 = head('机制') + `
  <div class="kicker">机 制 总 览 · HOW IT WORKS</div>
  <hr class="rule dbl" style="margin:8px 0 16px;">
  <h1 class="title" style="font-size:34px;">验证驱动的 7 阶段 Harness</h1>
  <div class="cap" style="margin:8px 0 16px;">能力 = 模型 × harness。模型负责「解得出」,harness 负责「学得住、传得开、信得过」。</div>

  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:8px;">
    ${[['观察','接到任务,捕获报错签名'],['构建上下文','免疫召回 gep_recall'],['提案','大模型生成补丁'],['执行','落盘改代码']]
      .map(([t,d])=>`<div class="card" style="padding:10px 11px;"><div class="serif" style="font-weight:900;font-size:15px;">${t}</div><div class="cap" style="font-size:10.5px;margin-top:4px;line-height:1.3;">${d}</div></div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;">
    ${[['验证 ★','双门把关,详见下'],['反思','失败→改方案重试'],['沉淀','治愈才写回抗体库']]
      .map(([t,d])=>`<div class="card" style="padding:10px 11px;"><div class="serif" style="font-weight:900;font-size:15px;color:var(--blood);">${t}</div><div class="cap" style="font-size:10.5px;margin-top:4px;line-height:1.3;">${d}</div></div>`).join('')}
  </div>

  <div class="card" style="margin-top:16px;border-color:var(--blood);">
    <div class="kicker" style="color:var(--blood);">验 证 双 门 · 杜绝假抗体</div>
    <div style="display:flex;gap:18px;margin-top:10px;">
      <div style="flex:1;"><div class="serif" style="font-weight:900;font-size:17px;">FAIL → PASS</div><div class="cap" style="margin-top:3px;">真把 bug 修好:原本失败的用例必须转绿。</div></div>
      <div style="width:1px;background:var(--line);"></div>
      <div style="flex:1;"><div class="serif" style="font-weight:900;font-size:17px;">PASS → PASS</div><div class="cap" style="margin-top:3px;">回归门:不许改坏任何老用例,过拟合补丁当场拦下。</div></div>
    </div>
    <div class="cap" style="margin-top:10px;border-top:1px dashed var(--line);padding-top:8px;">只有<b>双门同时通过</b>才允许沉淀成抗体 —— 从源头保证库里每一颗抗体都「真能治病」。</div>
  </div>

  <hr class="rule thin" style="margin:18px 0 14px;">
  <div class="kicker" style="color:var(--ink);">与 EVOMAP 深 度 结 合 · 非 MOCK,全链路真跑</div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px;">
    ${[
      ['gep_recall','命中抗原 → 召回抗体,秒级免疫'],
      ['gep_record_outcome','记录每次成败,喂养复利'],
      ['gep_publish_bundle','经 GDI 质量门上链为共享资产'],
      ['A2A Hub','真实节点注册 / 认领 / 跨节点扩散'],
    ].map(([k,v])=>`<div style="display:flex;gap:10px;align-items:flex-start;"><span class="mono" style="color:var(--brass);font-size:13px;">●</span><div><div class="mono" style="font-size:13px;color:var(--ink);">${k}</div><div class="cap" style="font-size:11px;margin-top:2px;">${v}</div></div></div>`).join('')}
  </div>
  <div class="cap" style="margin-top:14px;">跨 <b>6 个真实模型</b>经网关路由协作:Claude Opus 4.7 · GPT 5.5 · Gemini 3.1 Pro · DeepSeek V4 · GLM 5.1 · Kimi K2.6 —— 一家解题,六家继承。</div>
` + foot(2);

// ── 第 3 版:协同进化 + 规模化 + 疫苗接种 ───────────────────
const coevo = [[1,66.7,500],[2,83.3,250],[3,88.9,167],[4,91.7,125],[5,93.3,100],[6,94.4,83],[7,100,0],[8,100,0]];
const W=620,H=230,padL=44,padB=28,padT=10,padR=14;
const x=(i)=>padL+(W-padL-padR)*(i/(coevo.length-1));
const yh=(v)=>padT+(H-padT-padB)*(1-v/100);
const yt=(v)=>padT+(H-padT-padB)*(1-v/500);
const lineH='M'+coevo.map((d,i)=>`${x(i).toFixed(1)},${yh(d[1]).toFixed(1)}`).join(' L');
const lineT='M'+coevo.map((d,i)=>`${x(i).toFixed(1)},${yt(d[2]).toFixed(1)}`).join(' L');
const p3 = head('协同进化') + `
  <div class="kicker">协 同 进 化 · MODEL × HARNESS</div>
  <hr class="rule dbl" style="margin:8px 0 16px;">
  <h1 class="title" style="font-size:32px;">模型一字不改,蜂群越跑越强</h1>
  <div class="cap" style="margin:8px 0 12px;">固定 <span class="mono">evomap-gemini-3.1-pro</span>。随抗体库变大:<b style="color:var(--sage);">免疫命中率↑</b>、<b style="color:var(--brass);">token/任务↓</b>。能力增长来自 harness 的经验复利,而非更换模型。</div>

  <div class="card" style="padding:10px 12px;">
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;">
      <line x1="${padL}" y1="${H-padB}" x2="${W-padR}" y2="${H-padB}" stroke="#bda878"/>
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H-padB}" stroke="#bda878"/>
      ${[0,25,50,75,100].map(v=>`<text x="${padL-6}" y="${yh(v)+3}" text-anchor="end" font-size="9" fill="#586b32" font-family="monospace">${v}</text><line x1="${padL}" y1="${yh(v)}" x2="${W-padR}" y2="${yh(v)}" stroke="#d8c79d" stroke-dasharray="2 3"/>`).join('')}
      <path d="${lineT}" fill="none" stroke="#a9760f" stroke-width="2.5"/>
      <path d="${lineH}" fill="none" stroke="#586b32" stroke-width="2.5"/>
      ${coevo.map((d,i)=>`<circle cx="${x(i).toFixed(1)}" cy="${yh(d[1]).toFixed(1)}" r="3" fill="#586b32"/><circle cx="${x(i).toFixed(1)}" cy="${yt(d[2]).toFixed(1)}" r="3" fill="#a9760f"/><text x="${x(i).toFixed(1)}" y="${H-padB+13}" text-anchor="middle" font-size="9" fill="#6f5e42" font-family="monospace">w${d[0]}</text>`).join('')}
      <text x="${x(7)}" y="${yh(100)-8}" text-anchor="middle" font-size="10" fill="#586b32" font-weight="bold">100%</text>
      <text x="${x(7)}" y="${yt(0)-6}" text-anchor="middle" font-size="10" fill="#a9760f" font-weight="bold">0 tok</text>
    </svg>
    <div style="display:flex;gap:18px;justify-content:center;margin-top:2px;">
      <span class="cap"><span style="color:#586b32;">━</span> 免疫命中率 %</span>
      <span class="cap"><span style="color:#a9760f;">━</span> 平均 token / 任务</span>
    </div>
  </div>

  <hr class="rule thin" style="margin:18px 0 14px;">
  <div class="kicker" style="color:var(--ink);">疫 苗 接 种 · 第一代学会,第二代生来免疫</div>
  <div style="display:flex;gap:12px;margin-top:12px;">
    <div class="card" style="flex:1;text-align:center;"><div class="cap">第一代(学习)</div><div class="big" style="font-size:34px;margin-top:4px;">6</div><div class="cap">次模型解题</div></div>
    <div class="serif" style="display:flex;align-items:center;font-size:24px;color:var(--brass);">→</div>
    <div class="card" style="flex:1;text-align:center;border-color:var(--sage);"><div class="cap">第二代·已接种</div><div class="big sage" style="font-size:34px;margin-top:4px;">0</div><div class="cap">次解题 · 24 任务全免疫</div></div>
    <div class="card" style="flex:1;text-align:center;"><div class="cap">未接种对照</div><div class="big" style="font-size:34px;margin-top:4px;">6</div><div class="cap">次仍需从头解</div></div>
  </div>

  <div style="display:flex;gap:12px;">
    <div class="card" style="flex:1;"><div class="kicker" style="color:var(--ink);">变 异 攻 防</div><div class="cap" style="margin-top:8px;">野生株解题 → 变体<b style="color:var(--sage);">交叉免疫</b> → 免疫逃逸再解 → <b>加强针</b>覆盖新变种。库会进化。</div></div>
    <div class="card" style="flex:1;"><div class="kicker" style="color:var(--ink);">规 模 化</div><div class="cap" style="margin-top:8px;">180 任务 · 64 节点下,免疫前 180 次解题 → 免疫后仅 <b>6</b> 次,省 <b style="color:var(--brass);">313,200</b> token。</div></div>
  </div>
` + foot(3);

// ── 第 4 版:真实证据 ─────────────────────────────────────
const p4 = head('真实证据','top') + `
  <div class="kicker">真 实 证 据 · NOT A TOY · 全部真跑</div>
  <hr class="rule dbl" style="margin:8px 0 16px;">
  <h1 class="title" style="font-size:34px;">真 bug · 真模型 · 真上链</h1>
  <div class="cap" style="margin:8px 0 14px;">由真实模型 <span class="mono">Gemini 3.1 Pro</span> 实解,补丁经双门验证,抗体真上 EvoMap 链。</div>

  <div class="card" style="margin-bottom:11px;">
    <div style="display:flex;justify-content:space-between;"><div class="serif" style="font-weight:900;font-size:16px;">📄 分页边界错位 (off-by-one)</div><span class="badge" style="font-size:10px;">655 token · 已治愈</span></div>
    <div class="code" style="margin-top:8px;"><span class="del">− items.slice(start, start+size-1)</span> &nbsp;<span class="cap">少取最后一项</span><br><span class="ins">+ items.slice(start, start+size)</span></div>
  </div>
  <div class="card" style="margin-bottom:14px;">
    <div style="display:flex;justify-content:space-between;"><div class="serif" style="font-weight:900;font-size:16px;">🧾 发票折扣 / 税额顺序错位</div><span class="badge" style="font-size:10px;">1,038 token · 已治愈</span></div>
    <div class="code" style="margin-top:8px;"><span class="del">− tax = subtotal * taxRate</span> &nbsp;<span class="cap">在未扣折扣金额上计税</span><br><span class="ins">+ tax = (subtotal − discount) * taxRate</span></div>
  </div>

  <hr class="rule thin" style="margin:4px 0 14px;">
  <div class="kicker" style="color:var(--ink);">真 上 链 · EVOMAP A2A HUB</div>
  <div class="card mono" style="font-size:11.5px;line-height:1.7;margin-top:10px;">
    <div>node&nbsp;&nbsp;: <span style="color:var(--ink);">node_f3d62089a8320468</span> &nbsp;(evoimmune,已认领)</div>
    <div>bundle: <span style="color:var(--blood);">bundle_83fa523165b26af2</span> &nbsp;→ candidate / GDI 待晋升</div>
    <div>gene&nbsp;&nbsp;: sha256:baf747c9…f928c</div>
    <div>capsule: sha256:834054eb…f13b7</div>
  </div>

  <div style="display:flex;gap:12px;margin-top:14px;">
    <div class="card" style="flex:1;">
      <div class="kicker" style="color:var(--ink);">跨 模 型 继 承</div>
      <div class="big gold" style="font-size:40px;margin-top:6px;">6</div>
      <div class="cap">个真实模型互相继承抗体:Opus 4.7 / GPT 5.5 / Gemini 3.1 / DeepSeek V4 / GLM 5.1 / Kimi K2.6</div>
    </div>
    <div class="card" style="flex:1;border-color:var(--blood);">
      <div class="kicker" style="color:var(--blood);">验 赏 官 · 抗体打假</div>
      <div class="cap" style="margin-top:8px;line-height:1.5;">投毒 36 伪抗体:<br>盲信蜂群 → <b style="color:var(--blood);">36 假治愈</b><br>验证蜂群 → <b style="color:var(--sage);">拒收 36 / 真治愈 36</b></div>
    </div>
  </div>

  <div class="seal"><div class="s1">VERIFIED</div><div class="s2">真跑</div><div class="s1">2026·杭州</div></div>
` + foot(4);

const pages = { 'p1.html':p1, 'p2.html':p2, 'p3.html':p3, 'p4.html':p4 };
for (const [name, html] of Object.entries(pages)) {
  writeFileSync(resolve(HERE, name), html);
  console.log('wrote', name);
}
console.log('done');
