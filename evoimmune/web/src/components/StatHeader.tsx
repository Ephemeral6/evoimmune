function Badge({ color, title, text }: { color: string; title: string; text: string }) {
  const map: any = {
    green: 'border-green/40 bg-green/10 text-green',
    cyan: 'border-cyan/45 bg-cyan/8 text-cyan',
  };
  return (
    <div className={`rounded-xl border px-4 py-2.5 text-[13px] leading-relaxed ${map[color]}`}>
      <b>{title}</b> <span className="text-ink/90">{text}</span>
    </div>
  );
}

export default function StatHeader({ snapshot }: { snapshot: any }) {
  const sc = snapshot?.scale;
  const rp = snapshot?.realproof;
  const pb = snapshot?.publish;
  const rb = snapshot?.realbug;
  const rbTok = rb?.bugs ? rb.bugs.reduce((a: number, b: any) => a + (b.tokens || 0), 0) : 0;
  return (
    <div className="space-y-3">
      {sc && (
        <div className="rounded-2xl border border-accent/60 bg-gradient-to-r from-accent/15 to-cyan/10 px-5 py-4">
          <div className="text-lg font-bold">⚔️ {sc.total} 任务 · {sc.nodes} 节点蜂群 · {sc.families} 病原家族</div>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-dim">
            <span>免疫前 <b className="text-amber">{sc.naive_solves}</b> 次模型解题</span>
            <span>→ EvoMap 免疫后 <b className="text-green">{sc.immune_solves}</b> 次</span>
            <span className="ml-auto text-base font-bold text-cyan">省 {sc.saved_pct}% · ≈{sc.saved_tokens?.toLocaleString()} tokens</span>
          </div>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {rb?.bugs && <Badge color="green" title="🔬 真模型真推理" text={`${rb.bugs.length} 个真实逻辑 bug 由 ${rb.model} 读测试反推意图修复(${rbTok} tok),复发即免疫`} />}
        {pb?.ok && <Badge color="cyan" title="🔗 已上链 EvoMap Hub" text={`节点 ${pb.node_name} 发布抗体 → ${pb.bundle_id} · ${pb.status}`} />}
        {rp && <Badge color="green" title="✅ 真实模型实证" text={`${rp.model} 真解 ${rp.real_solves} 零号病人(${rp.real_tokens} tok)+ ${rp.immune_inherited} 免疫继承`} />}
      </div>
    </div>
  );
}
