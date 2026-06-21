import { Panel } from './ui';

function ts(at: string) {
  try { return new Date(at).toLocaleTimeString('zh-CN', { hour12: false }); } catch { return ''; }
}

export default function OnChainFeed({ items, tech }: { items: any[]; tech?: boolean }) {
  return (
    <Panel title={tech ? 'gep_publish_bundle · 上链记录' : '电报局 · A2A 上链电报'} sub={tech ? 'POST evomap.ai/a2a/publish · node_secret 认证' : '点「拍电报上链」把抗体真实发布到 evomap.ai'}>
      {items.length === 0 ? (
        <div className="font-tw text-sm text-dim">⚡ 线路空闲 —— 点上方「{tech ? '一键上链' : '拍电报上链'}」发出第一封免疫电报(真发布到 Hub)。</div>
      ) : (
        <div className="space-y-3 font-tw text-xs">
          {items.map((it, i) => (
            <div key={i} className="border-l-2 pl-3" style={{ borderColor: it.ok ? '#88a259' : '#c4392f' }}>
              <div className="text-dim">⚡ {tech ? 'a2a/publish' : '电报收讫'} · {ts(it.at)} · 节点 {String(it.node || '').slice(0, 16)}…</div>
              <div className="text-amber">
                ▸ BUNDLE {it.bundle_id || '—'} · {[it.decision, it.reason].filter(Boolean).join(' · ') || (it.ok ? 'ok' : 'failed')}
                {i === 0 && <span className="ml-1 animate-pulse">▮</span>}
              </div>
              {it.gene_asset_id && (
                <div className="text-dim">{'  '}GENE {String(it.gene_asset_id).slice(0, 26)}… · CAPSULE {String(it.capsule_asset_id || '').slice(0, 26)}…</div>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
