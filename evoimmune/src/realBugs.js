// 真实复杂 bug(非平凡):逻辑错误,输出错误而非崩溃,必须读懂期望才能修。
// 每个带:test.cjs(FAIL_TO_PASS 目标)+ regress.cjs(PASS_TO_PASS 回归,抓过度拟合)
//          patch(正解变换)+ wrongPatch(过度拟合的假修复:过 target 但 regress 挂)
export const REAL_BUGS = [
  {
    id: 'realbug_pagination', name: '分页边界错位 (off-by-one)', emoji: '📄',
    buggy_line: 'items.slice(start, start+size-1)  // 少取最后一项',
    fix_line: 'items.slice(start, start+size)',
    patch: (src) => src.split('start+size-1').join('start+size'),
    // 过度拟合:硬编码第 1 页结果 → 过 test(page1)但 regress(page2)挂
    wrongPatch: (src) => src.split('items.slice(start, start+size-1)').join('[items[0], items[1], items[2]]'),
    gen(i) {
      const fn = `page${i}`, n = 8 + i, size = 3;
      const items = Array.from({ length: n }, (_, k) => k + 1);
      const want1 = JSON.stringify(items.slice(0, size));
      const want2 = JSON.stringify(items.slice(size, size * 2));
      const sol = `function ${fn}(items, page, size){\n  const start=(page-1)*size;\n  return items.slice(start, start+size-1);\n}\nmodule.exports={${fn}};\n`;
      return {
        real: true,
        signalsHint: ['Error', 'pagination boundary mismatch'],
        files: {
          'solution.cjs': sol,
          'test.cjs': `const {${fn}}=require('./solution.cjs');\nconst items=${JSON.stringify(items)};\nconst got=JSON.stringify(${fn}(items,1,${size}));\nconst want=${JSON.stringify(want1)};\nif(got!==want){console.error('Error: pagination boundary mismatch');console.error('  page=1 size=${size} expected '+want+' got '+got);process.exit(1);}\nconsole.log('PASS');\n`,
          'regress.cjs': `const {${fn}}=require('./solution.cjs');\nconst items=${JSON.stringify(items)};\nconst got=JSON.stringify(${fn}(items,2,${size}));\nconst want=${JSON.stringify(want2)};\nif(got!==want){console.error('Regress: page 2 boundary mismatch');console.error('  page=2 size=${size} expected '+want+' got '+got);process.exit(1);}\nconsole.log('PASS');\n`,
        },
      };
    },
  },
  {
    id: 'realbug_invoice', name: '发票折扣/税顺序错位', emoji: '🧾',
    buggy_line: 'tax = subtotal * taxRate  // 在未扣折扣的金额上计税',
    fix_line: 'tax = (subtotal - discount) * taxRate',
    patch: (src) => src.split('subtotal*taxRate').join('(subtotal-discount)*taxRate'),
    // 过度拟合:硬编码 test 用例答案 → 过 test 但 regress 挂
    wrongPatch: (src) => src.split('return Math.round((subtotal-discount+tax)*100)/100;').join('return 88;'),
    gen(i) {
      const fn = `invoice${i}`, taxRate = 0.1;
      const s1 = 100 + i * 10, d1 = 20;
      const want1 = Math.round((s1 - d1) * (1 + taxRate) * 100) / 100;
      const s2 = 200 + i * 10, d2 = 50;
      const want2 = Math.round((s2 - d2) * (1 + taxRate) * 100) / 100;
      const sol = `function ${fn}(subtotal, discount, taxRate){\n  const tax=subtotal*taxRate;\n  return Math.round((subtotal-discount+tax)*100)/100;\n}\nmodule.exports={${fn}};\n`;
      return {
        real: true,
        signalsHint: ['Error', 'invoice total mismatch'],
        files: {
          'solution.cjs': sol,
          'test.cjs': `const {${fn}}=require('./solution.cjs');\nconst got=${fn}(${s1}, ${d1}, ${taxRate});\nconst want=${want1};\nif(got!==want){console.error('Error: invoice total mismatch');console.error('  subtotal=${s1} discount=${d1} expected '+want+' got '+got);process.exit(1);}\nconsole.log('PASS');\n`,
          'regress.cjs': `const {${fn}}=require('./solution.cjs');\nconst got=${fn}(${s2}, ${d2}, ${taxRate});\nconst want=${want2};\nif(got!==want){console.error('Regress: invoice total mismatch');console.error('  subtotal=${s2} discount=${d2} expected '+want+' got '+got);process.exit(1);}\nconsole.log('PASS');\n`,
        },
      };
    },
  },
];

export const REALBUG_BY_ID = Object.fromEntries(REAL_BUGS.map((b) => [b.id, b]));
