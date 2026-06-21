// 测试公共助手。
// 解析被测 handler 的路径:默认 src/handlers/<name>.cjs,
// 可用环境变量 HANDLERS_DIR 覆盖(确定性 runner 指向 gold/ 用)。

const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// 取被测 handler 模块路径。
function handlerPath(name) {
  const dir = process.env.HANDLERS_DIR
    ? path.resolve(PROJECT_ROOT, process.env.HANDLERS_DIR)
    : path.join(PROJECT_ROOT, 'src', 'handlers');
  return path.join(dir, `${name}.cjs`);
}

// 极简断言:失败时 throw(测试主体捕获后 exit 非 0、stderr 打稳定短语)。
function assert(cond, message) {
  if (!cond) {
    throw new Error(message);
  }
}

// 跑一个测试主体:成功打 PASS 退 0,失败把错误打到 stderr 退 1。
function runTest(name, body) {
  Promise.resolve()
    .then(body)
    .then(() => {
      process.stdout.write(`PASS ${name}\n`);
      process.exit(0);
    })
    .catch((err) => {
      // stderr 必须含稳定短语(由各断言负责),供免疫召回做键。
      process.stderr.write(`FAIL ${name}: ${err && err.stack ? err.stack : err}\n`);
      process.exit(1);
    });
}

module.exports = { handlerPath, assert, runTest, PROJECT_ROOT };
