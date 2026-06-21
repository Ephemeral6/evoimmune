// 数据看板 · 指标模块 5/5:取一组数值的 p 分位数(percentile)。
// 分位数要先把数据「按数字升序」排好再按比例取下标 ——
// ⚠️ 内置真实 bug:裸 .sort() 按字典序排数字,排序错了分位下标就取错值。
//    percentile([10,2,100,5,9], 50) 期望中位数 9,裸 sort 排成 [10,100,2,5,9] 取到错值。
//    percentile.test.cjs 必挂。
function percentile(values, p) {
  // BUG:缺数字比较器 (a,b)=>a-b,排序错 → 分位取值错。
  const sorted = values.slice().sort();
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}
module.exports = { percentile };
