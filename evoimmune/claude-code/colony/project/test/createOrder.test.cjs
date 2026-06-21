// createOrder 测试 —— 编码 G2 + G1 + G3。
// 独立运行:node test/createOrder.test.cjs
// 任一约定违反 -> 退非 0、stderr 含对应稳定短语。

const { handlerPath, assert, runTest } = require('./_helpers.cjs');
const server = require('../src/server.cjs');

runTest('createOrder', async () => {
  server._reset();
  require('../src/store.cjs')._reset();

  // 加载被测 handler。G2:若未跑 codegen,这里 require 链会抛
  //   Cannot find module ... generated/validators
  require(handlerPath('createOrder'));

  // ---- 正常路径:创建一单 ----
  const ok = await server.dispatch('POST', '/orders', {
    customer: '张三',
    amountYuan: 12.34,
  });
  assert(ok && ok.status === 'ok', `expected ok envelope, got ${JSON.stringify(ok)}`);
  const order = ok.data;

  // G3:存储金额必须是整数分,且等于预期分值(12.34 元 = 1234 分)。
  assert(
    typeof order.amount === 'number' && Number.isInteger(order.amount),
    'amount must be integer cents (stored amount is not an integer)'
  );
  assert(
    order.amount === 1234,
    `amount must be integer cents (expected 1234, got ${order.amount})`
  );

  // ---- 坏输入:必须拿到统一错误信封,而非异常逃逸 ----
  // G1:handler 必须被 asyncHandler 包裹,坏输入才会变成错误信封而不是抛出。
  let bad;
  try {
    bad = await server.dispatch('POST', '/orders', { customer: '', amountYuan: -5 });
  } catch (e) {
    // 错误逃逸到这里 = handler 没包 asyncHandler。
    throw new Error(
      'handler must be wrapped with asyncHandler (bad input escaped as a thrown error instead of an error envelope)'
    );
  }
  assert(
    bad && bad.status === 'error',
    'handler must be wrapped with asyncHandler (bad input should return an error envelope { status: "error", ... })'
  );
});
