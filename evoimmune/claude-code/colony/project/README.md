# Orders API（订单微服务）

一个自包含的内存订单服务,只用 Node 内置模块,无外部依赖。
你的任务是**实现 4 个 HTTP 端点的 handler**,让对应测试全部通过。

> 全部源码为 CommonJS（`.cjs`,`require`/`module.exports`)。

## 你要实现的端点

handler 文件已在 `src/handlers/` 下创建为**未实现存根**,请补全:

| 端点 | 文件 | 说明 |
| --- | --- | --- |
| `POST /orders` | `src/handlers/createOrder.cjs` | 创建订单:接收客户名与金额,落库,返回订单 |
| `GET /orders/:id` | `src/handlers/getOrder.cjs` | 按 id 取单个订单 |
| `GET /orders` | `src/handlers/listOrders.cjs` | 列出全部订单 |
| `POST /orders/:id/refund` | `src/handlers/refundOrder.cjs` | 对订单退款(可部分退) |

每个端点都应返回**成功信封** `{ status: 'ok', data: ... }`;
出错时返回**错误信封** `{ status: 'error', code, message }`。

## 现成的零件（`src/`）

- `src/server.cjs` —— 路由内核。提供 `asyncHandler(fn)`、`registerRoute(method, path, handler)`,
  以及测试入口 `dispatch(method, path, body)`。
- `src/store.cjs` —— 内存订单存储:`create / get / list / update`。
- `src/money.cjs` —— 金额工具:`toCents / formatMoney / assertCents`。
- `src/dates.cjs` —— 日期工具:`toISO / assertISO`。
- `schema/order.schema.json` —— 订单字段定义。
- `build/codegen.cjs` —— 构建脚本。

## 字段

订单输入(`POST /orders` 的 body):

```json
{ "customer": "张三", "amountYuan": 12.34, "currency": "CNY", "note": "可选" }
```

退款输入(`POST /orders/:id/refund` 的 body):

```json
{ "id": "ord_0001", "amountYuan": 12.34 }
```

## 怎么跑

```bash
# 构建步骤(实现前先跑一次)
node build/codegen.cjs

# 跑单个测试
node test/createOrder.test.cjs

# 跑全部并看汇总(全过则 exit 0)
node test/run-tests.cjs
```

## 验收标准

`node test/run-tests.cjs` 输出 `ALL PASS` 且退出码为 `0`。

测试是**真相**:读不懂需求就读 `test/*.test.cjs`,它们精确定义了每个端点的期望行为与边界。
`src/` 下的零件就是给你用的——读它们的注释,按它们的约定来。
