import { Play, Radio, Database, Wifi, WifiOff, Link2, Cpu, Clapperboard } from 'lucide-react';
import type { Status } from '../types';

export default function ScenarioControls({
  mode, running, connected, realModel, publishing, tech, publicDemo,
  onMode, onRun, onRealModel, onPublish, onAutoPlay, status,
}: {
  mode: string; running: boolean; connected: boolean; realModel: boolean; publishing: boolean; tech?: boolean; publicDemo?: boolean;
  onMode: (m: string) => void; onRun: (s: string) => void; onRealModel: (b: boolean) => void;
  onPublish: () => void; onAutoPlay: () => void; status: Status | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-panel px-5 py-4 font-serif">
      <button disabled={running || publishing} onClick={onAutoPlay}
        className="flex items-center gap-2 px-4 py-2 text-sm font-bold disabled:opacity-50"
        style={{ background: '#E0A93B', color: '#1a130c', borderRadius: 3 }}>
        <Clapperboard size={16} /> {tech ? '一键全场演示' : '▶ 全场战役演示'}
      </button>
      <div className="flex overflow-hidden rounded-lg border border-line text-sm">
        <button onClick={() => onMode('recorded')} className={`flex items-center gap-1.5 px-3 py-1.5 ${mode === 'recorded' ? 'bg-accent text-white' : 'text-dim'}`}>
          <Database size={14} /> {tech ? 'recorded' : '卷宗回放'}
        </button>
        {!publicDemo && (
          <button onClick={() => onMode('live')} className={`flex items-center gap-1.5 px-3 py-1.5 ${mode === 'live' ? 'bg-accent text-white' : 'text-dim'}`}>
            <Radio size={14} /> {tech ? 'live' : '实况直播'}
          </button>
        )}
      </div>

      <button disabled={running} onClick={() => onRun('immune')}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
        <Play size={15} /> {running ? '蜂群运行中…' : tech ? '运行免疫蜂群' : '放出流寇 · 开启免疫'}
      </button>

      {mode === 'live' && (
        <label className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm ${realModel ? 'border-amber/60 text-amber' : 'border-line text-dim'}`}>
          <input type="checkbox" checked={realModel} onChange={(e) => onRealModel(e.target.checked)} className="accent-amber" />
          <Cpu size={14} /> {tech ? '真模型(LLM)' : '真枪实弹'}
        </label>
      )}

      <button disabled={publishing} onClick={onPublish}
        className="flex items-center gap-2 rounded-lg border border-cyan/60 px-3.5 py-2 text-sm font-bold text-cyan disabled:opacity-50">
        <Link2 size={15} /> {publishing ? '上链中…' : tech ? 'gep_publish_bundle' : '拍电报上链'}
      </button>

      <div className="ml-auto flex items-center gap-3 text-xs text-dim">
        {publicDemo && (
          <span className="rounded-sm border border-amber/50 px-2 py-0.5 font-tw text-[10px] tracking-western text-amber">
            公开演示 · 离线回放真实数据
          </span>
        )}
        <span className="flex items-center gap-1">
          {connected ? <Wifi size={13} className="text-green" /> : <WifiOff size={13} className="text-red" />}
          {connected ? 'WS 已连' : 'WS 断开'}
        </span>
        {status && <span>· 节点 {status.node ? '在线' : '—'} · 模型 {status.model}</span>}
      </div>
    </div>
  );
}
