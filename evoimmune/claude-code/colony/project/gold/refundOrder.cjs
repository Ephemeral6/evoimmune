// GOLD —— refundOrder 正确实现(遵守全部约定)。仅供确定性 runner 用。
// 约定:G2(codegen 校验)+ G1(asyncHandler)+ G3(整数分)。

const { asyncHandler, registerRoute } = require('../src/server.cjs');
require('../generated/validators.cjs'); // G2:按约定 require(确保 codegen 已跑)
const { toCents, assertCents } = require('../src/money.cjs'); // G3
const store = require('../src/store.cjs');

// 业务逻辑:对订单退款(整数分),累加退款额,不超过原单。
const refundOrder = asyncHandler(async (ctx) => {
  const id = ctx.body && ctx.body.id;
  if (!id) {
    const err = new Error('missing id');
    err.code = 'VALIDATION';
    throw err;
  }
  const rec = store.get(id);
  if (!rec) {
    const err = new Error(`order not found: ${id}`);
    err.code = 'NOT_FOUND';
    throw err;
  }

  // 退款金额:入参给"元",转整数分。
  const refundCents = assertCents(toCents(ctx.body.amountYuan)); // G3

  const already = rec.refunded || 0;
  if (already + refundCents > rec.amount) {
    const err = new Error('refund exceeds order amount');
    err.code = 'VALIDATION';
    throw err;
  }

  const nextRefunded = assertCents(already + refundCents); // G3:仍是整数分
  const status = nextRefunded >= rec.amount ? 'refunded' : 'partial_refund';
  const updated = store.update(id, { refunded: nextRefunded, status });

  return { status: 'ok', data: updated };
});

registerRoute('POST', '/orders/:id/refund', refundOrder);

module.exports = { refundOrder };
