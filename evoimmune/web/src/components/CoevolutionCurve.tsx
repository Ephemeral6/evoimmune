import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Empty, Panel } from './ui';

export default function CoevolutionCurve({ data }: { data: any }) {
  if (!data?.series) return <Empty text="协同进化数据未生成 —— 运行 node src/runDemo.js" />;
  return (
    <Panel title="📈 Model × Harness 协同进化" sub={`模型固定(${data.model})· 免疫库随波次增长 → harness 独立变强`}>
      <div className="mb-3 font-tw text-[12px] text-dim">
        同一个模型<b className="text-ink"> 一字不改</b>,随抗体库变大:<b className="text-green">免疫命中率 ↑</b>、<b className="text-amber">平均 token/任务 ↓</b> —— 能力增长来自 harness,而非模型。
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.series} margin={{ top: 8, right: 18, bottom: 14, left: -10 }}>
            <CartesianGrid stroke="#3c2f1d" />
            <XAxis dataKey="wave" stroke="#9c8763" tick={{ fontSize: 11 }} label={{ value: '波次(免疫库累积)', position: 'insideBottom', offset: -8, fill: '#9c8763', fontSize: 11 }} />
            <YAxis yAxisId="l" stroke="#88a259" tick={{ fontSize: 11 }} domain={[0, 100]} />
            <YAxis yAxisId="r" orientation="right" stroke="#e0a93b" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#201810', border: '1px solid #3c2f1d', borderRadius: 3, fontSize: 12, color: '#ecdcbf' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line yAxisId="l" type="monotone" dataKey="hitRate" name="免疫命中率 %" stroke="#88a259" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
            <Line yAxisId="r" type="monotone" dataKey="tokensPerTask" name="平均 token/任务" stroke="#e0a93b" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}
