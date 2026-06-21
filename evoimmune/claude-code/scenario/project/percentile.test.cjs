// 真实测试:percentile 取一组数值的 p 分位数(先按数字升序排,再按比例取下标)。
// 真实数据含两位/三位数,字典序 buggy 版排错 → 分位取错值必挂;
// 传比较器 (a,b)=>a-b 的 fixed 版必过。
// 跑法:node percentile.test.cjs   exit 0 = 过。
const { percentile } = require('./percentile.cjs');
const got = percentile([10, 2, 100, 5, 9], 50);
const want = 9; // 升序 [2,5,9,10,100] 的中位数
if (got !== want) {
  console.error('Error: numeric sort mismatch');
  console.error('  input=[10,2,100,5,9] p=50 expected ' + want + ' got ' + got);
  process.exit(1);
}
console.log('PASS');
