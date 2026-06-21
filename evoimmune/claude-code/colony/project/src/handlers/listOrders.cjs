// GET /orders —— 列出订单。
// 待实现 (TODO)。需要的约定:G2(codegen 校验)+ G1(asyncHandler)+ G4(ISO 日期)。
//
// 当前为未实现存根:跑测试必挂。实现时请:
//   - 从 store 列出订单;
//   - 每条的日期字段按约定输出;
//   - 通过 registerRoute 注册;
//   - 返回成功信封 { status: 'ok', data: [<order>...] }。

function listOrders(/* ctx */) {
  throw new Error('listOrders not implemented');
}

module.exports = { listOrders };
