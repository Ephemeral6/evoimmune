import { Card, Empty, Panel } from './ui';

export default function VaccinePanel({ data }: { data: any }) {
  if (!data?.bootstrap) return <Empty text="疫苗数据未生成" />;
  const b = data.bootstrap, v = data.vaccinated, c = data.control;
  return (
    <Panel title="💉 疫苗接种 · 新一代生来免疫" sub='"让其他节点生来就具备群体免疫"'>
      <div className="grid gap-3 md:grid-cols-3">
        <Card label="第一代 · 学习代价" value={`${b.solved_by_llm} 次 LLM`} color="amber" />
        <Card label="第二代 · 已接种(共享注册中心)" value={`${v.solved_by_llm} 次 LLM · ${v.immune_inherited} 生来免疫`} color="green" highlight />
        <Card label="第二代 · 未接种对照" value={`${c.solved_by_llm} 次 LLM`} color="amber" />
      </div>
      <div className="mt-3 text-xs text-dim">第一代付一次代价学会全部抗体;第二代接入同一 EvoMap 注册中心,面对全新变体 <b className="text-green">0 次 LLM、100% 生来免疫</b> —— 一代学会,代代继承。</div>
    </Panel>
  );
}
