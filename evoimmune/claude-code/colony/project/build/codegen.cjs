// 代码生成步骤 (G2)。
// 读 schema/order.schema.json,生成 generated/validators.cjs(导出 validateOrder)。
// 约定:handler 一律 require('../generated/validators.cjs') 做输入校验。
// generated/ 初始不存在 —— 不先跑 `node build/codegen.cjs` 就 require 会抛
//   Cannot find module ... generated/validators
//
// 用法:node build/codegen.cjs

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'schema', 'order.schema.json');
const OUT_DIR = path.join(ROOT, 'generated');
const OUT_PATH = path.join(OUT_DIR, 'validators.cjs');

function main() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'));
  const required = schema.required || [];
  const props = schema.properties || {};

  // 把 schema 编译成一段独立的校验代码(不依赖运行时 schema 文件)。
  const checks = [];

  for (const field of required) {
    checks.push(
      `  if (body.${field} === undefined || body.${field} === null) {\n` +
      `    return fail('VALIDATION', 'missing required field: ${field}');\n` +
      `  }`
    );
  }

  for (const [name, def] of Object.entries(props)) {
    const lines = [];
    if (def.type === 'string') {
      lines.push(
        `  if (body.${name} !== undefined && typeof body.${name} !== 'string') {\n` +
        `    return fail('VALIDATION', '${name} must be a string');\n` +
        `  }`
      );
      if (typeof def.minLength === 'number') {
        lines.push(
          `  if (typeof body.${name} === 'string' && body.${name}.length < ${def.minLength}) {\n` +
          `    return fail('VALIDATION', '${name} too short');\n` +
          `  }`
        );
      }
      if (typeof def.maxLength === 'number') {
        lines.push(
          `  if (typeof body.${name} === 'string' && body.${name}.length > ${def.maxLength}) {\n` +
          `    return fail('VALIDATION', '${name} too long');\n` +
          `  }`
        );
      }
      if (Array.isArray(def.enum)) {
        const set = JSON.stringify(def.enum);
        lines.push(
          `  if (body.${name} !== undefined && !${set}.includes(body.${name})) {\n` +
          `    return fail('VALIDATION', '${name} not in enum');\n` +
          `  }`
        );
      }
    } else if (def.type === 'number') {
      lines.push(
        `  if (body.${name} !== undefined && typeof body.${name} !== 'number') {\n` +
        `    return fail('VALIDATION', '${name} must be a number');\n` +
        `  }`
      );
      if (typeof def.exclusiveMinimum === 'number') {
        lines.push(
          `  if (typeof body.${name} === 'number' && !(body.${name} > ${def.exclusiveMinimum})) {\n` +
          `    return fail('VALIDATION', '${name} must be > ${def.exclusiveMinimum}');\n` +
          `  }`
        );
      }
    }
    if (lines.length) checks.push(lines.join('\n'));
  }

  const banner =
    '// 自动生成 —— 请勿手改。源: schema/order.schema.json\n' +
    '// 由 build/codegen.cjs 生成。重跑: node build/codegen.cjs\n';

  const code =
    banner +
    '\n' +
    'function fail(code, message) {\n' +
    '  const err = new Error(message);\n' +
    "  err.code = code;\n" +
    '  err.valid = false;\n' +
    '  throw err;\n' +
    '}\n' +
    '\n' +
    '// 校验订单输入。通过返回规范化对象;不通过抛 VALIDATION 错误(由 asyncHandler 兜)。\n' +
    'function validateOrder(body) {\n' +
    "  if (body === null || typeof body !== 'object') {\n" +
    "    return fail('VALIDATION', 'body must be an object');\n" +
    '  }\n' +
    checks.join('\n') +
    '\n' +
    '  return {\n' +
    '    customer: body.customer,\n' +
    '    amountYuan: body.amountYuan,\n' +
    "    currency: body.currency || 'CNY',\n" +
    '    note: body.note,\n' +
    '  };\n' +
    '}\n' +
    '\n' +
    'module.exports = { validateOrder };\n';

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, code, 'utf8');
  process.stdout.write(`[codegen] wrote ${path.relative(ROOT, OUT_PATH)}\n`);
}

main();
