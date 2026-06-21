// 预算:harness 的一等公民。限尝试次数 / token,记账 pass@t,供停滞终止。
export function makeBudget({ maxAttempts = 4, maxTokens = Infinity } = {}) {
  let attempts = 0, tokens = 0;
  return {
    get attempts() { return attempts; },
    get tokens() { return tokens; },
    maxAttempts, maxTokens,
    tick() { attempts += 1; },
    spend(t) { tokens += t || 0; },
    canRetry() { return attempts < maxAttempts && tokens < maxTokens; },
  };
}
