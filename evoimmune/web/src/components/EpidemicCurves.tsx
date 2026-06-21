import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function EpidemicCurves({ series }: { series: { step: number; solved: number; immune: number }[] }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="mb-2 text-sm font-semibold">流行病学曲线 · 累计(模型解题 vs 免疫继承)</div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 16, bottom: 4, left: -8 }}>
            <CartesianGrid stroke="#3c2f1d" />
            <XAxis dataKey="step" stroke="#9c8763" tick={{ fontSize: 11 }} />
            <YAxis stroke="#9c8763" tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#201810', border: '1px solid #3c2f1d', borderRadius: 3, fontSize: 12, color: '#ecdcbf' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="solved" name="缉拿·模型解题(烧 token)" stroke="#e0a93b" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="immune" name="电报免疫(零成本)" stroke="#88a259" strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
