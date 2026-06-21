// 金额工具 (G3)。
// 约定:金额一律以"整数分"存储与流转。绝不存浮点元。
//   - toCents(x):把"元"(可为字符串或数字)转成整数分。
//   - formatMoney(cents):把整数分格式化成 "¥12.34" 风格字符串。
//   - assertCents(cents):断言是整数分,否则抛含稳定短语的错误。

// 元 -> 整数分。四舍五入到分,避免浮点尾差。
function toCents(yuan) {
  const n = typeof yuan === 'string' ? Number(yuan) : yuan;
  if (typeof n !== 'number' || !Number.isFinite(n)) {
    const err = new Error('amount must be integer cents (got non-number)');
    err.code = 'BAD_AMOUNT';
    throw err;
  }
  return Math.round(n * 100);
}

// 断言:存储/返回的金额必须是整数分。
// 违反 G3(用浮点/元)时抛出,稳定短语:amount must be integer cents
function assertCents(cents) {
  if (typeof cents !== 'number' || !Number.isInteger(cents)) {
    const err = new Error(
      `amount must be integer cents (got ${JSON.stringify(cents)})`
    );
    err.code = 'BAD_AMOUNT';
    throw err;
  }
  return cents;
}

// 整数分 -> 展示字符串。
function formatMoney(cents) {
  assertCents(cents);
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const yuan = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  return `${sign}¥${yuan}.${frac}`;
}

module.exports = { toCents, formatMoney, assertCents };
