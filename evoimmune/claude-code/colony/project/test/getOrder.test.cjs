// getOrder 测试 —— 编码 G2 + G1 + G4。
// 独立运行:node test/getOrder.test.cjs

const { handlerPath, assert, runTest } = require('./_helpers.cjs');
const server = require('../src/server.cjs');
const store = require('../src/store.cjs');
const { toISO } = require('../src/dates.cjs');

// 日期形如 ...T..Z 的正则(G4)。
const ISO_LOOSE = /\dT\d.*Z$/;

runTest('getOrder', async () => {
  server._reset();
  store._reset();

  // G2:未跑 codegen -> require 链抛 Cannot find module ... generated/validators
  require(handlerPath('getOrder'));

  // 预置一条订单(createdAt 用 ISO,符合约定)。
  const seeded = store.create({
    customer: '李四',
    amount: 5000,
    currency: 'CNY',
    refunded: 0,
    status: 'paid',
    createdAt: toISO(new Date('2026-06-21T08:00:00Z')),
  });

  // ---- 正常路径:取到订单 ----
  const ok = await server.dispatch('GET', '/orders/:id', { id: seeded.id });
  assert(ok && ok.status === 'ok', `expected ok envelope, got ${JSON.stringify(ok)}`);
  const order = ok.data;

  // G4:createdAt 必须是 ISO-8601 UTC(带 Z)。裸 Date / 本地串会失败。
  assert(
    typeof order.createdAt === 'string' && ISO_LOOSE.test(order.createdAt),
    `date must be ISO-8601 (createdAt=${JSON.stringify(order.createdAt)})`
  );

  // ---- 坏输入(不存在的 id):必须拿到错误信封,而非异常逃逸 ----
  // G1:handler 必须被 asyncHandler 包裹。
  let bad;
  try {
    bad = await server.dispatch('GET', '/orders/:id', { id: 'nope_404' });
  } catch (e) {
    throw new Error(
      'handler must be wrapped with asyncHandler (missing-order error escaped as a thrown error instead of an error envelope)'
    );
  }
  assert(
    bad && bad.status === 'error',
    'handler must be wrapped with asyncHandler (not-found should return an error envelope)'
  );
});
