import { Empty, Panel } from './ui';

export default function CrossModelMatrix({ data }: { data: any }) {
  if (!data?.origins) return <Empty text="跨模型数据未生成 —— 运行 scripts/cross-model.js" />;
  const { origins, inheritors, matrix } = data;
  return (
    <Panel title="🧬 跨模型免疫 · 经验跨模型迁移" sub="抗体不绑定出身模型(EvoMap Cross-Model Evolution)">
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-dim">
        {origins.map((o: any) => (
          <span key={o.model}>{o.emoji} <b className="text-ink">{o.model}</b> 造「{o.family}」(真 token {o.tokens.toLocaleString()})</span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="border border-line p-2 text-left font-normal text-dim">抗体来源 ＼ 继承节点模型</th>
              {inheritors.map((m: string) => <th key={m} className="border border-line p-2 font-normal text-dim">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {origins.map((o: any) => (
              <tr key={o.model}>
                <td className="border border-line p-2 whitespace-nowrap">{o.emoji} {o.model}</td>
                {inheritors.map((m: string) => {
                  const ok = (matrix[o.model] || []).includes(m);
                  return <td key={m} className="border border-line p-2 text-center">{ok ? <span className="text-green">✓</span> : <span className="text-dim">·</span>}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
