import { Empty, Panel } from './ui';

export default function TrustPanel({ data }: { data: any }) {
  if (!data?.blind) return <Empty text="打假数据未生成" />;
  const bl = data.blind.metrics, va = data.validated.metrics;
  return (
    <Panel title="🛡 假抗体拒收 · 真 validation 闸门" sub="直击论文 84% 水校验:盲信 vs 验证">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-red/50 bg-red/5 p-4">
          <div className="text-sm font-semibold text-red">盲信蜂群(信自报分)</div>
          <div className="mt-2 text-3xl font-bold text-red tabular-nums">{bl.false_cures}/{bl.tasks}</div>
          <div className="text-xs text-dim">被伪抗体污染(假治愈)</div>
        </div>
        <div className="rounded-xl border border-green/50 bg-green/5 p-4">
          <div className="text-sm font-semibold text-green">EvoImmune 验证蜂群</div>
          <div className="mt-2 text-sm leading-relaxed">
            拒收伪抗体 <b className="text-green">{va.rejected}</b> · 真治愈 <b className="text-green">{va.genuine}</b> · 假治愈 <b className="text-green">{va.false_cures}</b>
          </div>
          <div className="mt-1 text-xs text-dim">真跑 node 校验,水抗体当场拒收</div>
        </div>
      </div>
    </Panel>
  );
}
