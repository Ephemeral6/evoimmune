const pptxgen = require('pptxgenjs');

// ───────── 进化酒馆·西部世界 调色板 ─────────
const BG = '17110A', BG2 = '120C06', LEATHER = '241B11', LEATHER2 = '2C2113';
const BRASS = 'E0A93B', BRASS2 = 'C8962A';
const PARCH = 'ECDCBF', DIM = '9C8763', LINEC = '4A3A22';
const OX = 'C4392F', SAGE = '88A259';
const HEAD = 'Songti SC', BODY = 'PingFang SC', MONO = 'Menlo';

const p = new pptxgen();
p.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
p.author = 'EvoImmune';
p.title = 'EvoImmune · 进化酒馆边境免疫志';
const W = 13.33, H = 7.5;
const makeShadow = () => ({ type: 'outer', color: '000000', blur: 9, offset: 3, angle: 135, opacity: 0.45 });

function slide(bg = BG) {
  const s = p.addSlide();
  s.background = { color: bg };
  s.addText('✦', { x: 0.55, y: 0.38, w: 0.5, h: 0.4, fontSize: 16, color: BRASS, fontFace: HEAD, margin: 0 });
  s.addText('EvoImmune · 进化酒馆 · The Forge / A2A 蜂群协作', { x: 8.5, y: 7.02, w: 4.4, h: 0.3, fontSize: 9, color: DIM, fontFace: BODY, align: 'right', margin: 0 });
  return s;
}
function title(s, t, sub) {
  s.addText(t, { x: 0.95, y: 0.55, w: 11.4, h: 0.85, fontSize: 30, bold: true, color: PARCH, fontFace: HEAD, margin: 0 });
  if (sub) s.addText(sub, { x: 0.97, y: 1.38, w: 11.4, h: 0.4, fontSize: 14, color: BRASS, fontFace: BODY, margin: 0 });
}
function card(s, x, y, w, h, fill = LEATHER) {
  s.addShape(p.shapes.RECTANGLE, { x, y, w, h, fill: { color: fill }, line: { color: LINEC, width: 1 }, shadow: makeShadow() });
}
function brassTop(s, x, y, w) {
  s.addShape(p.shapes.RECTANGLE, { x, y, w, h: 0.035, fill: { color: BRASS2 } });
}

// ───────── 1. 封面 ─────────
{
  const s = slide(BG2);
  s.addText('EVOTAVERN · FRONTIER IMMUNITY', { x: 0, y: 1.35, w: W, h: 0.4, fontSize: 15, color: BRASS, fontFace: 'Georgia', align: 'center', charSpacing: 4, margin: 0 });
  s.addText('进化酒馆 · 边境免疫志', { x: 0, y: 2.15, w: W, h: 1.2, fontSize: 60, bold: true, color: PARCH, fontFace: HEAD, align: 'center', margin: 0 });
  s.addText('EvoImmune — 硅基生命的群体免疫系统', { x: 0, y: 3.55, w: W, h: 0.5, fontSize: 23, color: PARCH, fontFace: BODY, align: 'center', margin: 0 });
  s.addText('「 一个 agent 学会,百万 agent 生来免疫 」', { x: 0, y: 4.5, w: W, h: 0.5, fontSize: 20, italic: true, color: BRASS, fontFace: HEAD, align: 'center', margin: 0 });
  s.addText('赛道一 The Forge · A2A 蜂群协作   |   EvoMap「进化酒馆」黑客松 · 2026', { x: 0, y: 6.3, w: W, h: 0.4, fontSize: 14, color: DIM, fontFace: BODY, align: 'center', margin: 0 });
}

// ───────── 2. 命题(钩子)─────────
{
  const s = slide(BG2);
  s.addText('赛事手册原命题', { x: 0.95, y: 1.2, w: 11, h: 0.4, fontSize: 15, color: BRASS, fontFace: BODY, margin: 0 });
  s.addText([
    { text: '当单体 Agent 在试错时,它的失败经验如何被压缩成', options: { breakLine: true } },
    { text: '整个种群的本能', options: { color: BRASS, bold: true } },
    { text: ',让其他节点', options: {} },
    { text: '生来就具备群体免疫', options: { color: BRASS, bold: true, breakLine: true } },
    { text: '?', options: {} },
  ], { x: 0.95, y: 2.05, w: 11.6, h: 3.1, fontSize: 30, bold: true, color: PARCH, fontFace: HEAD, lineSpacingMultiple: 1.28, margin: 0 });
  s.addText('—— 这正是 EvoImmune 要回答的问题。我们把它做成了真实可运行、可上链的系统。', { x: 0.97, y: 5.7, w: 11.5, h: 0.5, fontSize: 16, color: DIM, fontFace: BODY, margin: 0 });
}

// ───────── 3. 痛点 ─────────
{
  const s = slide();
  title(s, '痛点 · 经验不共享,每个 agent 都从零踩坑', '数据来自 EvoMap 官方论文对真实网络的分析');
  const stats = [
    { n: '98%', l: '沉淀的资产从未被复用\n经验沉了,却传不出去', c: OX },
    { n: '84%', l: 'Gene 用 console.log 等\n水校验绕过质量闸门', c: OX },
    { n: '∞', l: '同一个坑,每个 agent\n反复踩、反复烧 token', c: BRASS },
  ];
  const cw = 3.7, gap = 0.45, x0 = (W - (cw * 3 + gap * 2)) / 2;
  stats.forEach((st, i) => {
    const x = x0 + i * (cw + gap);
    card(s, x, 2.3, cw, 3.4); brassTop(s, x, 2.3, cw);
    s.addText(st.n, { x, y: 2.7, w: cw, h: 1.3, fontSize: 64, bold: true, color: st.c, fontFace: HEAD, align: 'center', margin: 0 });
    s.addText(st.l, { x: x + 0.3, y: 4.15, w: cw - 0.6, h: 1.3, fontSize: 16, color: PARCH, fontFace: BODY, align: 'center', valign: 'top', margin: 0 });
  });
  s.addText('结论:经验需要像免疫一样,被共享、被继承、被验证。', { x: 0.95, y: 6.1, w: 11.4, h: 0.5, fontSize: 17, italic: true, color: BRASS, fontFace: BODY, align: 'center', margin: 0 });
}

// ───────── 4. EvoImmune 是什么(一张图)─────────
{
  const s = slide();
  title(s, 'EvoImmune 是什么 · Agent 版「群体免疫」', '把失败压缩成抗体,经中央电报局让全族群继承');
  // 左:叙事
  s.addText([
    { text: '一个 agent 踩坑', options: { bold: true, color: OX, breakLine: true } },
    { text: '把失败压缩成「抗体」(带报错指纹的可复用修复)', options: { color: PARCH, breakLine: true, bullet: { code: '2192' } } },
    { text: '发到 EvoMap 中央电报局(Hub)', options: { color: PARCH, breakLine: true, bullet: { code: '2192' } } },
    { text: '别的 agent 命中同一指纹 → 生来免疫,不再犯、不再烧 token', options: { color: SAGE, bold: true, bullet: { code: '2192' } } },
  ], { x: 0.95, y: 2.2, w: 5.6, h: 3.2, fontSize: 17, fontFace: BODY, lineSpacingMultiple: 1.3, paraSpaceAfter: 10, margin: 0 });
  s.addText('扣死手册「群体免疫」命题', { x: 0.95, y: 5.9, w: 5.6, h: 0.4, fontSize: 15, italic: true, color: BRASS, fontFace: BODY, margin: 0 });

  // 右:流程图
  const cx = 10.0;
  s.addShape(p.shapes.OVAL, { x: cx - 0.85, y: 3.45, w: 1.7, h: 1.7, fill: { color: LEATHER2 }, line: { color: BRASS, width: 2 }, shadow: makeShadow() });
  s.addText([{ text: '中央电报局', options: { breakLine: true, bold: true } }, { text: 'EvoMap Hub', options: { fontSize: 11, color: DIM } }], { x: cx - 1.1, y: 3.85, w: 2.2, h: 1, fontSize: 13, color: BRASS, fontFace: BODY, align: 'center', margin: 0 });
  const sat = [['踩坑→抗体', OX, -1.1], ['沉淀 record', BRASS, 0], ['命中 recall', SAGE, 1.1]];
  const sx = [cx - 3.4, cx + 2.0, cx - 3.4];
  const sy = [2.3, 4.3, 6.0];
  [['🛑 踩坑·造抗体', OX, 7.1, 2.3], ['📡 发电报·沉淀', BRASS, 11.0, 4.0], ['🟢 继承·全群免疫', SAGE, 7.1, 6.0]].forEach(([t, c, x, y]) => {
    s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.3, h: 0.7, fill: { color: LEATHER }, line: { color: c, width: 1.5 }, rectRadius: 0.06 });
    s.addText(t, { x, y, w: 2.3, h: 0.7, fontSize: 13, color: PARCH, fontFace: BODY, align: 'center', valign: 'middle', margin: 0 });
  });
  s.addShape(p.shapes.LINE, { x: 9.1, y: 2.65, w: 0.9, h: 0.9, line: { color: BRASS, width: 1.5, endArrowType: 'triangle' } });
  s.addShape(p.shapes.LINE, { x: 10.9, y: 4.35, w: -0.05, h: -0.5, line: { color: BRASS, width: 1.5, endArrowType: 'triangle' } });
  s.addShape(p.shapes.LINE, { x: 9.1, y: 5.6, w: 0.9, h: -0.9, line: { color: SAGE, width: 1.5, beginArrowType: 'triangle' } });
}

// ───────── 5. 机制全是真 EvoMap ─────────
{
  const s = slide();
  title(s, '机制全是真 EvoMap · 不是 mock', '抗体↔Capsule,识别↔gep_recall,沉淀↔record,上链↔publish_bundle');
  const rows = [
    [{ text: '免疫概念', options: { bold: true, color: BG, fill: { color: BRASS } } }, { text: 'EvoMap 真实原语', options: { bold: true, color: BG, fill: { color: BRASS } } }],
    ['抗体(对某类坑的免疫)', 'Capsule(content + trigger + outcome)'],
    ['识别 / 继承', 'gep_recall(模糊 trigger 匹配)'],
    ['沉淀抗体', 'gep_record_outcome(成功即生成 Capsule)'],
    ['可信免疫(拒收水抗体)', 'validation 沙箱(node)+ Validator + GDI 闸门'],
    ['抗体上链扩散', 'gep_publish_bundle → A2A Hub(真节点已认领)'],
  ];
  s.addTable(rows, {
    x: 1.1, y: 2.2, w: 11.1, colW: [4.6, 6.5],
    fontFace: BODY, fontSize: 16, color: PARCH, align: 'left', valign: 'middle',
    border: { pt: 1, color: LINEC }, fill: { color: LEATHER }, rowH: 0.62,
  });
  s.addText('差异化:真 validation 闸门(打论文 84% 水校验)+ 归一化 trigger(打 98% 没复用)', { x: 1.1, y: 6.45, w: 11, h: 0.4, fontSize: 15, italic: true, color: BRASS, fontFace: BODY, margin: 0 });
}

// ───────── 6. 战报(数据)─────────
{
  const s = slide();
  title(s, '战报 · 免疫让规模变便宜', '180 任务 · 64 节点蜂群 · 6 病原家族(受控基准)');
  // 大数字
  card(s, 0.95, 2.2, 4.1, 3.9); brassTop(s, 0.95, 2.2, 4.1);
  s.addText('省 97%', { x: 0.95, y: 2.7, w: 4.1, h: 1.2, fontSize: 60, bold: true, color: SAGE, fontFace: HEAD, align: 'center', margin: 0 });
  s.addText([
    { text: '免疫前 ', options: {} }, { text: '180', options: { color: OX, bold: true } }, { text: ' 次模型解题', options: { breakLine: true } },
    { text: 'EvoMap 免疫后 ', options: {} }, { text: '6', options: { color: SAGE, bold: true } }, { text: ' 次', options: { breakLine: true } },
    { text: '≈ 313,200 tokens 省下', options: { color: BRASS, bold: true } },
  ], { x: 1.2, y: 4.1, w: 3.6, h: 1.7, fontSize: 18, color: PARCH, fontFace: BODY, align: 'center', lineSpacingMultiple: 1.3, margin: 0 });
  // 对比柱状
  s.addChart(p.charts.BAR, [{ name: '模型解题次数', labels: ['免疫前(朴素)', '免疫后(EvoMap)'], values: [180, 6] }], {
    x: 5.5, y: 2.2, w: 7.0, h: 4.2, barDir: 'col',
    chartColors: [OX, SAGE], chartArea: { fill: { color: LEATHER } }, plotArea: { fill: { color: LEATHER } },
    catAxisLabelColor: PARCH, valAxisLabelColor: DIM, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 13,
    valGridLine: { color: LINEC, size: 0.5 }, catGridLine: { style: 'none' },
    showValue: true, dataLabelColor: PARCH, dataLabelFontSize: 16, dataLabelPosition: 'outEnd', showLegend: false, showTitle: false,
  });
}

// ───────── 7. 真实性三连证 ─────────
{
  const s = slide();
  title(s, '不是注水 · 真实性四连证', '受控基准证机制,真实抽样证真实');
  const ev = [
    { t: '真模型实证', d: 'Gemini 真解 3 个零号病人(真 1149 tok)+ 9 个免疫继承', c: SAGE },
    { t: '跨模型免疫', d: 'Claude / GPT / Gemini 各造抗体,被全 6 种模型继承(3×6 全绿)', c: BRASS },
    { t: '真 A2A 上链', d: '注册+认领真节点,gep_publish_bundle 上 evomap.ai(quarantine→auto_promoted)', c: BRASS },
    { t: '真坑实证', d: '两个真实逻辑 bug,真模型读测试反推意图修复(非 transform)', c: SAGE },
  ];
  const cw = 5.7, ch = 1.85, gx = 0.55, gy = 0.4, x0 = (W - (cw * 2 + gx)) / 2;
  ev.forEach((e, i) => {
    const x = x0 + (i % 2) * (cw + gx), y = 2.25 + Math.floor(i / 2) * (ch + gy);
    card(s, x, y, cw, ch); brassTop(s, x, y, cw);
    s.addText(e.t, { x: x + 0.35, y: y + 0.25, w: cw - 0.7, h: 0.5, fontSize: 22, bold: true, color: e.c, fontFace: HEAD, margin: 0 });
    s.addText(e.d, { x: x + 0.35, y: y + 0.85, w: cw - 0.7, h: 0.9, fontSize: 14.5, color: PARCH, fontFace: BODY, valign: 'top', margin: 0 });
  });
}

// ───────── 8. 真坑实证(深一层)─────────
{
  const s = slide();
  title(s, '真坑实证 · 模型现场推理(堵"玩具 bug"质疑)', '逻辑 bug:输出错误而非语法 typo,必须读懂业务意图才能修');
  const bugs = [
    { name: '① 分页边界错位 (off-by-one)', tok: 655, before: 'items.slice(start, start+size-1)', after: 'items.slice(start, start+size)', why: 'expected [1,2] got [1] · 少取最后一项' },
    { name: '② 发票折扣/税顺序错位', tok: 1038, before: 'tax = subtotal * taxRate', after: 'tax = (subtotal - discount) * taxRate', why: 'expected 93.5 got 95 · 先扣折扣再计税' },
  ];
  bugs.forEach((b, i) => {
    const y = 2.2 + i * 2.45;
    card(s, 0.95, y, 11.45, 2.2);
    s.addText(b.name, { x: 1.25, y: y + 0.18, w: 7.5, h: 0.4, fontSize: 17, bold: true, color: PARCH, fontFace: BODY, margin: 0 });
    s.addText(`Gemini · 真 ${b.tok} tok`, { x: 8.7, y: y + 0.18, w: 3.5, h: 0.4, fontSize: 13, color: DIM, fontFace: BODY, align: 'right', margin: 0 });
    s.addText([{ text: 'BUGGY  ', options: { color: OX, bold: true } }, { text: b.before, options: { color: PARCH } }], { x: 1.25, y: y + 0.72, w: 10.9, h: 0.45, fontSize: 14, fontFace: MONO, margin: 0 });
    s.addText([{ text: 'FIXED  ', options: { color: SAGE, bold: true } }, { text: b.after, options: { color: PARCH } }], { x: 1.25, y: y + 1.22, w: 10.9, h: 0.45, fontSize: 14, fontFace: MONO, margin: 0 });
    s.addText(b.why + ' · 同类复发即电报免疫(零模型)', { x: 1.25, y: y + 1.7, w: 10.9, h: 0.4, fontSize: 13, italic: true, color: BRASS, fontFace: BODY, margin: 0 });
  });
}

// ───────── 9. 商业楔子 ─────────
{
  const s = slide();
  title(s, '商业楔子 · Agent 失败经验的 CVE 库', '团队/企业的 agent 舰队,共享一张「免疫记忆」');
  s.addText([
    { text: '谁付费:', options: { color: BRASS, bold: true } },
    { text: '有 agent 舰队 / AI CI 的团队与企业', options: { breakLine: true } },
    { text: '楔子:', options: { color: BRASS, bold: true } },
    { text: '任何一个 agent 踩过的坑,全公司 agent 生来免疫', options: { breakLine: true } },
    { text: '价值:', options: { color: BRASS, bold: true } },
    { text: '一次解、全员免疫 → token 成本随规模指数下降', options: { breakLine: true } },
    { text: '可信:', options: { color: BRASS, bold: true } },
    { text: '真 validation + 共识投票,杜绝"假经验"污染', options: {} },
  ], { x: 0.95, y: 2.25, w: 7.2, h: 3.6, fontSize: 19, color: PARCH, fontFace: BODY, lineSpacingMultiple: 1.45, paraSpaceAfter: 8, margin: 0 });
  card(s, 8.5, 2.3, 3.9, 3.7, LEATHER2); brassTop(s, 8.5, 2.3, 3.9);
  s.addText('“CVE for Agents”', { x: 8.5, y: 2.8, w: 3.9, h: 0.7, fontSize: 24, bold: true, italic: true, color: BRASS, fontFace: HEAD, align: 'center', margin: 0 });
  s.addText([
    { text: '像安全界共享漏洞库一样,', options: { breakLine: true } },
    { text: '让 AI 共享失败经验库。', options: { breakLine: true } },
    { text: '', options: { breakLine: true } },
    { text: '一个学会,百万免疫。', options: { color: SAGE, bold: true } },
  ], { x: 8.8, y: 3.7, w: 3.3, h: 2, fontSize: 16, color: PARCH, fontFace: BODY, align: 'center', lineSpacingMultiple: 1.3, margin: 0 });
}

// ───────── 10. 收尾 ─────────
{
  const s = slide(BG2);
  s.addText('✦', { x: 0, y: 1.7, w: W, h: 0.5, fontSize: 22, color: BRASS, fontFace: HEAD, align: 'center', margin: 0 });
  s.addText('一个 agent 学会,全族群生来免疫。', { x: 0, y: 2.5, w: W, h: 1.0, fontSize: 44, bold: true, color: PARCH, fontFace: HEAD, align: 'center', margin: 0 });
  s.addText('EvoImmune · 进化酒馆边境免疫志', { x: 0, y: 3.8, w: W, h: 0.5, fontSize: 22, color: BRASS, fontFace: BODY, align: 'center', margin: 0 });
  s.addText('真 EvoMap 全栈(真模型 / 跨模型 / 真上链)· 现场可互动 Console · 西部世界美术', { x: 0, y: 4.7, w: W, h: 0.4, fontSize: 15, color: DIM, fontFace: BODY, align: 'center', margin: 0 });
  s.addText('现在,放出流寇 —— 看群体免疫如何发生。', { x: 0, y: 5.8, w: W, h: 0.4, fontSize: 16, italic: true, color: BRASS, fontFace: BODY, align: 'center', margin: 0 });
}

p.writeFile({ fileName: '/Users/ephemeral/进化酒馆/pitch/EvoImmune_路演.pptx' }).then((f) => console.log('written:', f));
