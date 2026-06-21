// POST /orders/:id/refund —— 退款。
// 待实现 (TODO)。需要的约定:G2(codegen 校验)+ G1(asyncHandler)+ G3(整数分)。
//
// 当前为未实现存根:跑测试必挂。实现时请:
//   - 校验退款金额(整数分,不超过原单);
//   - 更新 store 中订单状态/退款额;
//   - 通过 registerRoute 注册;
//   - 返回成功信封 { status: 'ok', data: <order> }。

function refundOrder(/* ctx */) {
  throw new Error('refundOrder not implemented');
}

module.exports = { refundOrder };
