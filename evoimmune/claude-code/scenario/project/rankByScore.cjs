// 数据看板 · 指标模块 2/5:把分数从小到大排成榜(升序排行)。
// ⚠️ 内置真实 bug:裸 .sort() 按字典序排数字 ——
//    rankByScore([10,2,100,5,9]) 期望 [2,5,9,10,100],字典序却给 [10,100,2,5,9]。
//    rankByScore.test.cjs 必挂。
function rankByScore(scores) {
  // BUG:缺数字比较器 (a,b)=>a-b。
  return scores.slice().sort();
}
module.exports = { rankByScore };
