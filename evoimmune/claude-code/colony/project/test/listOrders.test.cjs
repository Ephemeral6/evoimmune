// listOrders 测试 —— 编码 G2 + G1 + G4。
// 独立运行:node test/listOrders.test.cjs

const { handlerPath, assert, runTest } = require('./_helpers.cjs');
const server = require('../src/server.cjs');
const store = require('../src/store.cjs');
const { toISO } = require('../src/dates.cjs');

const ISO_LOOSE = /\dT\d.*Z$/;

runTest('listOrders', async () => {
  server._reset();
  store._reset();

  // G2:未跑 codegen -> Cannot find module ... generated/validators
  require(handlerPath('listOrders'));

  // 预置两条订单(createdAt 用 ISO)。
  store.create({
    customer: '王五',
    amount: 100,
    currency: 'CNY',
    refunded: 0,
    status: 'paid',
    createdAt: toISO(new Date('2026-06-20T01:02:03Z')),
  });
  store.create({
    customer: '赵六',
    amount: 200,
    currency: 'CNY',
    refunded: 0,
    status: 'paid',
    createdAt: toISO(new Date('2026-06-21T04:05:06Z')),
  });

  // ---- 正常路径:列出全部 ----
  const ok = await server.dispatch('GET', '/orders', {});
  assert(ok && ok.status === 'ok', `expected ok envelope, got ${JSON.stringify(ok)}`);
  const rows = ok.data;
  assert(Array.isArray(rows) && rows.length === 2, `expected 2 rows, got ${JSON.stringify(rows)}`);

  // G4:每条 createdAt 必须是 ISO-8601 UTC(带 Z)。
  for (const r of rows) {
    assert(
      typeof r.createdAt === 'string' && ISO_LOOSE.test(r.createdAt),
      `date must be ISO-8601 (row createdAt=${JSON.stringify(r.createdAt)})`
    );
  }

  // ---- G1:坏路由应得错误信封而非逃逸异常 ----
  let bad;
  try {
    bad = await server.dispatch('GET', '/orders/__no_such_route__', {});
  } catch (e) {
    throw new Error(
      'handler must be wrapped with asyncHandler (dispatch threw instead of returning an error envelope)'
    );
  }
  assert(
    bad && bad.status === 'error',
    'handler must be wrapped with asyncHandler (unknown route should return an error envelope)'
  );
});
