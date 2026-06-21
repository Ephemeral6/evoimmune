// GOLD —— listOrders 正确实现(遵守全部约定)。仅供确定性 runner 用。
// 约定:G2(codegen 校验)+ G1(asyncHandler)+ G4(ISO 日期)。

const { asyncHandler, registerRoute } = require('../src/server.cjs');
require('../generated/validators.cjs'); // G2:按约定 require(确保 codegen 已跑)
const { toISO, assertISO } = require('../src/dates.cjs'); // G4
const store = require('../src/store.cjs');

// 业务逻辑:列出全部订单,逐条确保日期 ISO。
const listOrders = asyncHandler(async (/* ctx */) => {
  const rows = store.list().map((rec) => ({
    ...rec,
    createdAt: assertISO(toISO(rec.createdAt)), // G4
  }));
  return { status: 'ok', data: rows };
});

registerRoute('GET', '/orders', listOrders);

module.exports = { listOrders };
