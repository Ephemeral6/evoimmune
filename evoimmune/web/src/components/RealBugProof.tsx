import { Empty, Panel } from './ui';

export default function RealBugProof({ data, tech }: { data: any; tech?: boolean }) {
  if (!data?.bugs) return <Empty text="真坑实证未生成 —— 运行 scripts/real-bug-proof.js" />;
  return (
    <Panel
      title={tech ? '真实逻辑 bug · 真模型修复实证' : '真坑实证 · 模型现场推理'}
      sub="逻辑 bug(输出错误,非语法 typo),真模型读测试反推意图修复 → 复发即电报免疫">
      <div className="space-y-4">
        {data.bugs.map((b: any) => (
          <div key={b.id} className="border border-line p-3" style={{ borderRadius: 3 }}>
            <div className="flex items-baseline gap-2">
              <span className="text-lg">{b.emoji}</span>
              <span className="font-serif font-bold text-parch">{b.name}</span>
              <span className="ml-auto font-tw text-[11px] text-dim">{b.model} · 真 token {b.tokens}</span>
            </div>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <div>
                <div className="mb-1 font-tw text-[10px] text-red">BUGGY · 错误输出</div>
                <pre className="whitespace-pre-wrap bg-black/30 p-2 font-tw text-[11px] text-dim" style={{ borderRadius: 3 }}>{b.before}</pre>
              </div>
              <div>
                <div className="mb-1 font-tw text-[10px] text-green">模型修复 {b.model_solved ? '✓ PASS' : '✗'}</div>
                <pre className="whitespace-pre-wrap bg-black/30 p-2 font-tw text-[11px] text-ink" style={{ borderRadius: 3 }}>{b.after}</pre>
              </div>
            </div>
            <div className="mt-2 font-tw text-[11px] text-dim">
              根因:<span className="text-red">{b.buggy_line}</span> → <span className="text-green">{b.fix_line}</span> · 同类复发 {b.immune_ok ? '✓ 电报免疫(零模型)' : '—'}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
