// 真实测试:leaderboard 玩家积分排行榜,按积分从高到低(数字降序)。
// 真实数据含两位数,字典序 buggy 版必挂;传比较器 (a,b)=>b-a 的 fixed 版必过。
// 跑法:node leaderboard.test.cjs   exit 0 = 过。
const { leaderboard } = require('./leaderboard.cjs');
const got = JSON.stringify(leaderboard([3, 30, 1, 21, 4]));
const want = JSON.stringify([30, 21, 4, 3, 1]);
if (got !== want) {
  console.error('Error: numeric sort mismatch');
  console.error('  input=[3,30,1,21,4] expected ' + want + ' got ' + got);
  process.exit(1);
}
console.log('PASS');
