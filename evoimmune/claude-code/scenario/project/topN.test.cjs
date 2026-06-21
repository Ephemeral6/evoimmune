// 真实测试:topN 取分数最高的前 N 名(数字降序的前 N)。
// 真实数据含两位/三位数,字典序 buggy 版必挂;传比较器 (a,b)=>b-a 的 fixed 版必过。
// 跑法:node topN.test.cjs   exit 0 = 过。
const { topN } = require('./topN.cjs');
const got = JSON.stringify(topN([10, 2, 100, 5, 9], 3));
const want = JSON.stringify([100, 10, 9]);
if (got !== want) {
  console.error('Error: numeric sort mismatch');
  console.error('  input=[10,2,100,5,9] n=3 expected ' + want + ' got ' + got);
  process.exit(1);
}
console.log('PASS');
