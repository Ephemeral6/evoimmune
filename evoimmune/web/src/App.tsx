import { useEffect, useReducer, useRef, useState } from 'react';
import { getStatus, getSnapshot, runScenario } from './lib/api';
import { useSocket } from './lib/useSocket';
import StatHeader from './components/StatHeader';
import ScenarioControls from './components/ScenarioControls';
import SwarmCanvas from './components/SwarmCanvas';
import SwarmGrid from './components/SwarmGrid';
import EpidemicCurves from './components/EpidemicCurves';
import EventLog from './components/EventLog';
import VariantArena from './components/VariantArena';
import VaccinePanel from './components/VaccinePanel';
import TrustPanel from './components/TrustPanel';
import CrossModelMatrix from './components/CrossModelMatrix';
import OnChainFeed from './components/OnChainFeed';
import WantedPosters from './components/WantedPosters';
import RealBugProof from './components/RealBugProof';
import HarnessTrace from './components/HarnessTrace';
import CoevolutionCurve from './components/CoevolutionCurve';
import type { Family, Status, TaskState, WsMsg } from './types';

const TABS = [
  { id: 'wanted', label: '通缉令' },
  { id: 'harness', label: 'Harness 回路' },
  { id: 'coevo', label: '协同进化' },
  { id: 'realbug', label: '真坑实证' },
  { id: 'grid', label: '边疆网格' },
  { id: 'variant', label: '变异攻防' },
  { id: 'vaccine', label: '代代相传' },
  { id: 'trust', label: '验赏官' },
  { id: 'cross', label: '电报路由' },
  { id: 'onchain', label: '电报局' },
];

type Point = { step: number; solved: number; immune: number };
type Harness = { meta: any; real: boolean; events: WsMsg[] };
type State = { running: boolean; runId: string | null; mode: string; tasks: Record<string, TaskState>; log: WsMsg[]; series: Point[]; metrics: any; publishing: boolean; onchain: any[]; harness: Harness };
const initial: State = { running: false, runId: null, mode: 'recorded', tasks: {}, log: [], series: [], metrics: null, publishing: false, onchain: [], harness: { meta: null, real: false, events: [] } };

function reducer(s: State, a: any): State {
  switch (a.type) {
    case 'reset': return { ...initial, mode: s.mode, onchain: s.onchain };
    case 'set_mode': return { ...s, mode: a.mode };
    case 'run_start':
      if (a.scenario === 'publish') return { ...s, publishing: true };
      return { ...initial, mode: s.mode, running: true, runId: a.runId, onchain: s.onchain, harness: s.harness };
    case 'publishing': return { ...s, publishing: true };
    case 'published': return { ...s, publishing: false, onchain: [a, ...s.onchain].slice(0, 30) };
    case 'harness_meta': return { ...s, harness: { meta: a.bug, real: !!a.real, events: [] } };
    case 'harness_event': return { ...s, harness: { ...s.harness, events: [...s.harness.events, a] } };
    case 'event': {
      const tasks = { ...s.tasks, [a.taskId]: { family: a.family, phase: a.phase, via: a.via, similarity: a.similarity } };
      const log = [a, ...s.log].slice(0, 80);
      let series = s.series;
      if (a.phase === 'cured') {
        const last = series[series.length - 1] || { solved: 0, immune: 0 };
        series = [...series, { step: series.length + 1, solved: last.solved + (a.via === 'solve' ? 1 : 0), immune: last.immune + (a.via === 'immunity' ? 1 : 0) }];
      }
      return { ...s, tasks, log, series };
    }
    case 'run_end': return { ...s, running: false, metrics: a.metrics };
    case 'run_error': return { ...s, running: false };
    default: return s;
  }
}

export default function App() {
  const [status, setStatus] = useState<Status | null>(null);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [state, dispatch] = useReducer(reducer, initial);
  const queueRef = useRef<any[]>([]);
  const autoplayRef = useRef(false);
  const [tab, setTab] = useState('wanted');
  const [realModel, setRealModel] = useState(false);
  const [tech, setTech] = useState(false);
  const { connected } = useSocket((m) => {
    queueRef.current.push(m);
    dispatch(m);
    // 「全场演示」编排:免疫蜂群跑完 → 自动连发两封上链电报
    if (m.type === 'run_end' && m.scenario === 'immune' && autoplayRef.current) {
      autoplayRef.current = false;
      setTab('onchain');
      setTimeout(() => { runScenario('publish', 'live').catch(() => {}); }, 700);
      setTimeout(() => { runScenario('publish', 'live').catch(() => {}); }, 3600);
    }
  });

  useEffect(() => {
    getStatus().then(setStatus).catch(() => {});
    getSnapshot().then(setSnapshot).catch(() => {});
  }, []);

  const families: Family[] = status?.families || snapshot?.families || [];

  async function run(scenario: string) {
    dispatch({ type: 'reset' });
    queueRef.current.push({ type: 'run_start' });
    await runScenario(scenario, state.mode, { perFamily: 6, solver: state.mode === 'live' && realModel ? 'llm' : 'stub' }).catch(() => {});
  }
  async function publish() {
    await runScenario('publish', 'live').catch(() => {});
  }
  async function harnessRun() {
    setTab('harness');
    await runScenario('harness', state.mode, { solver: state.mode === 'live' && realModel ? 'llm' : 'stub' }).catch(() => {});
  }
  async function autoPlay() {
    autoplayRef.current = true;
    dispatch({ type: 'reset' });
    queueRef.current.push({ type: 'run_start' });
    await runScenario('immune', state.mode, { perFamily: 6, solver: state.mode === 'live' && realModel ? 'llm' : 'stub' }).catch(() => {});
  }

  const vals = Object.values(state.tasks);
  const solved = vals.filter((t) => t.phase === 'cured' && t.via === 'solve').length;
  const immune = vals.filter((t) => t.phase === 'cured' && t.via === 'immunity').length;
  const infected = vals.filter((t) => t.phase === 'infected').length;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <header className="mb-6">
          <hr className="rule-x" />
          <div className="grid grid-cols-3 items-center py-2.5">
            <div className="font-tw text-[10px] text-dim tracking-western">EST. 2026 · 浙江·杭州</div>
            <div className="text-center font-display text-lg text-amber leading-none">EVOTAVERN</div>
            <div className="flex items-center justify-end gap-2">
              <span className="font-tw text-[10px] text-dim tracking-western">电报局 ⚡</span>
              <div className="flex overflow-hidden rounded-sm border border-line font-tw text-[10px]">
                <button onClick={() => setTech(false)} className={`px-2 py-1 ${!tech ? 'bg-accent text-white' : 'text-dim'}`}>故事</button>
                <button onClick={() => setTech(true)} className={`px-2 py-1 ${tech ? 'bg-accent text-white' : 'text-dim'}`}>技术真相</button>
              </div>
            </div>
          </div>
          <h1 className="text-center font-serif text-4xl font-black tracking-western text-parch">进化酒馆 · 边境免疫志</h1>
          <div className="mt-2 text-center font-tw text-[11px] text-dim tracking-western">
            FRONTIER IMMUNITY GAZETTE · 硅基物种群体免疫 · The Forge / A2A 蜂群协作
          </div>
          <hr className="rule-x mt-3" />
        </header>

        <StatHeader snapshot={snapshot} />

        <div className="mt-4">
          <ScenarioControls mode={state.mode} running={state.running} connected={connected}
            realModel={realModel} publishing={state.publishing} tech={tech}
            onMode={(m) => dispatch({ type: 'set_mode', mode: m })} onRun={run}
            onRealModel={setRealModel} onPublish={publish} onAutoPlay={autoPlay} status={status} />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3">
          <Stat label={tech ? '任务' : '镇民'} value={vals.length} color="text-ink" />
          <Stat label={tech ? '感染中' : '瘟疫中'} value={infected} color="text-red" />
          <Stat label={tech ? '模型解题 LLM' : '悬赏缉拿(烧token)'} value={solved} color="text-amber" />
          <Stat label={tech ? 'recall 命中' : '电报免疫(零成本)'} value={immune} color="text-green" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2"><SwarmCanvas families={families} queue={queueRef} /></div>
          <EventLog log={state.log} families={families} />
        </div>

        <div className="mt-4"><EpidemicCurves series={state.series} /></div>

        <div className="mt-6">
          <div className="mb-3 flex flex-wrap gap-2">
            {TABS.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className={`rounded-lg px-3.5 py-1.5 text-sm ${tab === tb.id ? 'bg-accent text-white' : 'border border-line text-dim hover:text-ink'}`}>
                {tb.label}
              </button>
            ))}
          </div>
          {tab === 'wanted' && <WantedPosters families={families} tech={tech} />}
          {tab === 'harness' && <HarnessTrace data={state.harness} onRun={harnessRun} running={state.running} />}
          {tab === 'coevo' && <CoevolutionCurve data={snapshot?.coevolution} />}
          {tab === 'realbug' && <RealBugProof data={snapshot?.realbug} tech={tech} />}
          {tab === 'grid' && <SwarmGrid families={families} tasks={state.tasks} />}
          {tab === 'variant' && <VariantArena data={snapshot?.variant} />}
          {tab === 'vaccine' && <VaccinePanel data={snapshot?.vaccinate} />}
          {tab === 'trust' && <TrustPanel data={snapshot?.trust} />}
          {tab === 'cross' && <CrossModelMatrix data={snapshot?.crossmodel} />}
          {tab === 'onchain' && <OnChainFeed items={state.onchain} tech={tech} />}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3">
      <div className="text-xs text-dim">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}
