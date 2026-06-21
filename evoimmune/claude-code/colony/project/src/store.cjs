// 内存订单存储。提供 create / get / list / update。
// 注意:store 只负责存取,不做约定校验——校验由 handler 用各工具完成。
// 但 store 会原样保留你存进来的值,所以违反约定(浮点金额/裸日期)能被测试在读出时抓到。

const ORDERS = new Map(); // id -> order
let SEQ = 0;

function _genId() {
  SEQ += 1;
  return `ord_${String(SEQ).padStart(4, '0')}`;
}

// 新建订单。传入的 order 应已包含约定要求的字段(整数分金额、ISO 日期)。
function create(order) {
  const id = order.id || _genId();
  const rec = { ...order, id };
  ORDERS.set(id, rec);
  return rec;
}

function get(id) {
  return ORDERS.get(id) || null;
}

// 列出全部(按插入顺序)。
function list() {
  return Array.from(ORDERS.values());
}

// 部分更新,返回更新后的记录;不存在返回 null。
function update(id, patch) {
  const cur = ORDERS.get(id);
  if (!cur) return null;
  const next = { ...cur, ...patch, id };
  ORDERS.set(id, next);
  return next;
}

// 清空(测试隔离用)。
function _reset() {
  ORDERS.clear();
  SEQ = 0;
}

module.exports = { create, get, list, update, _reset };
