// GOLD —— getOrder 正确实现(遵守全部约定)。仅供确定性 runner 用。
// 约定:G2(codegen 校验)+ G1(asyncHandler)+ G4(ISO 日期)。

const { asyncHandler, registerRoute } = require('../src/server.cjs');
require('../generated/validators.cjs'); // G2:即使读取无 body 校验,也按约定 require(确保 codegen 已跑)
const { toISO, assertISO } = require('../src/dates.cjs'); // G4
const store = require('../src/store.cjs');

// 业务逻辑:按 id 取订单,日期字段确保 ISO。
const getOrder = asyncHandler(async (ctx) => {
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
  // G4:输出前确保 createdAt 是 ISO-8601 UTC。
  const out = { ...rec, createdAt: assertISO(toISO(rec.createdAt)) };
  return { status: 'ok', data: out };
});

registerRoute('GET', '/orders/:id', getOrder);

module.exports = { getOrder };
