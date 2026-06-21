import { motion } from 'framer-motion';
import type { Family, TaskState } from '../types';

const COLOR: Record<string, string> = {
  infected: 'border-red bg-red/15',
  recall_hit: 'border-cyan bg-cyan/15',
  solve: 'border-amber bg-amber/20 text-amber',
  immunity: 'border-green bg-green/20 text-green',
  failed: 'border-red bg-red/25',
  healthy: 'border-green/40 bg-green/10',
};

function cellClass(t: TaskState): string {
  if (t.phase === 'cured') return t.via === 'immunity' ? COLOR.immunity : COLOR.solve;
  return COLOR[t.phase] || 'border-line';
}

export default function SwarmGrid({ families, tasks }: { families: Family[]; tasks: Record<string, TaskState> }) {
  const byFam: Record<string, { id: string; t: TaskState }[]> = {};
  families.forEach((f) => (byFam[f.id] = []));
  Object.entries(tasks).forEach(([id, t]) => {
    (byFam[t.family] = byFam[t.family] || []).push({ id, t });
  });
  const empty = Object.keys(tasks).length === 0;

  return (
    <div className="board p-4">
      <div className="mb-3 flex items-baseline gap-2 border-b border-line pb-2">
        <span className="text-amber">✦</span>
        <span className="font-serif text-base font-bold text-parch">边疆网格 · 镇民免疫状</span>
        <span className="font-tw text-[11px] text-dim">— 每格 = 一个镇民;琥珀=缉拿(烧token),沙绿=电报免疫</span>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${families.length || 1}, minmax(0, 1fr))` }}>
        {families.map((f) => (
          <div key={f.id}>
            <div className="mb-2 h-9 font-tw text-[11px] leading-tight text-dim">{f.emoji} {f.name}</div>
            <div className="flex flex-col gap-1.5">
              {empty
                ? Array.from({ length: 6 }).map((_, k) => (
                    <div key={k} className="h-5 rounded-sm border border-dashed border-line opacity-40" />
                  ))
                : (byFam[f.id] || []).map(({ id, t }) => (
                    <motion.div
                      key={id}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                      className={`flex h-5 items-center justify-center rounded-sm border text-[9px] font-bold ${cellClass(t)}`}>
                      {t.phase === 'cured' ? (t.via === 'immunity' ? '✓' : '$') : ''}
                    </motion.div>
                  ))}
            </div>
          </div>
        ))}
      </div>
      {empty && (
        <div className="mt-3 text-center font-tw text-xs text-dim">
          ⌁ 镇上风平浪静 —— 点上方「放出流寇 · 开启免疫」,镇民格子会逐个亮起。
        </div>
      )}
    </div>
  );
}
