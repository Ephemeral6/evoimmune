// GOLD —— createOrder 正确实现(遵守全部约定)。仅供确定性 runner 用,不给被测 agent 看。
// 约定:G2(codegen 校验)+ G1(asyncHandler)+ G3(整数分)。

const { asyncHandler, registerRoute } = require('../src/server.cjs');
const { validateOrder } = require('../generated/validators.cjs'); // G2:必须先跑 codegen
const { toCents, assertCents } = require('../src/money.cjs'); // G3
const { toISO } = require('../src/dates.cjs'); // 创建时间也走 ISO
const store = require('../src/store.cjs');

// 业务逻辑:校验输入 -> 金额转整数分 -> 入库。
const createOrder = asyncHandler(async (ctx) => {
  const input = validateOrder(ctx.body); // G2

  const amount = assertCents(toCents(input.amountYuan)); // G3:整数分

  const rec = store.create({
    customer: input.customer,
    amount, // 整数分
    currency: input.currency || 'CNY',
    note: input.note,
    refunded: 0,
    status: 'paid',
    createdAt: toISO(new Date()), // ISO 日期
  });

  return { status: 'ok', data: rec };
});

// 注册路由(G1:必须是包过的 handler)。
registerRoute('POST', '/orders', createOrder);

module.exports = { createOrder };
