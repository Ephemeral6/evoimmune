// 数据看板 · 指标模块 1/5:取分数最高的前 N 名(Top-N 排行)。
// ⚠️ 内置真实 bug:用了裸 .sort() —— Array.sort() 默认按「字符串字典序」比较,
//    [1,10,2].sort() 得 [1,10,2] 而非 [1,2,10]。数字排序必须传比较器 (a,b)=>a-b。
// 数字排序要求降序取前 N,这里既缺比较器又方向反了,topN.test.cjs 必挂。
function topN(scores, n) {
  // BUG:裸 sort 走字典序;且没 reverse,取不到真正的「最大 N 个」。
  const sorted = scores.slice().sort();
  return sorted.slice(-n).reverse();
}
module.exports = { topN };
