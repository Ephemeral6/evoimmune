// 数据看板 · 指标模块 3/5:把价格从低到高排序(价格升序)。
// ⚠️ 内置真实 bug:裸 .sort() 按字典序排数字 ——
//    sortPrices([99,5,250,30]) 期望 [5,30,99,250],字典序却把 "250" 排到 "30" 前。
//    sortPrices.test.cjs 必挂。
function sortPrices(prices) {
  // BUG:缺数字比较器 (a,b)=>a-b。
  return prices.slice().sort();
}
module.exports = { sortPrices };
