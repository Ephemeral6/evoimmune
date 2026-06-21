// 真实测试:rankByScore 把分数从小到大排成榜(数字升序)。
// 真实数据含两位/三位数,字典序 buggy 版必挂;传比较器 (a,b)=>a-b 的 fixed 版必过。
// 跑法:node rankByScore.test.cjs   exit 0 = 过。
const { rankByScore } = require('./rankByScore.cjs');
const got = JSON.stringify(rankByScore([10, 2, 100, 5, 9]));
const want = JSON.stringify([2, 5, 9, 10, 100]);
if (got !== want) {
  console.error('Error: numeric sort mismatch');
  console.error('  input=[10,2,100,5,9] expected ' + want + ' got ' + got);
  process.exit(1);
}
console.log('PASS');
