// 验证闸门(harness 脊柱):自建 FAIL_TO_PASS + PASS_TO_PASS,不信平台 GDI/自报。
// test.cjs  = 目标测试(修复前失败、修复后必须通过)
// regress.cjs = 回归测试(若存在;过度拟合的"假修复"会被它抓出)
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

function runNode(dir, file) {
  const r = spawnSync('node', [file], { cwd: dir, encoding: 'utf8', timeout: 60000 });
  return { ok: r.status === 0, out: r.stdout || '', err: (r.stderr || '') + (r.error ? ` ${r.error.message}` : '') };
}

export function validate(dir) {
  const target = runNode(dir, 'test.cjs');
  let passToPass = true, regressOut = '', regressSkipped = true;
  if (existsSync(resolve(dir, 'regress.cjs'))) {
    const r = runNode(dir, 'regress.cjs');
    passToPass = r.ok; regressOut = r.err || r.out; regressSkipped = false;
  }
  return {
    ok: target.ok && passToPass,
    failToPass: target.ok,
    passToPass,
    regressSkipped,
    output: target.err || target.out,
    regressOut,
  };
}

export function firstError(s) {
  return String(s || '').split('\n').map((l) => l.trim()).find(Boolean)?.slice(0, 180) || '(无输出)';
}
