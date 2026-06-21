import { Panel } from './ui';
import type { Family } from '../types';

const CRIMES: Record<string, { crime: string; bounty: string }> = {
  gene_array_append: { crime: 'TypeError: append is not a function', bounty: '1,800' },
  gene_length_call: { crime: 'TypeError: length is not a function', bounty: '1,650' },
  gene_to_string_case: { crime: 'TypeError: tostring is not a function', bounty: '1,720' },
  gene_to_upper: { crime: 'TypeError: touppercase is not a function', bounty: '1,540' },
  gene_index_of: { crime: 'TypeError: indexof is not a function', bounty: '1,610' },
  gene_const_reassign: { crime: 'Assignment to constant variable', bounty: '1,900' },
};

export default function WantedPosters({ families, tech }: { families: Family[]; tech?: boolean }) {
  return (
    <Panel title={tech ? '病原家族 · 错误签名表' : '通缉令 · 病原流寇榜'} sub={tech ? '每个 bug 家族 = 一类报错 trigger,validation=node 沙箱' : '每个 bug 是一名流寇,报错即罪状,trigger 即画像'}>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {families.map((f, i) => {
          const c = CRIMES[f.id] || { crime: '未知罪状', bounty: '1,000' };
          const rot = (i % 2 ? 1 : -1) * (0.5 + (i % 3) * 0.35);
          return (
            <div key={f.id} className="parchment p-3" style={{ transform: `rotate(${rot}deg)`, borderRadius: 2, border: '1px solid #b89a5e' }}>
              <div className="text-center font-display text-2xl tracking-wider" style={{ color: '#7a241c' }}>{tech ? 'PATHOGEN' : 'WANTED'}</div>
              <div className="my-1 text-center text-5xl">{f.emoji}</div>
              <div className="text-center font-serif text-base font-bold" style={{ color: '#241808' }}>{f.name}</div>
              <div className="mt-2 font-tw text-[10px]" style={{ color: '#4a3415' }}>{tech ? 'ERROR SIGNATURE' : '罪状 / CRIME'}</div>
              <div className="font-tw text-[11px] leading-tight" style={{ color: '#6a2018' }}>{c.crime}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-tw text-[10px]" style={{ color: '#4a3415' }}>{tech ? 'AVG SOLVE COST' : '赏金 BOUNTY'}</span>
                <span className="font-display text-base" style={{ color: '#7a241c' }}>{c.bounty} tok</span>
              </div>
              <div className="mt-2 border-t pt-1 text-center font-display text-sm tracking-widest" style={{ color: '#241808', borderColor: '#b89a5e' }}>
                {tech ? 'REPAIR GENE READY' : 'DEAD OR FIXED'}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
