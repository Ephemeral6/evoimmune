// 日期工具 (G4)。
// 约定:所有对外/入库的日期字段必须是 ISO-8601 UTC 字符串(带 Z)。
//   - toISO(d):把 Date / 时间戳 / 可解析串 转成 ISO-8601 UTC(带 Z)。
//   - assertISO(s):断言字符串是 ISO-8601 UTC(带 Z),否则抛含稳定短语的错误。

// 形如 2026-06-21T12:34:56.000Z
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

// 任意输入 -> ISO-8601 UTC 串。
function toISO(d) {
  let date;
  if (d instanceof Date) {
    date = d;
  } else if (typeof d === 'number') {
    date = new Date(d);
  } else if (typeof d === 'string') {
    date = new Date(d);
  } else {
    const err = new Error('date must be ISO-8601 (unsupported input type)');
    err.code = 'BAD_DATE';
    throw err;
  }
  if (Number.isNaN(date.getTime())) {
    const err = new Error('date must be ISO-8601 (invalid date)');
    err.code = 'BAD_DATE';
    throw err;
  }
  // toISOString 必然输出带 Z 的 UTC 串。
  return date.toISOString();
}

// 断言:必须是 ISO-8601 UTC(带 Z)。
// 违反 G4(裸 Date / 本地串 / 无 Z)时抛出,稳定短语:date must be ISO-8601
function assertISO(s) {
  if (typeof s !== 'string' || !ISO_RE.test(s)) {
    const err = new Error(
      `date must be ISO-8601 (got ${JSON.stringify(s)})`
    );
    err.code = 'BAD_DATE';
    throw err;
  }
  return s;
}

module.exports = { toISO, assertISO, ISO_RE };
