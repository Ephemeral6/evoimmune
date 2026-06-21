import { useEffect, useRef } from 'react';
import type { Family } from '../types';

// 边疆疫情图:病原家族按扇区分布在中心「中央电报局」周围。
// 感染→牛血红;模型解题(缉拿)→赭石+电报火花飞向电报局;免疫继承→沙绿+火花从电报局飞回。
type QRef = { current: any[] };
const COL: Record<string, string> = { infected: '#c4392f', recall_hit: '#d8a23f', propose: '#d8a23f', validate: '#d8a23f', solve: '#e0a93b', immune: '#88a259', healthy: '#88a259' };

export default function SwarmCanvas({ families, queue }: { families: Family[]; queue: QRef }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const famAngle = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const m = new Map<string, number>();
    families.forEach((f, i) => m.set(f.id, (i / Math.max(1, families.length)) * Math.PI * 2 - Math.PI / 2));
    famAngle.current = m;
  }, [families]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nodes = new Map<string, any>();
    let particles: any[] = [];
    const famCount = new Map<string, number>();
    let raf = 0;

    const resize = () => { const r = canvas.getBoundingClientRect(); canvas.width = r.width * dpr; canvas.height = r.height * dpr; };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    const handle = (e: any) => {
      if (e.type === 'run_start') { nodes.clear(); particles = []; famCount.clear(); return; }
      if (e.type !== 'event') return;
      let node = nodes.get(e.taskId);
      if (!node) {
        const ang = famAngle.current.get(e.family) ?? 0;
        const v = famCount.get(e.family) || 0; famCount.set(e.family, v + 1);
        node = { ang: ang + Math.sin(v * 1.7) * 0.14, r: 64 + v * 15, state: 'infected', flash: 1 };
        nodes.set(e.taskId, node);
      }
      node.state = e.phase === 'cured' ? (e.via === 'immunity' ? 'immune' : 'solve') : e.phase;
      node.flash = 1;
      if (e.phase === 'cured') particles.push({ node, t: 0, kind: e.via === 'immunity' ? 'inherit' : 'deposit' });
    };

    const loop = () => {
      while (queue.current.length) handle(queue.current.shift());
      const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      // 罗盘/边疆地图网格
      ctx.strokeStyle = 'rgba(197,150,42,0.06)';
      ctx.lineWidth = 1;
      for (let rr = 60; rr < 260; rr += 50) { ctx.beginPath(); ctx.arc(cx, cy, rr * dpr, 0, 7); ctx.stroke(); }
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 250 * dpr, cy + Math.sin(a) * 250 * dpr); ctx.stroke();
      }

      const pos = (n: any) => [cx + Math.cos(n.ang) * n.r * dpr, cy + Math.sin(n.ang) * n.r * dpr];

      for (const n of nodes.values()) { const [x, y] = pos(n); ctx.strokeStyle = 'rgba(197,150,42,0.10)'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); }

      for (const n of nodes.values()) {
        const [x, y] = pos(n); const c = COL[n.state] || '#9c8763';
        if (n.flash > 0.05) { ctx.fillStyle = c + '2e'; ctx.beginPath(); ctx.arc(x, y, (5 + n.flash * 9) * dpr, 0, 7); ctx.fill(); n.flash *= 0.9; }
        ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, 3.6 * dpr, 0, 7); ctx.fill();
      }

      // 中央电报局(黄铜钟楼)
      ctx.fillStyle = '#c8962a'; ctx.shadowColor = '#e0a93b'; ctx.shadowBlur = 22 * dpr;
      ctx.beginPath(); ctx.arc(cx, cy, 10 * dpr, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = '#e7d8b4'; ctx.lineWidth = 1.2 * dpr; ctx.beginPath(); ctx.arc(cx, cy, 14 * dpr, 0, 7); ctx.stroke();
      ctx.fillStyle = '#b59a6a'; ctx.font = `${11 * dpr}px "Special Elite", monospace`; ctx.textAlign = 'center';
      ctx.fillText('中央电报局 · EvoMap Hub', cx, cy + 30 * dpr);

      particles = particles.filter((p) => p.t < 1);
      for (const p of particles) {
        p.t += 0.045; const [nx, ny] = pos(p.node);
        const x = p.kind === 'deposit' ? nx + (cx - nx) * p.t : cx + (nx - cx) * p.t;
        const y = p.kind === 'deposit' ? ny + (cy - ny) * p.t : cy + (ny - cy) * p.t;
        ctx.fillStyle = p.kind === 'deposit' ? '#e0a93b' : '#88a259';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 12 * dpr;
        ctx.beginPath(); ctx.arc(x, y, 3.4 * dpr, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [queue]);

  return (
    <div className="board p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-serif text-base font-bold text-parch">边疆疫情图 · 培养皿</div>
        <div className="flex gap-3 font-tw text-[11px] text-dim">
          <span><i className="inline-block h-2 w-2 rounded-full" style={{ background: '#c4392f' }} /> 感染</span>
          <span><i className="inline-block h-2 w-2 rounded-full" style={{ background: '#e0a93b' }} /> 缉拿(烧token)</span>
          <span><i className="inline-block h-2 w-2 rounded-full" style={{ background: '#88a259' }} /> 电报免疫</span>
        </div>
      </div>
      <canvas ref={canvasRef} className="h-[400px] w-full" />
    </div>
  );
}
