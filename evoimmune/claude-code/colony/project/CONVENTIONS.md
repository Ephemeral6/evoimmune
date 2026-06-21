# CONVENTIONS（真相档 · 给 runner / 评审看,不给被测 agent）

本项目焊进 **4 条非显而易见的约定**。一个新 agent 不可能凭空知道,只能 debug 多步发现。
违反每条都产生**各不相同、可被测试捕获的真实报错**——下面给出每条的"报错签名",
可直接当免疫召回(experience recall)的键。

所有报错签名均经过真实运行验证。

---

## G1 · 路由必须用 asyncHandler 包裹

**约定**
`src/server.cjs` 提供 `asyncHandler(fn)`、`registerRoute(method, path, handler)`、`dispatch(method, path, body)`。
handler **必须**先 `asyncHandler(...)` 包裹再 `registerRoute(...)`。
`asyncHandler` 把 handler 抛出的错误转成统一错误信封 `{ status: 'error', code, message }`。

**违反**
直接把裸 `async function` 传给 `registerRoute`(不包 asyncHandler)。

**会发生什么**
`registerRoute` 在注册时检测到 handler 没有包裹标记,当场抛错;
即便绕过注册,裸 handler 抛错也会逃逸,`dispatch` 拿不到错误信封 → "坏输入应返回错误信封"断言失败。

**报错签名(稳定短语)**
```
handler must be wrapped with asyncHandler
```
（实测:`Error: handler must be wrapped with asyncHandler (route POST /orders)`,exit 1）

**正确做法**
```js
const handler = asyncHandler(async (ctx) => { /* ... */ return { status: 'ok', data }; });
registerRoute('POST', '/orders', handler);
```

---

## G2 · 必须先跑代码生成步骤

**约定**
`schema/order.schema.json` 定义订单字段;`build/codegen.cjs` 读它生成 `generated/validators.cjs`
（导出 `validateOrder(body)`)。所有 handler 一律 `require('../generated/validators.cjs')` 做输入校验。

**违反**
不先跑 `node build/codegen.cjs` 就直接跑测试 / require handler。`generated/` 初始**不存在**。

**会发生什么**
require 链解析失败,抛 `Cannot find module`。

**报错签名(稳定短语)**
```
Cannot find module '../generated/validators.cjs'
```
（实测:`Error: Cannot find module '../generated/validators.cjs'`,exit 1)

**正确做法**
实现前先 `node build/codegen.cjs`;handler 里 `const { validateOrder } = require('../generated/validators.cjs')`。

---

## G3 · 金额一律整数分

**约定**
金额**全程以整数分存储与流转**,绝不存浮点"元"。
`src/money.cjs` 提供 `toCents(yuan)`（元→整数分,四舍五入)、`assertCents(cents)`（断言整数分)、`formatMoney(cents)`。
存进 store 的 `amount` / `refunded` 必须是 `Number.isInteger`。

**违反**
把"元"浮点(如 `12.34`)直接当金额入库,或漏掉 `toCents`。

**会发生什么**
存储金额不是整数分,测试 `Number.isInteger(amount)` / 等于预期分值的断言失败。

**报错签名(稳定短语)**
```
amount must be integer cents
```
（实测:`Error: amount must be integer cents (refunded is not an integer)`,exit 1)

**正确做法**
```js
const amount = assertCents(toCents(input.amountYuan)); // 12.34 元 -> 1234 分
```

---

## G4 · 日期一律 ISO-8601 UTC（带 Z)

**约定**
所有对外/入库日期字段必须走 `src/dates.cjs` 的 `toISO(d)`,输出 ISO-8601 UTC 串(带 `Z`)。
`assertISO(s)` 用于断言。

**违反**
用裸 `new Date(...)`、`Date#toString()`、本地时间串等(无 `Z`)。

**会发生什么**
测试用正则 `/\dT\d.*Z$/` 断言日期格式,本地串 / 无 Z 串匹配失败。

**报错签名(稳定短语)**
```
date must be ISO-8601
```
（实测:`Error: date must be ISO-8601 (createdAt="Sun Jun 21 2026 16:00:00 GMT+0800 (China Standard Time)")`,exit 1)

**正确做法**
```js
createdAt: toISO(new Date()),            // 写入
createdAt: assertISO(toISO(rec.createdAt)) // 读出/对外
```

---

## 约定 × handler 矩阵

| handler | 需要的约定 |
| --- | --- |
| `createOrder` | G2 + G1 + G3 |
| `getOrder`    | G2 + G1 + G4 |
| `listOrders`  | G2 + G1 + G4 |
| `refundOrder` | G2 + G1 + G3 |

> G2 是"前置闸门":4 个 handler 都 require 生成的校验器,任意一个不跑 codegen 都先撞 G2。
> G1 是"全局闸门":4 个 handler 都必须包 asyncHandler 才能注册。
> G3 / G4 按业务分流(金额类 vs 日期类),互不重叠。

## gold 参考实现

`gold/` 下是 4 个遵守全部约定的正确实现,供确定性 runner 用,**不给被测 agent 看**。
跑法:先 `node build/codegen.cjs`,再 `HANDLERS_DIR=gold node test/run-tests.cjs` → `ALL PASS`。

## 报错签名速查(免疫召回键)

| 约定 | 稳定短语 | exit |
| --- | --- | --- |
| G2 | `Cannot find module '../generated/validators.cjs'` | 1 |
| G1 | `handler must be wrapped with asyncHandler` | 1 |
| G3 | `amount must be integer cents` | 1 |
| G4 | `date must be ISO-8601` | 1 |

遵守全部约定 → `node test/run-tests.cjs`(handler 指向 gold)`ALL PASS`,exit `0`。
