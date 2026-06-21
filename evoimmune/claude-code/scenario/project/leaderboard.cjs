// 数据看板 · 指标模块 4/5:玩家积分排行榜,按积分从高到低(降序排行)。
// ⚠️ 内置真实 bug:裸 .sort() 按字典序排数字,降序也要靠比较器 (a,b)=>b-a ——
//    leaderboard([3,30,1,21,4]) 期望 [30,21,4,3,1],裸 sort 既乱序又没降序。
//    leaderboard.test.cjs 必挂。
function leaderboard(points) {
  // BUG:缺数字比较器;降序需 (a,b)=>b-a。
  return points.slice().sort().reverse();
}
module.exports = { leaderboard };
