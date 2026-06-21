import { Panel } from './ui';

const PHASE: Record<string, { t: string; c: string }> = {
  infected: { t: '① 观察 · 感染确认', c: 'text-red' },
  recall_hit: { t: '② 免疫召回命中', c: 'text-cyan' },
  propose: { t: '③ 提议补丁', c: 'text-ink' },
  validate: { t: '④ 验证闸门', c: 'text-amber' },
  reflect: { t: '⑤ 反思回灌', c: 'text-dim' },
  antibody_rejected: { t: '抗体复检失败·拒收', c: 'text-red' },
  stagnation: { t: '停滞·终止', c: 'text-red' },
  cured: { t: '⑥ 收敛 · 修复', c: 'text-green' },
  failed: { t: '预算耗尽 · 失败', c: 'text-red' },
  healthy: { t: '健康', c: 'text-dim' },
};

export default function HarnessTrace({ data, onRun, running }: { data: any; onRun: () => void; running: boolean }) {
  const m = data?.meta;
  const events = data?.events || [];
  return (
    <Panel title="⚙ EvoImmune Harness · 7 阶段回路" sub="验证驱动(FAIL_TO_PASS + PASS_TO_PASS)· 反思重试 · 预算可控">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button disabled={running} onClick={onRun} className="px-4 py-2 text-sm font-bold disabled:opacity-50" style={{ background: '#E0A93B', color: '#1a130c', borderRadius: 3 }}>
          ▶ 跑一次 Harness(真坑)
        </button>
        {m && <span className="font-tw text-xs text-dim">{m.emoji} {m.name} · {data.real ? '真模型推理' : '离线演示'}</span>}
      </div>
      {m && (
        <div className="mb-3 font-tw text-[11px] text-dim">
          根因:<span className="text-red">{m.buggy_line}</span> → <span className="text-green">{m.fix_line}</span>
        </div>
      )}
      {events.length === 0 ? (
        <div className="font-tw text-sm text-dim">
          点「跑一次 Harness」看一个真坑被 7 阶段回路修复:**过度拟合 → 回归闸门抓出 → 反思 → 重试 → 通过**。
        </div>
      ) : (
        <div className="space-y-1.5">
          {events.map((e: any, i: number) => {
            const p = PHASE[e.phase] || { t: e.phase, c: 'text-dim' };
            return (
              <div key={i} className="flex items-start gap-3 font-tw text-xs">
                <span className="w-5 shrink-0 text-dim">{i + 1}</span>
                <span className={`${p.c} w-36 shrink-0`}>{p.t}{e.attempt ? ` #${e.attempt}` : ''}</span>
                <span className="text-dim">
                  {e.phase === 'infected' && `[${(e.signals || []).join(' / ')}]`}
                  {e.phase === 'validate' && (
                    <span>
                      {e.ok ? <b className="text-green">PASS ✓</b> : <b className="text-red">FAIL ✗</b>}
                      {'  '}failToPass=<b className={e.failToPass ? 'text-green' : 'text-red'}>{String(e.failToPass)}</b>
                      {' · '}passToPass=<b className={e.passToPass ? 'text-green' : 'text-red'}>{String(e.passToPass)}</b>
                    </span>
                  )}
                  {e.phase === 'recall_hit' && `sim ${Number(e.similarity).toFixed(2)} · conf ${Number(e.confidence).toFixed(2)}`}
                  {e.phase === 'reflect' && (e.note || '').slice(0, 120)}
                  {e.phase === 'cured' && `via ${e.via} · ${e.attempts} 次尝试${e.cost_tokens ? ` · ${e.cost_tokens} tok` : ''}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
