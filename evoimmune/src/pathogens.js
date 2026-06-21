// 病原工厂 Pathogen Forge:每个"家族"是一类可被「单一变换」治愈的 bug,
// 自然抛出稳定签名的运行时错误。gen(i) 产出变体(变量名/数据不同,bug 症状一致),
// patch 是治愈该家族所有变体的变换 = 抗体载荷(antibody payload)。
// 校验命令统一 `node test.cjs`(契合 evolver 沙箱白名单:只允许 node)。
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export const FAMILIES = [
  {
    id: 'gene_array_append',
    name: '幽灵方法 .append()',
    emoji: '🧬',
    patch: (src) => src.split('.append(').join('.push('),
    gen(i) {
      const fn = `collect${i}`, arr = `bucket${i}`, n = 4 + (i % 5);
      const want = (n * (n + 1)) / 2;
      return {
        signalsHint: ['TypeError', 'append is not a function'],
        files: {
          'solution.cjs':
            `function ${fn}(n){\n  const ${arr}=[];\n  for(let k=1;k<=n;k++) ${arr}.append(k);\n  return ${arr}.reduce((a,b)=>a+b,0);\n}\nmodule.exports={${fn}};\n`,
          'test.cjs':
            `const {${fn}}=require('./solution.cjs');\nconst got=${fn}(${n});\nconst want=${want};\nif(got!==want){console.error('AssertionError: expected '+want+' got '+got);process.exit(1);}\nconsole.log('PASS');\n`,
        },
      };
    },
  },
  {
    id: 'gene_length_call',
    name: '把属性当函数 .length()',
    emoji: '📏',
    patch: (src) => src.split('.length()').join('.length'),
    gen(i) {
      const fn = `sizeOf${i}`, v = `data${i}`, len = 3 + (i % 6);
      return {
        signalsHint: ['TypeError', 'length is not a function'],
        files: {
          'solution.cjs':
            `function ${fn}(){\n  const ${v}=Array.from({length:${len}},(_,x)=>x);\n  return ${v}.length();\n}\nmodule.exports={${fn}};\n`,
          'test.cjs':
            `const {${fn}}=require('./solution.cjs');\nconst got=${fn}();\nif(got!==${len}){console.error('AssertionError: expected ${len} got '+got);process.exit(1);}\nconsole.log('PASS');\n`,
        },
      };
    },
  },
  {
    id: 'gene_to_string_case',
    name: '大小写写错 .tostring()',
    emoji: '🔤',
    patch: (src) => src.split('.tostring(').join('.toString('),
    gen(i) {
      const fn = `label${i}`, num = 100 + i;
      return {
        signalsHint: ['TypeError', 'tostring is not a function'],
        files: {
          'solution.cjs':
            `function ${fn}(){\n  const v=${num};\n  return v.tostring();\n}\nmodule.exports={${fn}};\n`,
          'test.cjs':
            `const {${fn}}=require('./solution.cjs');\nconst got=${fn}();\nif(got!=='${num}'){console.error('AssertionError: expected ${num} got '+got);process.exit(1);}\nconsole.log('PASS');\n`,
        },
      };
    },
  },
  {
    id: 'gene_to_upper',
    name: '大小写写错 .touppercase()',
    emoji: '🔠',
    patch: (src) => src.split('.touppercase(').join('.toUpperCase('),
    gen(i) {
      const fn = `shout${i}`, w = `code${i}`;
      return {
        signalsHint: ['TypeError', 'touppercase is not a function'],
        files: {
          'solution.cjs':
            `function ${fn}(){\n  const s='${w}';\n  return s.touppercase();\n}\nmodule.exports={${fn}};\n`,
          'test.cjs':
            `const {${fn}}=require('./solution.cjs');\nconst got=${fn}();\nif(got!=='${w.toUpperCase()}'){console.error('AssertionError: expected ${w.toUpperCase()} got '+got);process.exit(1);}\nconsole.log('PASS');\n`,
        },
      };
    },
  },
  {
    id: 'gene_index_of',
    name: '大小写写错 .indexof()',
    emoji: '🔎',
    patch: (src) => src.split('.indexof(').join('.indexOf('),
    gen(i) {
      const fn = `find${i}`, target = 100 + i;
      return {
        signalsHint: ['TypeError', 'indexof is not a function'],
        files: {
          'solution.cjs':
            `function ${fn}(){\n  const a=[7,8,9,${target}];\n  return a.indexof(${target});\n}\nmodule.exports={${fn}};\n`,
          'test.cjs':
            `const {${fn}}=require('./solution.cjs');\nconst got=${fn}();\nif(got!==3){console.error('AssertionError: expected 3 got '+got);process.exit(1);}\nconsole.log('PASS');\n`,
        },
      };
    },
  },
  {
    id: 'gene_const_reassign',
    name: 'const 被重新赋值',
    emoji: '🔒',
    patch: (src) => src.split('const acc').join('let acc'),
    gen(i) {
      const fn = `total${i}`, n = 4 + i, want = (n * (n + 1)) / 2;
      return {
        signalsHint: ['TypeError', 'assignment to constant variable.'],
        files: {
          'solution.cjs':
            `function ${fn}(n){\n  const acc=0;\n  for(let k=1;k<=n;k++){ acc=acc+k; }\n  return acc;\n}\nmodule.exports={${fn}};\n`,
          'test.cjs':
            `const {${fn}}=require('./solution.cjs');\nconst got=${fn}(${n});\nif(got!==${want}){console.error('AssertionError: expected ${want} got '+got);process.exit(1);}\nconsole.log('PASS');\n`,
        },
      };
    },
  },
];

export const FAMILY_BY_ID = Object.fromEntries(FAMILIES.map((f) => [f.id, f]));

export function materialize(dir, files) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) writeFileSync(resolve(dir, name), content);
}

// 对工作区的 solution.cjs 施加任意变换(抗体载荷的统一执行口)
export function transformSolution(dir, fn) {
  const file = resolve(dir, 'solution.cjs');
  writeFileSync(file, fn(readFileSync(file, 'utf8')));
}

// 应用真抗体载荷(家族变换)治愈一个工作区
export function applyPatch(dir, family) {
  transformSolution(dir, family.patch);
}

// 伪抗体载荷:自报治愈,实则只加注释、不修 bug(模拟论文里 84% 的"水校验"抗体)
export const FAKE_PATCH = (src) => `// ✅ auto-fixed by antibody (self-reported score 0.99)\n${src}`;

// validation 命令 = `node test.cjs`
export function runValidation(dir) {
  const r = spawnSync('node', ['test.cjs'], { cwd: dir, encoding: 'utf8', timeout: 60000 });
  const ok = r.status === 0;
  return { ok, stdout: r.stdout || '', stderr: (r.stderr || '') + (r.error ? ` ${r.error.message}` : '') };
}
