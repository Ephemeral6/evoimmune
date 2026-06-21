// 给共享免疫库(claude-code/.immunedata/)预置几颗常见抗体,
// 让"真实 Claude Code 现场体验"一开始就能 recall 命中(否则空库前期不命中)。
// 用法:node claude-code/seed.mjs
import { openImmuneGep, sedimentAntibody } from './immunity.mjs';

const gep = await openImmuneGep('evoimmune-seed');
try {
  // ① Python/JS 串味:Array 没有 .append
  await sedimentAntibody({
    error: 'TypeError: cart.append is not a function',
    fix: '把 Array 上的 .append(x) 改成 .push(x)(JS 数组无 append 方法,append 是 Python list 的 API)',
    hint: 'Array 没有 append 方法,用 push',
    gep,
  });
  // ② 数字排序字典序坑(对应 scenario/ 的 5 个看板函数)
  await sedimentAntibody({
    error: 'Error: numeric sort mismatch',
    fix: 'Array.prototype.sort() 默认按字符串(字典序)排序;数字排序必须传比较器:arr.sort((a,b)=>a-b)',
    hint: '数字排序要传比较器 (a,b)=>a-b',
    gep,
  });
  const st = await gep.status();
  console.log('✅ 已种入抗体。共享免疫库 capsules:', st?.statistics?.total_capsules ?? '?');
  console.log('   现在重启 Claude Code → 让 subagent 跑 scenario,踩到同类报错会自动 recall 命中。');
} finally {
  await gep.close();
}
