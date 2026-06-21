// 从失败的 `node test.cjs` stderr 抽取「归一化」错误信号 = 免疫识别签名(抗体的 trigger)。
// 关键工程:剥掉随变体变化的"接收者/变量名",只留 [错误类型, 稳定症状短语],
// 让同一病原家族的不同变体产生相同 signals → 高 recall 命中率(呼应官网 96.24% Search Hit Rate)。
export function extractSignals(stderr) {
  const text = String(stderr || '');
  const m = text.match(/\b(TypeError|ReferenceError|RangeError|SyntaxError|Error)\b:?\s*([^\n]*)/);
  if (!m) return ['UnknownError', 'unknown failure'];
  const type = m[1];
  const msg = (m[2] || '').trim();
  let norm;
  let mm;
  if ((mm = msg.match(/([A-Za-z_$][\w$]*) is not a function/))) {
    norm = `${mm[1]} is not a function`;            // "items.append is not a function" -> "append is not a function"
  } else if (/Cannot read propert/i.test(msg)) {
    const what = msg.match(/of (\w+)/i);
    norm = `cannot read properties of ${what ? what[1].toLowerCase() : 'value'}`;
  } else if (/is not defined/.test(msg)) {
    norm = 'is not defined';                         // 丢掉随变体变化的符号名
  } else if (/Maximum call stack/i.test(msg)) {
    norm = 'maximum call stack size exceeded';
  } else if (/^AssertionError/i.test(msg)) {
    norm = 'assertion failed';
  } else {
    norm = msg.toLowerCase().replace(/['"`].*$/, '').slice(0, 60).trim() || 'runtime error';
  }
  return [type, norm];
}

export function signalKey(signals) {
  return [...signals].sort().join('|');
}
