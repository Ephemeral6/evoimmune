import type { ReactNode } from 'react';

export function Panel({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="board p-4">
      <div className="mb-3 flex items-baseline gap-2 border-b border-line pb-2">
        <span className="text-amber">✦</span>
        <span className="font-serif text-base font-bold tracking-wide text-parch">{title}</span>
        {sub && <span className="font-tw text-[11px] text-dim">— {sub}</span>}
      </div>
      {children}
    </div>
  );
}

export function Empty({ text }: { text?: string }) {
  return <div className="board p-6 font-tw text-sm text-dim">{text || '卷宗未生成'}</div>;
}

export function Card({ label, value, color, highlight }: { label: string; value: string; color?: string; highlight?: boolean }) {
  const cmap: Record<string, string> = { amber: 'text-amber', green: 'text-green', cyan: 'text-cyan' };
  return (
    <div className={`border bg-black/20 p-4 ${highlight ? 'border-amber/55' : 'border-line'}`} style={{ borderRadius: 3 }}>
      <div className="font-tw text-[11px] text-dim">{label}</div>
      <div className={`mt-1 font-serif text-lg font-bold ${cmap[color || ''] || 'text-ink'}`}>{value}</div>
    </div>
  );
}
