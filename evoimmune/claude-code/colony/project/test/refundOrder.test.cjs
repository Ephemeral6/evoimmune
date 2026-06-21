// refundOrder 测试 —— 编码 G2 + G1 + G3。
// 独立运行:node test/refundOrder.test.cjs

const { handlerPath, assert, runTest } = require('./_helpers.cjs');
const server = require('../src/server.cjs');
const store = require('../src/store.cjs');
const { toISO } = require('../src/dates.cjs');

runTest('refundOrder', async () => {
  server._reset();
  store._reset();

  // G2:未跑 codegen -> Cannot find module ... generated/validators
  require(handlerPath('refundOrder'));

  // 预置一条 50.00 元 = 5000 分的订单。
  const seeded = store.create({
    customer: '钱七',
    amount: 5000,
    currency: 'CNY',
    refunded: 0,
    status: 'paid',
    createdAt: toISO(new Date('2026-06-21T00:00:00Z')),
  });

  // ---- 正常路径:退 12.34 元 ----
  const ok = await server.dispatch('POST', '/orders/:id/refund', {
    id: seeded.id,
    amountYuan: 12.34,
  });
  assert(ok && ok.status === 'ok', `expected ok envelope, got ${JSON.stringify(ok)}`);
  const order = ok.data;

  // G3:退款额必须是整数分,且等于预期(12.34 元 = 1234 分)。
  assert(
    typeof order.refunded === 'number' && Number.isInteger(order.refunded),
    'amount must be integer cents (refunded is not an integer)'
  );
  assert(
    order.refunded === 1234,
    `amount must be integer cents (expected refunded 1234, got ${order.refunded})`
  );

  // ---- 坏输入:退款超额,应得错误信封而非逃逸异常 ----
  // G1:handler 必须被 asyncHandler 包裹。
  let bad;
  try {
    bad = await server.dispatch('POST', '/orders/:id/refund', {
      id: seeded.id,
      amountYuan: 9999,
    });
  } catch (e) {
    throw new Error(
      'handler must be wrapped with asyncHandler (over-refund error escaped as a thrown error instead of an error envelope)'
    );
  }
  assert(
    bad && bad.status === 'error',
    'handler must be wrapped with asyncHandler (over-refund should return an error envelope)'
  );
});
