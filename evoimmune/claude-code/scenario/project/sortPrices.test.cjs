// 真实测试:sortPrices 把价格从低到高排序(数字升序)。
// 真实数据含两位/三位数,字典序 buggy 版必挂;传比较器 (a,b)=>a-b 的 fixed 版必过。
// 跑法:node sortPrices.test.cjs   exit 0 = 过。
const { sortPrices } = require('./sortPrices.cjs');
const got = JSON.stringify(sortPrices([99, 5, 250, 30]));
const want = JSON.stringify([5, 30, 99, 250]);
if (got !== want) {
  console.error('Error: numeric sort mismatch');
  console.error('  input=[99,5,250,30] expected ' + want + ' got ' + got);
  process.exit(1);
}
console.log('PASS');
