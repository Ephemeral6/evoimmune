// 真实世界 bug 语料(realbugs corpus):每个 case 是一类在真实开源代码里反复出现的坑,
// 带最小复现源码 + 真失败测试(FAIL_TO_PASS)+ 回归测试(PASS_TO_PASS)。
// 契约对齐 SWE-bench:
//   failToPass(test.cjs)   = buggy 上失败、fixed 上通过(证明真修好)
//   passToPass(regress.cjs)= buggy 与 fixed 上都通过(拦截过拟合补丁)
// 每个 case 还给一个 wrongPatch:过拟合的假修复,过 FAIL_TO_PASS 但破坏 PASS_TO_PASS。
// real_world 字段诚实标注 bug 类型与真实出处,不编造具体 issue/commit 号。

export const CASES = [
  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'array_sort_numeric',
    name: 'Array.sort() 默认字典序排数字',
    real_world:
      'JS 经典坑:Array.prototype.sort() 默认按字符串(字典序)比较,[1,10,2].sort() 得 [1,10,2]。' +
      '该类 bug 在排行榜/分页/价格排序等真实业务代码中反复出现,MDN 专门为此举例告警。',
    // buggy:直接 .sort(),数字被当字符串排
    buggy:
      'function rankByScore(scores){\n' +
      '  return scores.slice().sort();\n' +
      '}\n' +
      'module.exports={rankByScore};\n',
    // fixed:传数字比较器
    fixed:
      'function rankByScore(scores){\n' +
      '  return scores.slice().sort((a,b)=>a-b);\n' +
      '}\n' +
      'module.exports={rankByScore};\n',
    // 过拟合假修复:硬编码 test 的预期数组 → 过 test,但 regress 的另一组数据挂
    wrongPatch:
      'function rankByScore(scores){\n' +
      '  return [2,5,9,10,100];\n' +
      '}\n' +
      'module.exports={rankByScore};\n',
    // FAIL_TO_PASS:含两位/三位数的乱序数组,字典序会把 10、100 排到前面
    failToPass:
      "const {rankByScore}=require('./solution.cjs')\n" +
      'const got=JSON.stringify(rankByScore([10,2,100,5,9]))\n' +
      'const want=JSON.stringify([2,5,9,10,100])\n' +
      "if(got!==want){console.error('Error: numeric sort mismatch')\n" +
      "console.error('  input=[10,2,100,5,9] expected '+want+' got '+got)\n" +
      'process.exit(1)}\n' +
      "console.log('PASS')\n",
    // PASS_TO_PASS:另一组数据,确认是通用数字排序而非硬编码
    passToPass:
      "const {rankByScore}=require('./solution.cjs')\n" +
      'const got=JSON.stringify(rankByScore([3,30,1,21,4]))\n' +
      'const want=JSON.stringify([1,3,4,21,30])\n' +
      "if(got!==want){console.error('Regress: numeric sort mismatch on second dataset')\n" +
      "console.error('  input=[3,30,1,21,4] expected '+want+' got '+got)\n" +
      'process.exit(1)}\n' +
      "console.log('PASS')\n",
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'parseint_radix',
    name: 'parseInt 缺 radix 误把 0x 前缀当十六进制',
    real_world:
      'parseInt 不传 radix 时,"0x"/"0X" 前缀会被当十六进制解析:parseInt("0x1A")===26,' +
      '而显式十进制 parseInt("0x1A",10)===0(到 "x" 截断)。eslint 的 radix 规则正是为此而设;' +
      '解析用户输入的编号/数量串时若混入形如 "0x.." 的脏数据,缺 radix 会得到意外大数,该类坑在真实代码中常见。',
    // buggy:parseInt 不传 radix,"0x1A" 被当十六进制 → 26
    buggy:
      'function parseQty(s){\n' +
      '  return parseInt(s);\n' +
      '}\n' +
      'module.exports={parseQty};\n',
    // fixed:显式十进制,"0x1A" 按 base-10 解析,遇 "x" 截断 → 0
    fixed:
      'function parseQty(s){\n' +
      '  return parseInt(s, 10);\n' +
      '}\n' +
      'module.exports={parseQty};\n',
    // 过拟合假修复:只对 test 用例特判返回 0 → 过 test,但 regress 的另一个 0x 串仍走缺 radix 老路,挂
    wrongPatch:
      'function parseQty(s){\n' +
      "  if(s==='0x1A') return 0\n" +
      '  return parseInt(s)\n' +
      '}\n' +
      'module.exports={parseQty};\n',
    // FAIL_TO_PASS:'0x1A' 应按十进制解析为 0(buggy 缺 radix 会得 26)
    failToPass:
      "const {parseQty}=require('./solution.cjs')\n" +
      "const got=parseQty('0x1A')\n" +
      'const want=0\n' +
      "if(got!==want){console.error('Error: parseInt radix mismatch')\n" +
      "console.error('  input=0x1A expected '+want+' got '+got)\n" +
      'process.exit(1)}\n' +
      "console.log('PASS')\n",
    // PASS_TO_PASS:另一个 0x 脏串 '0xFF' 同样应为 0,且正常十进制 '42' 仍为 42(拦特判式过拟合)
    passToPass:
      "const {parseQty}=require('./solution.cjs')\n" +
      "const g1=parseQty('0xFF')\n" +
      "if(g1!==0){console.error('Regress: parseInt radix mismatch on 0xFF')\n" +
      "console.error('  input=0xFF expected 0 got '+g1)\n" +
      'process.exit(1)}\n' +
      "const g2=parseQty('42')\n" +
      "if(g2!==42){console.error('Regress: normal decimal parse broken')\n" +
      "console.error('  input=42 expected 42 got '+g2)\n" +
      'process.exit(1)}\n' +
      "console.log('PASS')\n",
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'float_money_rounding',
    name: '浮点金额未分位取整(0.1+0.2 类误差)',
    real_world:
      'IEEE-754 浮点累加误差:0.1+0.2===0.30000000000000004。在真实电商/财务代码里直接用浮点累加金额、' +
      '不做分位(cents)取整,会导致小数尾巴和对账偏差。这是金额处理的头号经典坑,业界普遍建议按整数分计算。',
    // buggy:浮点直接累加,返回带尾巴的数
    buggy:
      'function sumPrices(prices){\n' +
      '  let total=0\n' +
      '  for(const p of prices) total=total+p\n' +
      '  return total\n' +
      '}\n' +
      'module.exports={sumPrices};\n',
    // fixed:按分(cents)累加后再还原为元,消除浮点尾巴
    fixed:
      'function sumPrices(prices){\n' +
      '  let cents=0\n' +
      '  for(const p of prices) cents=cents+Math.round(p*100)\n' +
      '  return cents/100\n' +
      '}\n' +
      'module.exports={sumPrices};\n',
    // 过拟合假修复:只对 test 那组返回硬编码 → 过 test,regress 另一组挂
    wrongPatch:
      'function sumPrices(prices){\n' +
      '  if(prices.length===2) return 0.3\n' +
      '  let total=0\n' +
      '  for(const p of prices) total=total+p\n' +
      '  return total\n' +
      '}\n' +
      'module.exports={sumPrices};\n',
    // FAIL_TO_PASS:0.1+0.2 必须严格等于 0.3
    failToPass:
      "const {sumPrices}=require('./solution.cjs')\n" +
      'const got=sumPrices([0.1,0.2])\n' +
      'const want=0.3\n' +
      "if(got!==want){console.error('Error: float money rounding mismatch')\n" +
      "console.error('  input=[0.1,0.2] expected '+want+' got '+got)\n" +
      'process.exit(1)}\n' +
      "console.log('PASS')\n",
    // PASS_TO_PASS:另一组同样有尾巴的金额,必须精确为 0.6
    passToPass:
      "const {sumPrices}=require('./solution.cjs')\n" +
      'const got=sumPrices([0.1,0.2,0.3])\n' +
      'const want=0.6\n' +
      "if(got!==want){console.error('Regress: float money rounding mismatch on second dataset')\n" +
      "console.error('  input=[0.1,0.2,0.3] expected '+want+' got '+got)\n" +
      'process.exit(1)}\n' +
      "console.log('PASS')\n",
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'proto_pollution_merge',
    name: '对象深合并的原型污染(__proto__)',
    real_world:
      '原型污染(prototype pollution):深合并/深拷贝时不过滤 __proto__ 键,攻击者可污染 Object.prototype。' +
      '该类 CVE 在 lodash.merge、jQuery.extend、minimist 等真实库的历史上多次出现,是 Web 安全的经典漏洞类型。',
    // buggy:深合并不过滤 __proto__,污染全局原型
    buggy:
      'function deepMerge(target, src){\n' +
      '  for(const k in src){\n' +
      "    if(src[k] && typeof src[k]==='object'){\n" +
      '      target[k]=target[k]||{}\n' +
      '      deepMerge(target[k], src[k])\n' +
      '    } else {\n' +
      '      target[k]=src[k]\n' +
      '    }\n' +
      '  }\n' +
      '  return target\n' +
      '}\n' +
      'module.exports={deepMerge};\n',
    // fixed:跳过危险键(__proto__/constructor/prototype)
    fixed:
      'function deepMerge(target, src){\n' +
      '  for(const k in src){\n' +
      "    if(k==='__proto__'||k==='constructor'||k==='prototype') continue\n" +
      "    if(src[k] && typeof src[k]==='object'){\n" +
      '      target[k]=target[k]||{}\n' +
      '      deepMerge(target[k], src[k])\n' +
      '    } else {\n' +
      '      target[k]=src[k]\n' +
      '    }\n' +
      '  }\n' +
      '  return target\n' +
      '}\n' +
      'module.exports={deepMerge};\n',
    // 过拟合假修复:只在合并后手动删掉被污染的 polluted 键 → 过 test,
    // 但 regress 用另一个键名 hacked 时原型仍被污染,挂。
    wrongPatch:
      'function deepMerge(target, src){\n' +
      '  for(const k in src){\n' +
      "    if(src[k] && typeof src[k]==='object'){\n" +
      '      target[k]=target[k]||{}\n' +
      '      deepMerge(target[k], src[k])\n' +
      '    } else {\n' +
      '      target[k]=src[k]\n' +
      '    }\n' +
      '  }\n' +
      '  delete Object.prototype.polluted\n' +
      '  return target\n' +
      '}\n' +
      'module.exports={deepMerge};\n',
    // FAIL_TO_PASS:合并恶意 payload 后,普通对象不应冒出 polluted 属性
    failToPass:
      "const {deepMerge}=require('./solution.cjs')\n" +
      'const payload=JSON.parse(\'{"__proto__":{"polluted":"yes"}}\')\n' +
      'deepMerge({}, payload)\n' +
      'const victim={}\n' +
      "if(victim.polluted!==undefined){console.error('Error: prototype pollution via __proto__')\n" +
      "console.error('  Object.prototype.polluted leaked: '+victim.polluted)\n" +
      'process.exit(1)}\n' +
      "console.log('PASS')\n",
    // PASS_TO_PASS:用另一个键名验证原型未被污染 + 正常合并仍工作
    passToPass:
      "const {deepMerge}=require('./solution.cjs')\n" +
      'const payload=JSON.parse(\'{"__proto__":{"hacked":"yes"}}\')\n' +
      'deepMerge({}, payload)\n' +
      'const victim={}\n' +
      "if(victim.hacked!==undefined){console.error('Regress: prototype still polluted via different key')\n" +
      'process.exit(1)}\n' +
      'const merged=deepMerge({a:1,nested:{x:1}}, {b:2,nested:{y:2}})\n' +
      'const ok=merged.a===1 && merged.b===2 && merged.nested.x===1 && merged.nested.y===2\n' +
      "if(!ok){console.error('Regress: normal deep merge broken')\n" +
      "console.error('  got '+JSON.stringify(merged))\n" +
      'process.exit(1)}\n' +
      "console.log('PASS')\n",
  },

  // ───────────────────────────────────────────────────────────────────────
  {
    id: 'includes_nan',
    name: 'indexOf 找不到 NaN(应用 includes)',
    real_world:
      'Array.prototype.indexOf 用严格相等(===)比较,而 NaN!==NaN,所以 indexOf(NaN) 永远返回 -1。' +
      'includes 用 SameValueZero 能正确匹配 NaN。该差异是 ES2016 引入 includes 的直接动因,' +
      '在做"数组是否含某值"的去重/校验逻辑里真实踩坑。',
    // buggy:用 indexOf!==-1 判断包含,对 NaN 失效
    buggy:
      'function hasValue(arr, v){\n' +
      '  return arr.indexOf(v)!==-1\n' +
      '}\n' +
      'module.exports={hasValue};\n',
    // fixed:用 includes(SameValueZero)
    fixed:
      'function hasValue(arr, v){\n' +
      '  return arr.includes(v)\n' +
      '}\n' +
      'module.exports={hasValue};\n',
    // 过拟合假修复:只对 NaN 特判返回 true → 过 test,但 regress 里
    // 数组不含 NaN 时仍被判为含有(误报),挂。
    wrongPatch:
      'function hasValue(arr, v){\n' +
      '  if(Number.isNaN(v)) return true\n' +
      '  return arr.indexOf(v)!==-1\n' +
      '}\n' +
      'module.exports={hasValue};\n',
    // FAIL_TO_PASS:数组含 NaN,查 NaN 应为 true(indexOf 会给 false)
    failToPass:
      "const {hasValue}=require('./solution.cjs')\n" +
      'const got=hasValue([1,NaN,3], NaN)\n' +
      'const want=true\n' +
      "if(got!==want){console.error('Error: NaN membership mismatch')\n" +
      "console.error('  arr=[1,NaN,3] query=NaN expected '+want+' got '+got)\n" +
      'process.exit(1)}\n' +
      "console.log('PASS')\n",
    // PASS_TO_PASS:数组不含 NaN 时查 NaN 必须为 false(拦截"无脑返回 true"的过拟合)
    passToPass:
      "const {hasValue}=require('./solution.cjs')\n" +
      'const g1=hasValue([1,2,3], NaN)\n' +
      "if(g1!==false){console.error('Regress: false positive for NaN on array without NaN')\n" +
      "console.error('  arr=[1,2,3] query=NaN expected false got '+g1)\n" +
      'process.exit(1)}\n' +
      'const g2=hasValue([1,2,3], 2)\n' +
      "if(g2!==true){console.error('Regress: normal membership broken')\n" +
      "console.error('  arr=[1,2,3] query=2 expected true got '+g2)\n" +
      'process.exit(1)}\n' +
      "console.log('PASS')\n",
  },
];

export const CASE_BY_ID = Object.fromEntries(CASES.map((c) => [c.id, c]));
