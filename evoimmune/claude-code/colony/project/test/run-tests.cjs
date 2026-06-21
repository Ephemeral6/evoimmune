// 测试总入口:依次跑 4 个测试(各自子进程),打印 PASS/FAIL 汇总。
// exit 0 当且仅当 4 个全过。
// 用法:node test/run-tests.cjs
// 把 handler 指向 gold/:HANDLERS_DIR=gold node test/run-tests.cjs

const path = require('path');
const { spawnSync } = require('child_process');

const TESTS = [
  'createOrder.test.cjs',
  'getOrder.test.cjs',
  'listOrders.test.cjs',
  'refundOrder.test.cjs',
];

function main() {
  const results = [];
  for (const t of TESTS) {
    const file = path.join(__dirname, t);
    // 用 node 子进程独立跑,继承环境变量(HANDLERS_DIR 等)。
    const r = spawnSync(process.execPath, [file], {
      encoding: 'utf8',
      env: process.env,
    });
    const passed = r.status === 0;
    results.push({ name: t, passed, status: r.status });
    // 透传子进程输出,方便定位。
    if (r.stdout) process.stdout.write(r.stdout);
    if (!passed && r.stderr) process.stderr.write(r.stderr);
  }

  process.stdout.write('\n===== SUMMARY =====\n');
  let allPass = true;
  for (const res of results) {
    const tag = res.passed ? 'PASS' : 'FAIL';
    if (!res.passed) allPass = false;
    process.stdout.write(`${tag}  ${res.name}\n`);
  }
  process.stdout.write(`===================\n`);
  process.stdout.write(allPass ? 'ALL PASS\n' : 'SOME FAILED\n');

  process.exit(allPass ? 0 : 1);
}

main();
