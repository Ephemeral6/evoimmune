import { Empty, Panel } from './ui';

const MAP: Record<string, { t: string; cls: string; border: string }> = {
  wild_solved: { t: '学会抗体', cls: 'text-amber', border: 'border-amber' },
  immune: { t: '免疫', cls: 'text-green', border: 'border-green/50' },
  cross_immune: { t: '交叉免疫', cls: 'text-green', border: 'border-green/50' },
  escape_solved: { t: '免疫逃逸→新抗体', cls: 'text-red', border: 'border-red' },
  booster_immune: { t: '加强针免疫', cls: 'text-green', border: 'border-green/50' },
};

export default function VariantArena({ data }: { data: any }) {
  if (!data?.events) return <Empty text="变异数据未生成" />;
  return (
    <Panel title="🧪 变异攻防 · 交叉免疫 vs 免疫逃逸" sub="抗体 trigger 模糊匹配的泛化边界">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {data.events.map((e: any, i: number) => {
          const m = MAP[e.outcome] || { t: e.outcome, cls: 'text-dim', border: 'border-line' };
          return (
            <div key={i} className={`rounded-xl border ${m.border} bg-bg/40 p-3`}>
              <div className="text-[11px] text-dim">{e.label}</div>
              <div className={`mt-1 font-semibold ${m.cls}`}>{m.t}</div>
              <div className="mt-1 text-[10px] text-dim">
                {e.outcome === 'escape_solved' ? `recall sim ${e.bestSim} < 0.6` : (e.bestSim ? `sim ${e.bestSim}` : '')}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-dim">野生株学会抗体 → 换写法/同症状变体被老抗体 <b className="text-green">交叉免疫</b> → 变异 .add 签名改变 → <b className="text-red">免疫逃逸</b> → 造新抗体后 <b className="text-green">加强针免疫</b>。</div>
    </Panel>
  );
}
