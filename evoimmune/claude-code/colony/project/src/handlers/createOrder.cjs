// POST /orders —— 创建订单。
// 待实现 (TODO)。需要的约定:G2(codegen 校验)+ G1(asyncHandler)+ G3(整数分)。
//
// 当前为未实现存根:跑测试必挂。实现时请:
//   - 用 generated 校验器校验 body;
//   - 金额按约定入库;
//   - 通过 registerRoute 注册;
//   - 返回成功信封 { status: 'ok', data: <order> }。

function createOrder(/* ctx */) {
  throw new Error('createOrder not implemented');
}

module.exports = { createOrder };
