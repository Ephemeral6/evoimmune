import { AnimatePresence, motion } from 'framer-motion';
import type { Family, WsMsg } from '../types';

const PHASE: Record<string, { t: string; c: string }> = {
  infected: { t: '感染', c: 'text-red' },
  recall_hit: { t: 'recall 命中', c: 'text-cyan' },
  propose: { t: '提议补丁', c: 'text-amber' },
  validate: { t: '验证闸门', c: 'text-amber' },
  reflect: { t: '反思', c: 'text-dim' },
  cured: { t: '治愈', c: 'text-green' },
  healthy: { t: '健康', c: 'text-dim' },
  failed: { t: '失败', c: 'text-red' },
};

export default function EventLog({ log, families }: { log: WsMsg[]; families: Family[] }) {
  const famOf = (id: string) => families.find((f) => f.id === id);
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="mb-2 text-sm font-semibold">实时事件流</div>
      <div className="h-[360px] space-y-1 overflow-y-auto pr-1 text-xs">
        <AnimatePresence initial={false}>
          {log.map((e, i) => {
            const p = PHASE[e.phase] || { t: e.phase, c: 'text-dim' };
            return (
              <motion.div
                key={`${e.taskId}-${e.phase}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2">
                <span className="w-9 shrink-0 text-dim">t{e.t}</span>
                <span>{famOf(e.family)?.emoji}</span>
                <span className={p.c}>
                  {p.t}{e.via ? `·${e.via === 'immunity' ? '免疫继承' : '模型解题'}` : ''}
                </span>
                {e.similarity != null && <span className="text-dim">sim {e.similarity}</span>}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {log.length === 0 && <div className="text-dim">点击「释放病原」开始 —— 事件会实时滚动出现</div>}
      </div>
    </div>
  );
}
