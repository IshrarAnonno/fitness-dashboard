import React, { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
  Activity, TrendingUp, TrendingDown, Calendar, Dumbbell, ExternalLink,
  ChevronDown, ChevronUp, RotateCcw, Sparkles, Clock, Heart, RefreshCw,
  X, Camera, Award, Zap, Moon, Target, BarChart2, BookOpen, Trophy, Filter
} from 'lucide-react';
import PhysiqueTracker from '../components/PhysiqueTracker';

// ── Category colour map ───────────────────────────────────────────────────────
const CAT = {
  legs:      { color: '#10b981', bg: 'bg-emerald-950/40', border: 'border-emerald-800/40', text: 'text-emerald-400', label: 'Legs' },
  back:      { color: '#38bdf8', bg: 'bg-sky-950/40',     border: 'border-sky-800/40',     text: 'text-sky-400',     label: 'Back' },
  chest:     { color: '#a855f7', bg: 'bg-purple-950/40',  border: 'border-purple-800/40',  text: 'text-purple-400',  label: 'Chest' },
  arms:      { color: '#f59e0b', bg: 'bg-amber-950/40',   border: 'border-amber-800/40',   text: 'text-amber-400',   label: 'Arms' },
  shoulders: { color: '#f43f5e', bg: 'bg-rose-950/40',    border: 'border-rose-800/40',    text: 'text-rose-400',    label: 'Shoulders' },
  core:      { color: '#fb923c', bg: 'bg-orange-950/40',  border: 'border-orange-800/40',  text: 'text-orange-400',  label: 'Core' },
  cardio:    { color: '#e879f9', bg: 'bg-fuchsia-950/40', border: 'border-fuchsia-800/40', text: 'text-fuchsia-400', label: 'Cardio' },
  other:     { color: '#64748b', bg: 'bg-slate-900/40',   border: 'border-slate-700/40',   text: 'text-slate-400',   label: 'Other' },
};

const ROUTINES = {
  Saturday: { title: 'Upper Body A', color: 'text-sky-400', accent: '#38bdf8' },
  Monday:   { title: 'Upper Body A', color: 'text-sky-400', accent: '#38bdf8' },
  Sunday:   { title: 'Lower Body',   color: 'text-emerald-400', accent: '#10b981' },
  Thursday: { title: 'Lower Body',   color: 'text-emerald-400', accent: '#10b981' },
  Tuesday:  { title: 'Active Recovery', color: 'text-amber-400', accent: '#f59e0b' },
  Wednesday:{ title: 'Active Recovery', color: 'text-amber-400', accent: '#f59e0b' },
  Friday:   { title: 'Rest Day', color: 'text-rose-400', accent: '#f43f5e' },
};

// ── AI Coach logic (trimmed for brevity, full analysis preserved) ─────────────
const generateCoachFeedback = (record, allRecords = [], idx = 0) => {
  if (!record) return { willpower: '—', cns: '—', progression: '—', directive: '—', quote: 'Stay consistent.', sweatLoss: 0, totalVol: 0 };
  const c = (record.comment || '').toLowerCase();
  const prePostDiff = record.preWeight && record.postWeight ? (record.preWeight - record.postWeight).toFixed(1) : 0;
  const totalVol = record.totalSessionVolume || 0;

  let willpower = c.includes('vodka') || c.includes('peg') || c.includes('drink') || c.includes('whiskey')
    ? '⚠️ Alcohol ingestion logged. Ethanol suppresses MPS via mTOR pathway downregulation and disrupts GH release during REM sleep. Zero hypertrophy window this session.'
    : c.includes('proud') || c.includes('strong') || c.includes('pump') || c.includes('blasted') || c.includes('good day')
    ? '🏆 Positive psychological reinforcement logged. Dopamine reward loop active — capitalize by aiming for +1 rep on each compound movement next session.'
    : c.includes('guilt') || c.includes('missed') || c.includes('skip') || c.includes('couldn\'t')
    ? '🔥 Guilt logged — channel this as cortisol-fuel. Channel stress into compound lifts. Increase load by 2.5kg to convert negative energy into adaptation stimulus.'
    : '✅ Baseline focus. Consistent logging is the primary habit that separates aesthetic athletes from average trainees.';

  let cns = parseFloat(prePostDiff) > 1.2
    ? `💧 Dehydration alert: ${prePostDiff}kg fluid lost. Replenish with 1.5L water + electrolytes.`
    : c.includes('football') || c.includes('match') || c.includes('running')
    ? '⚽ High-intensity activity logged. Defer heavy leg work 48h — eccentric joint load risk is elevated.'
    : c.includes('sleep') || c.includes('tired') || c.includes('rest')
    ? '😴 CNS recovery priority. Sleep < 6h = 300% injury risk increase. Protect sleep above all else.'
    : `💪 Optimal hydration (${prePostDiff}kg loss). Peak conditions for maximal contractile force.`;

  let prevRecord = null;
  if (idx > 0) {
    for (let i = idx - 1; i >= 0; i--) {
      if (allRecords[i]?.routine === record.routine) { prevRecord = allRecords[i]; break; }
    }
  }

  let progression = '', directive = '';
  if (prevRecord) {
    const prevVol = prevRecord.totalSessionVolume || 0;
    const diff = totalVol - prevVol;
    const pct = prevVol > 0 ? ((diff / prevVol) * 100).toFixed(1) : '0';
    progression = diff >= 0
      ? `📈 +${diff.toLocaleString()} kg·rep vs last ${record.routine} session (+${pct}%). Progressive overload confirmed.`
      : `📉 ${diff.toLocaleString()} kg·rep vs last session (${pct}%). Volume regressed — check recovery and nutrition.`;
    directive = diff >= 0
      ? 'Add 1.25kg to primary lifts next session. Focus on explosive concentric (1s up, 2s down).'
      : 'Cut 1 set but increase weight. Prioritize intensity over volume this cycle.';
  } else {
    progression = `Baseline: ${totalVol.toLocaleString()} kg·rep total volume logged.`;
    directive = 'Establish your baseline. Next session: add 1 rep to the final set of each exercise.';
  }

  return { willpower, cns, progression, directive, quote: willpower.includes('🏆') ? 'Aesthetic mastery is won in the compound lifts.' : 'Discipline is the bridge between dreams and results.', sweatLoss: prePostDiff, totalVol };
};

// ── Computed PR tracker ───────────────────────────────────────────────────────
const computePRs = (data) => {
  const prMap = {}; // exerciseName → { weight, date, totalReps, volume }
  data.forEach(record => {
    (record.allExercises || []).forEach(ex => {
      if (ex.isCardio || !ex.weight) return;
      const key = ex.name;
      if (!prMap[key] || ex.weight > prMap[key].weight) {
        prMap[key] = { weight: ex.weight, date: record.date, totalReps: ex.totalReps, volume: ex.volume, category: ex.category };
      }
    });
  });
  return prMap;
};

// ── Exercise volume history ───────────────────────────────────────────────────
const computeExerciseHistory = (data) => {
  const map = {}; // exerciseName → [{ date, weight, totalReps, volume }]
  data.forEach(record => {
    (record.allExercises || []).forEach(ex => {
      if (ex.isCardio || !ex.weight) return;
      if (!map[ex.name]) map[ex.name] = [];
      map[ex.name].push({ date: record.date, weight: ex.weight, totalReps: ex.totalReps, volume: ex.volume, category: ex.category });
    });
  });
  return map;
};

// ── Tooltip component ─────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0b10] border border-[#1e2030] rounded-xl p-3 text-xs shadow-2xl min-w-[140px]">
      <p className="text-slate-400 font-mono font-bold mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.stroke }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>
      ))}
    </div>
  );
};

// ── Exercise card ─────────────────────────────────────────────────────────────
const ExerciseCard = ({ ex, isPR }) => {
  const cat = CAT[ex.category] || CAT.other;
  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 relative ${cat.bg} ${cat.border} hover:brightness-110 transition-all`}>
      {isPR && (
        <span className="absolute top-2 right-2 text-[8px] font-black font-mono bg-amber-500/20 border border-amber-500/40 text-amber-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
          <Trophy className="h-2.5 w-2.5" /> PR
        </span>
      )}
      <div className="flex items-center gap-2">
        <span className={`text-[8px] font-black font-mono uppercase px-2 py-0.5 rounded ${cat.bg} ${cat.border} border ${cat.text}`}>{cat.label}</span>
        {ex.source === 'comment' && (
          <span className="text-[8px] font-mono text-slate-500 bg-slate-900/50 border border-slate-800/50 px-1.5 py-0.5 rounded">extra</span>
        )}
      </div>
      <p className="text-xs font-bold text-slate-100 leading-snug pr-8">{ex.name}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className={`text-lg font-black font-mono ${cat.text}`}>{ex.weight > 0 ? `${ex.weight}kg` : ex.raw}</span>
          {ex.totalReps > 0 && <span className="text-[9px] text-slate-500 block font-mono">× {ex.totalReps} reps</span>}
        </div>
        {ex.volume > 0 && (
          <span className="text-[9px] text-slate-500 font-mono">{ex.volume.toLocaleString()} kg·rep</span>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dataLen = useRef(0);
  const [view, setView] = useState('overview');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedRecordIdx, setSelectedRecordIdx] = useState(null);
  const [openAccordions, setOpenAccordions] = useState({});
  const [todayName, setTodayName] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [selectedExercise, setSelectedExercise] = useState(null);

  const googleFormLink = "https://docs.google.com/forms/d/e/1FAIpQLSdVNfNAvYbliACRYzgkozkfvKB-bonPel-7J8TSKcaxPjAIHQ/viewform?usp=send_form";

  useEffect(() => {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    setTodayName(days[new Date().getDay()]);
    fetchData();
    // A home-screen app stays open in the background; pick up new sessions when it comes back
    const onVisible = () => { if (document.visibilityState === 'visible') fetchData(true); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/workout', { cache: 'no-store' });
      if (!res.ok) throw new Error('API failed');
      const d = await res.json();
      setError(null);
      // Keep the selected session on a background refresh unless new sessions arrived
      if (d.length > 0 && (!silent || d.length !== dataLen.current)) {
        setSelectedRecord(d[d.length - 1]);
        setSelectedRecordIdx(d.length - 1);
      }
      dataLen.current = d.length;
      setData(d);
    } catch (e) { if (!silent) setError('Failed to load data.'); }
    finally { if (!silent) setLoading(false); }
  };

  // ── Computed values ──────────────────────────────────────────────────────
  const lastRecord  = data[data.length - 1] || null;
  const prMap       = useMemo(() => computePRs(data), [data]);
  const exHistory   = useMemo(() => computeExerciseHistory(data), [data]);
  const allExNames  = useMemo(() => Object.keys(exHistory).sort(), [exHistory]);

  const coachFeedback = useMemo(
    () => generateCoachFeedback(selectedRecord, data, selectedRecordIdx),
    [selectedRecord, data, selectedRecordIdx]
  );

  // Weight trend
  const weightTrend = data.filter(d => d.preWeight > 0).map(d => ({
    date: d.date.slice(0,5), pre: d.preWeight, post: d.postWeight,
    loss: d.preWeight && d.postWeight ? parseFloat((d.preWeight - d.postWeight).toFixed(2)) : 0
  }));

  // Volume trend
  const volumeTrend = data.filter(d => d.totalSessionVolume > 0).slice(-20).map(d => ({
    date: d.date.slice(0,5),
    vol: Math.round(d.totalSessionVolume),
    routine: d.routine
  }));

  // Sleep trend
  const sleepTrend = data.filter(d => d.sleepScore > 0).slice(-20).map(d => ({
    date: d.date.slice(0,5), sleep: d.sleepScore
  }));

  // Muscle group frequency
  const muscleFreq = useMemo(() => {
    const freq = {};
    data.forEach(r => (r.allExercises || []).forEach(e => {
      if (e.category && e.category !== 'other') freq[e.category] = (freq[e.category] || 0) + 1;
    }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([cat, count]) => ({ cat, count, ...CAT[cat] }));
  }, [data]);

  // Current session exercises (for selected record)
  const sessionExercises = useMemo(() => {
    if (!selectedRecord) return [];
    const all = selectedRecord.allExercises || [];
    if (filterCat === 'all') return all;
    return all.filter(e => e.category === filterCat);
  }, [selectedRecord, filterCat]);

  // Exercise history chart data for selected exercise
  const exChartData = useMemo(() => {
    if (!selectedExercise || !exHistory[selectedExercise]) return [];
    return exHistory[selectedExercise].slice(-15).map(e => ({
      date: e.date.slice(0,5), weight: e.weight, reps: e.totalReps, vol: e.volume
    }));
  }, [selectedExercise, exHistory]);

  const TABS = [
    { id: 'overview',   label: 'Overview',     icon: Activity },
    { id: 'session',    label: 'Session Log',   icon: Dumbbell },
    { id: 'exercises',  label: 'Exercises',     icon: BarChart2 },
    { id: 'prs',        label: 'Personal Records', icon: Trophy },
    { id: 'coach',      label: 'AI Coach',      icon: Sparkles },
    { id: 'physique',   label: 'Physique',      icon: Camera },
    { id: 'schedule',   label: 'Schedule',      icon: Calendar },
    { id: 'log',        label: 'Log Workout',   icon: BookOpen },
  ];

  return (
    <div className="min-h-screen text-slate-100 font-sans antialiased" style={{ background: 'linear-gradient(135deg, #03040a 0%, #060810 50%, #040508 100%)' }}>
      <Head>
        <title>Ishrar's Fitness Tracker</title>
        <meta name="description" content="Premium fitness tracking dashboard — workout log, personal records, AI coach." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[10%] h-[700px] w-[700px] bg-emerald-500/4 rounded-full blur-[160px]" />
        <div className="absolute top-[30%] right-[0%] h-[500px] w-[500px] bg-sky-500/4 rounded-full blur-[140px]" />
        <div className="absolute bottom-[0%] left-[30%] h-[400px] w-[400px] bg-purple-500/4 rounded-full blur-[130px]" />
      </div>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-2xl" style={{ background: 'rgba(3,4,10,0.85)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/10 border border-white/8 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[8px] font-mono font-black tracking-[0.2em] text-emerald-400 uppercase">Live</span>
              </div>
              <h1 className="text-sm font-black tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">ISHRAR FITNESS OS</h1>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1 bg-white/3 border border-white/6 p-1 rounded-2xl">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setView(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                  view === id
                    ? 'bg-white/8 text-white border border-white/10 shadow'
                    : 'text-slate-500 hover:text-slate-200'
                }`}>
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>

          <button onClick={() => fetchData()} disabled={loading}
            className="flex items-center gap-2 bg-white/4 border border-white/8 hover:border-white/15 text-slate-300 py-2 px-3 rounded-xl text-[10px] font-bold cursor-pointer transition-all disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:block">Sync</span>
          </button>
        </div>

        {/* Mobile Tab Row */}
        <div className="lg:hidden flex gap-1 overflow-x-auto px-4 pb-3 hide-scrollbar">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setView(id)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-xl text-[9px] font-bold cursor-pointer transition-all ${
                view === id ? 'bg-white/8 text-white border border-white/10' : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}>
              <Icon className="h-3 w-3" />{label}
            </button>
          ))}
        </div>
      </header>

      {/* ── HERO STATS BAR ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 z-10 relative">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Latest Weight', val: lastRecord?.preWeight ? `${lastRecord.preWeight} kg` : '—', sub: 'Pre-workout', color: 'text-sky-400' },
            { label: 'Sweat Loss', val: lastRecord?.preWeight && lastRecord?.postWeight ? `${(lastRecord.preWeight - lastRecord.postWeight).toFixed(1)} kg` : '—', sub: 'Last session', color: 'text-amber-400' },
            { label: 'Session Volume', val: lastRecord?.totalSessionVolume ? `${(lastRecord.totalSessionVolume/1000).toFixed(1)}k` : '—', sub: 'kg·rep', color: 'text-emerald-400' },
            { label: 'Sessions Logged', val: data.length || '—', sub: 'Total', color: 'text-purple-400' },
            { label: 'PRs Tracked', val: Object.keys(prMap).length || '—', sub: 'Exercises', color: 'text-rose-400' },
            { label: 'Training Days', val: data.filter(d => d.allExercises?.length > 0).length || '—', sub: 'Active sessions', color: 'text-fuchsia-400' },
          ].map(({ label, val, sub, color }) => (
            <div key={label} className="bg-white/2 border border-white/6 rounded-2xl p-4 flex flex-col gap-1">
              <span className="text-[8px] text-slate-500 font-mono uppercase tracking-wider">{label}</span>
              <span className={`text-2xl font-black font-mono ${color}`}>{loading ? '—' : val}</span>
              <span className="text-[8px] text-slate-600 font-mono">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 z-10 relative flex flex-col gap-6">

        {/* ══════ OVERVIEW TAB ══════ */}
        {view === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Weight trend */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white/2 border border-white/6 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black tracking-widest uppercase font-mono text-slate-300">Bodyweight Trend</h3>
                    <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Pre vs post-workout weight</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={weightTrend.slice(-20)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="preGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="postGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip content={<ChartTip />} />
                    <Legend wrapperStyle={{ fontSize: 9, color: '#64748b' }} />
                    <Area name="Pre-Workout (kg)" type="monotone" dataKey="pre" stroke="#38bdf8" fill="url(#preGrad)" strokeWidth={2} dot={false} />
                    <Area name="Post-Workout (kg)" type="monotone" dataKey="post" stroke="#f59e0b" fill="url(#postGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Volume trend */}
              <div className="bg-white/2 border border-white/6 rounded-2xl p-5 flex flex-col gap-4">
                <h3 className="text-xs font-black tracking-widest uppercase font-mono text-slate-300">Session Volume (kg·rep)</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={volumeTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
                    <Tooltip content={<ChartTip />} />
                    <Bar dataKey="vol" name="Volume (kg·rep)" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Muscle freq + sleep */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Muscle group frequency */}
              <div className="bg-white/2 border border-white/6 rounded-2xl p-5 flex flex-col gap-4">
                <h3 className="text-xs font-black tracking-widest uppercase font-mono text-slate-300">Muscle Group Frequency</h3>
                <div className="flex flex-col gap-2.5">
                  {muscleFreq.map(({ cat, count, color, text, label }) => {
                    const max = muscleFreq[0]?.count || 1;
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <span className={`text-[9px] font-bold font-mono w-16 shrink-0 ${text}`}>{label}</span>
                        <div className="flex-1 bg-white/4 rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${(count / max) * 100}%`, background: color }} />
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono w-8 text-right">{count}×</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sleep trend */}
              <div className="bg-white/2 border border-white/6 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-xs font-black tracking-widest uppercase font-mono text-slate-300">Sleep Quality</h3>
                </div>
                <ResponsiveContainer width="100%" height={130}>
                  <LineChart data={sleepTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTip />} />
                    <Line name="Sleep Score" type="monotone" dataKey="sleep" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Top PRs snapshot */}
              <div className="bg-white/2 border border-white/6 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <h3 className="text-xs font-black tracking-widest uppercase font-mono text-slate-300">Top Personal Records</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {Object.entries(prMap)
                    .sort((a, b) => b[1].volume - a[1].volume)
                    .slice(0, 5)
                    .map(([name, pr]) => {
                      const cat = CAT[pr.category] || CAT.other;
                      return (
                        <div key={name} className="flex items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: cat.color }} />
                            <span className="text-slate-300 truncate font-medium">{name}</span>
                          </div>
                          <span className={`font-black font-mono shrink-0 ${cat.text}`}>{pr.weight}kg</span>
                        </div>
                      );
                    })}
                </div>
                <button onClick={() => setView('prs')} className="text-[9px] text-amber-400/70 font-mono hover:text-amber-400 transition-colors cursor-pointer text-left">
                  View all {Object.keys(prMap).length} records →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════ SESSION LOG TAB ══════ */}
        {view === 'session' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Session detail */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {selectedRecord ? (
                <>
                  {/* Session header */}
                  <div className="bg-white/2 border border-white/8 rounded-2xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex items-center justify-between gap-3 flex-wrap relative">
                      <div>
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">{selectedRecord.dayOfWeek}</span>
                        <h2 className="text-2xl font-black font-mono text-white">{selectedRecord.date}</h2>
                        <p className="text-xs text-slate-400 mt-0.5">{selectedRecord.routine}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        {[
                          { label: 'Pre', val: selectedRecord.preWeight ? `${selectedRecord.preWeight}kg` : '—', color: 'text-sky-400' },
                          { label: 'Post', val: selectedRecord.postWeight ? `${selectedRecord.postWeight}kg` : '—', color: 'text-amber-400' },
                          { label: 'Loss', val: selectedRecord.preWeight && selectedRecord.postWeight ? `${(selectedRecord.preWeight - selectedRecord.postWeight).toFixed(1)}kg` : '—', color: 'text-emerald-400' },
                        ].map(({ label, val, color }) => (
                          <div key={label} className="bg-white/4 rounded-xl p-2.5 border border-white/6">
                            <span className="text-[8px] text-slate-500 font-mono block">{label}</span>
                            <span className={`text-sm font-black font-mono ${color}`}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedRecord.comment && (
                      <div className="mt-4 bg-white/3 border border-white/6 rounded-xl p-3">
                        <p className="text-xs text-slate-300 italic leading-relaxed">"{selectedRecord.comment}"</p>
                      </div>
                    )}

                    <div className="mt-3 flex gap-3">
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                        <Moon className="h-3 w-3 text-indigo-400" />
                        {selectedRecord.sleep || 'Unknown sleep'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                        <Zap className="h-3 w-3 text-amber-400" />
                        {selectedRecord.totalSessionVolume?.toLocaleString() || 0} kg·rep total
                      </div>
                    </div>
                  </div>

                  {/* Category filter */}
                  <div className="flex gap-1.5 flex-wrap">
                    {['all', ...Object.keys(CAT)].map(cat => {
                      const catData = CAT[cat];
                      const count = cat === 'all'
                        ? sessionExercises.length
                        : (selectedRecord.allExercises || []).filter(e => e.category === cat).length;
                      if (count === 0 && cat !== 'all') return null;
                      return (
                        <button key={cat} onClick={() => setFilterCat(cat)}
                          className={`text-[9px] font-bold font-mono px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                            filterCat === cat
                              ? `${catData?.bg || 'bg-white/8'} ${catData?.border || 'border-white/15'} ${catData?.text || 'text-white'}`
                              : 'bg-white/2 border-white/6 text-slate-500 hover:text-slate-300'
                          }`}>
                          {catData?.label || 'All'} {count > 0 && `(${count})`}
                        </button>
                      );
                    })}
                  </div>

                  {/* Exercise cards grid */}
                  {sessionExercises.length === 0 ? (
                    <div className="bg-white/2 border border-white/6 rounded-2xl p-12 text-center">
                      <Dumbbell className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                      <p className="text-xs text-slate-600 font-mono">No exercises logged for this session</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sessionExercises.map((ex, i) => {
                        const isPR = prMap[ex.name] && ex.weight >= prMap[ex.name].weight && ex.weight > 0;
                        return <ExerciseCard key={i} ex={ex} isPR={isPR} />;
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white/2 border border-white/6 rounded-2xl p-16 text-center">
                  <Sparkles className="h-8 w-8 text-slate-700 mx-auto mb-3 animate-pulse" />
                  <p className="text-xs text-slate-600 font-mono">Select a session from the timeline →</p>
                </div>
              )}
            </div>

            {/* Right: Timeline */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-white/2 border border-white/6 rounded-2xl p-4 flex flex-col gap-3 max-h-[800px] overflow-hidden">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest font-mono text-slate-300">Session Timeline</h3>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Click any session to view its exercises</p>
                </div>
                <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
                  {[...data].reverse().map((record) => {
                    const origIdx = data.indexOf(record);
                    const isSelected = origIdx === selectedRecordIdx;
                    const exCount = (record.allExercises || []).length;
                    const isTraining = exCount > 0;
                    const isRest = !isTraining;

                    return (
                      <div key={origIdx} onClick={() => { setSelectedRecord(record); setSelectedRecordIdx(origIdx); }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-emerald-500/40 bg-emerald-950/15 shadow-lg shadow-emerald-950/20'
                            : 'border-white/5 bg-white/2 hover:border-white/10 hover:bg-white/3'
                        }`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-mono font-bold text-slate-400">{record.date} · {record.dayOfWeek}</span>
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            isRest
                              ? 'bg-slate-900/40 border-slate-800/40 text-slate-500'
                              : 'bg-emerald-950/30 border-emerald-800/30 text-emerald-400'
                          }`}>
                            {isRest ? 'Rest' : `${exCount} exercises`}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-1 font-medium">{record.routine}</p>
                        {record.comment && (
                          <p className="text-[9px] text-slate-500 mt-1 line-clamp-1 italic">"{record.comment}"</p>
                        )}
                        {isTraining && (
                          <div className="flex flex-wrap gap-1 mt-2 border-t border-white/4 pt-2">
                            {(record.allExercises || []).slice(0, 6).map((ex, xi) => {
                              const cat = CAT[ex.category] || CAT.other;
                              return (
                                <span key={xi} className={`text-[7px] font-mono font-bold px-1.5 py-0.5 rounded border ${cat.bg} ${cat.border} ${cat.text}`}>
                                  {ex.name.split(' ').slice(0, 2).join(' ')}
                                </span>
                              );
                            })}
                            {(record.allExercises || []).length > 6 && (
                              <span className="text-[7px] font-mono text-slate-600 bg-white/3 border border-white/6 px-1.5 py-0.5 rounded">
                                +{(record.allExercises || []).length - 6} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════ EXERCISES TAB ══════ */}
        {view === 'exercises' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Exercise list */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <div className="bg-white/2 border border-white/6 rounded-2xl p-4 flex flex-col gap-3 max-h-[700px] overflow-hidden">
                <h3 className="text-xs font-black uppercase tracking-widest font-mono text-slate-300">All Exercises ({allExNames.length})</h3>
                <div className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
                  {allExNames.map(name => {
                    const history = exHistory[name] || [];
                    const cat = CAT[history[0]?.category] || CAT.other;
                    const pr = prMap[name];
                    const timesLogged = history.length;
                    return (
                      <button key={name} onClick={() => setSelectedExercise(name)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          selectedExercise === name
                            ? `${cat.bg} ${cat.border}`
                            : 'bg-white/2 border-white/5 hover:border-white/10'
                        }`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[8px] font-mono font-bold ${cat.text}`}>{cat.label}</span>
                          <span className="text-[8px] text-slate-600 font-mono">{timesLogged}×</span>
                        </div>
                        <p className="text-xs font-bold text-slate-200 mt-1">{name}</p>
                        {pr && <p className={`text-[9px] font-mono mt-0.5 ${cat.text}`}>PR: {pr.weight}kg</p>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Exercise detail */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {selectedExercise && exHistory[selectedExercise] ? (
                <>
                  {(() => {
                    const history = exHistory[selectedExercise];
                    const cat = CAT[history[0]?.category] || CAT.other;
                    const pr = prMap[selectedExercise];
                    const firstEntry = history[0];
                    const lastEntry = history[history.length - 1];
                    const weightGain = lastEntry && firstEntry ? lastEntry.weight - firstEntry.weight : 0;
                    return (
                      <>
                        {/* Exercise summary */}
                        <div className={`rounded-2xl border p-5 relative overflow-hidden ${cat.bg} ${cat.border}`}>
                          <div className="absolute top-0 right-0 h-32 w-32 rounded-full blur-3xl pointer-events-none" style={{ background: cat.color + '10' }} />
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span className={`text-[9px] font-mono font-bold uppercase ${cat.text}`}>{cat.label}</span>
                              <h2 className="text-xl font-black text-white mt-1">{selectedExercise}</h2>
                              <p className="text-[10px] text-slate-400 mt-1">{history.length} sessions logged · {firstEntry?.date} → {lastEntry?.date}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-500 font-mono block">Personal Record</span>
                              <span className={`text-3xl font-black font-mono ${cat.text}`}>{pr?.weight || 0}kg</span>
                              <span className="text-[9px] text-slate-500 block font-mono">{pr?.date}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mt-4">
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                              <span className="text-[8px] text-slate-500 font-mono block">Start Weight</span>
                              <span className="text-lg font-black font-mono text-slate-200">{firstEntry?.weight || 0}kg</span>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                              <span className="text-[8px] text-slate-500 font-mono block">Latest Weight</span>
                              <span className="text-lg font-black font-mono text-slate-200">{lastEntry?.weight || 0}kg</span>
                            </div>
                            <div className="bg-black/20 rounded-xl p-3 text-center">
                              <span className="text-[8px] text-slate-500 font-mono block">Progress</span>
                              <span className={`text-lg font-black font-mono ${weightGain >= 0 ? cat.text : 'text-rose-400'}`}>
                                {weightGain >= 0 ? '+' : ''}{weightGain}kg
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Weight progress chart */}
                        <div className="bg-white/2 border border-white/6 rounded-2xl p-5 flex flex-col gap-3">
                          <h3 className="text-xs font-black uppercase tracking-widest font-mono text-slate-300">Weight Progression</h3>
                          <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={exChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                              <Tooltip content={<ChartTip />} />
                              <Line name="Weight (kg)" type="monotone" dataKey="weight" stroke={cat.color} strokeWidth={2.5}
                                dot={{ r: 4, fill: cat.color, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Volume chart */}
                        <div className="bg-white/2 border border-white/6 rounded-2xl p-5 flex flex-col gap-3">
                          <h3 className="text-xs font-black uppercase tracking-widest font-mono text-slate-300">Volume per Session (kg·rep)</h3>
                          <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={exChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" />
                              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 9, fill: '#475569' }} axisLine={false} tickLine={false} />
                              <Tooltip content={<ChartTip />} />
                              <Bar dataKey="vol" name="Volume (kg·rep)" fill={cat.color} radius={[4, 4, 0, 0]} opacity={0.75} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Session history table */}
                        <div className="bg-white/2 border border-white/6 rounded-2xl overflow-hidden">
                          <div className="p-4 border-b border-white/5">
                            <h3 className="text-xs font-black uppercase tracking-widest font-mono text-slate-300">Full History</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-white/5">
                                  {['Date', 'Weight', 'Reps', 'Volume', 'Sets Format'].map(h => (
                                    <th key={h} className="px-4 py-2 text-left text-[8px] font-black tracking-widest text-slate-600 uppercase font-mono">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {[...history].reverse().map((h, i) => (
                                  <tr key={i} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                                    <td className="px-4 py-2.5 text-[10px] font-mono text-slate-400">{h.date}</td>
                                    <td className={`px-4 py-2.5 text-xs font-black font-mono ${cat.text}`}>{h.weight}kg</td>
                                    <td className="px-4 py-2.5 text-[10px] font-mono text-slate-400">{h.totalReps}</td>
                                    <td className="px-4 py-2.5 text-[10px] font-mono text-slate-500">{h.volume.toLocaleString()}</td>
                                    <td className="px-4 py-2.5 text-[10px] font-mono text-slate-500">{h.raw}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="bg-white/2 border border-white/6 rounded-2xl p-20 text-center">
                  <BarChart2 className="h-8 w-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-xs text-slate-600 font-mono">Select an exercise from the list to see its full history and progress charts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════ PERSONAL RECORDS TAB ══════ */}
        {view === 'prs' && (
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-black tracking-widest uppercase font-mono text-slate-300 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" /> Personal Records
              </h2>
              <p className="text-[9px] text-slate-500 font-mono mt-1">Best weight lifted per exercise across all sessions</p>
            </div>

            {/* Group by category */}
            {Object.entries(CAT).map(([catKey, catData]) => {
              const prs = Object.entries(prMap)
                .filter(([, pr]) => pr.category === catKey)
                .sort((a, b) => b[1].weight - a[1].weight);
              if (prs.length === 0) return null;
              return (
                <div key={catKey} className="flex flex-col gap-3">
                  <h3 className={`text-[10px] font-black uppercase tracking-widest font-mono ${catData.text} flex items-center gap-2`}>
                    <span className="h-2 w-2 rounded-full" style={{ background: catData.color }} />
                    {catData.label} ({prs.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {prs.map(([name, pr]) => {
                      const history = exHistory[name] || [];
                      const firstWeight = history[0]?.weight || 0;
                      const gainPct = firstWeight > 0 ? (((pr.weight - firstWeight) / firstWeight) * 100).toFixed(0) : 0;
                      return (
                        <div key={name} className={`rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer hover:brightness-110 transition-all ${catData.bg} ${catData.border}`}
                          onClick={() => { setSelectedExercise(name); setView('exercises'); }}>
                          <div className="flex items-center justify-between">
                            <Trophy className={`h-4 w-4 ${catData.text}`} />
                            <span className="text-[8px] font-mono text-slate-500">{pr.date}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200 leading-snug">{name}</p>
                            <p className={`text-3xl font-black font-mono mt-1 ${catData.text}`}>{pr.weight}<span className="text-lg">kg</span></p>
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-mono">
                            <span className="text-slate-500">{pr.totalReps} reps · {pr.volume.toLocaleString()} kg·rep</span>
                            {gainPct > 0 && <span className={`${catData.text} font-bold`}>+{gainPct}% ↑</span>}
                          </div>
                          <div className="text-[8px] text-slate-600 font-mono">
                            Logged {history.length}× · Click to see history
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════ AI COACH TAB ══════ */}
        {view === 'coach' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex flex-col gap-4">
              {selectedRecord ? (
                <>
                  {/* Session selector */}
                  <div className="bg-white/2 border border-white/6 rounded-2xl p-4 flex items-center gap-3 flex-wrap">
                    <span className="text-[9px] text-slate-500 font-mono">Analyzing:</span>
                    <span className="text-xs font-bold text-white">{selectedRecord.date} — {selectedRecord.routine}</span>
                    <span className="text-[8px] text-slate-600 font-mono ml-auto">Select a different session in the timeline →</span>
                  </div>

                  {/* Quote */}
                  <div className="bg-gradient-to-r from-emerald-950/30 to-sky-950/20 border border-emerald-800/20 rounded-2xl p-5">
                    <p className="text-sm text-emerald-300 font-medium italic leading-relaxed">"{coachFeedback.quote}"</p>
                  </div>

                  {/* Analysis sections */}
                  {[
                    { label: 'Willpower & Mindset Audit', content: coachFeedback.willpower, color: 'text-amber-400', bgColor: 'bg-amber-950/20', borderColor: 'border-amber-800/20' },
                    { label: 'CNS & Hydration Status', content: coachFeedback.cns, color: 'text-sky-400', bgColor: 'bg-sky-950/20', borderColor: 'border-sky-800/20' },
                    { label: 'Progressive Overload Report', content: coachFeedback.progression, color: 'text-emerald-400', bgColor: 'bg-emerald-950/20', borderColor: 'border-emerald-800/20' },
                    { label: 'Directive for Next Session', content: coachFeedback.directive, color: 'text-purple-400', bgColor: 'bg-purple-950/20', borderColor: 'border-purple-800/20' },
                  ].map(({ label, content, color, bgColor, borderColor }) => (
                    <div key={label} className={`rounded-2xl border p-5 flex flex-col gap-2 ${bgColor} ${borderColor}`}>
                      <h4 className={`text-[9px] font-black uppercase tracking-widest font-mono ${color}`}>{label}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{content}</p>
                    </div>
                  ))}
                </>
              ) : (
                <div className="bg-white/2 border border-white/6 rounded-2xl p-16 text-center">
                  <Sparkles className="h-8 w-8 text-slate-700 mx-auto mb-3 animate-pulse" />
                  <p className="text-xs text-slate-600 font-mono">Select a session to analyze</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="lg:col-span-5">
              <div className="bg-white/2 border border-white/6 rounded-2xl p-4 flex flex-col gap-3 max-h-[700px] overflow-hidden">
                <h3 className="text-xs font-black uppercase tracking-widest font-mono text-slate-300">Session Timeline</h3>
                <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
                  {[...data].reverse().map((record) => {
                    const origIdx = data.indexOf(record);
                    const isSelected = origIdx === selectedRecordIdx;
                    return (
                      <div key={origIdx} onClick={() => { setSelectedRecord(record); setSelectedRecordIdx(origIdx); }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected ? 'border-emerald-500/40 bg-emerald-950/15' : 'border-white/5 bg-white/2 hover:border-white/10'
                        }`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-mono font-bold text-slate-400">{record.date}</span>
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                            (record.allExercises || []).length > 0
                              ? 'border-emerald-800/30 text-emerald-400 bg-emerald-950/20'
                              : 'border-slate-800/30 text-slate-500 bg-slate-900/20'
                          }`}>
                            {(record.allExercises || []).length > 0 ? `${(record.allExercises || []).length} ex` : 'Rest'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5 truncate">{record.routine}</p>
                        {record.comment && <p className="text-[9px] text-slate-500 mt-1 line-clamp-1 italic">"{record.comment}"</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════ PHYSIQUE TAB ══════ */}
        {view === 'physique' && (
          <PhysiqueTracker data={data} loading={loading} error={error} />
        )}

        {/* ══════ SCHEDULE TAB ══════ */}
        {view === 'schedule' && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-sm font-black tracking-widest uppercase font-mono text-slate-300">Weekly Training Schedule</h2>
              <p className="text-[9px] text-slate-500 font-mono mt-1">Today: <span className="text-emerald-400">{todayName}</span></p>
            </div>
            {['Saturday','Monday','Sunday','Thursday','Tuesday','Wednesday','Friday'].map((day) => {
              const isToday = day === todayName;
              const isOpen = !!openAccordions[day];
              const routine = ROUTINES[day];
              return (
                <div key={day} className={`border rounded-2xl transition-all ${isToday ? 'border-emerald-500/30 bg-emerald-950/5' : 'border-white/6 bg-white/2'}`}>
                  <button onClick={() => setOpenAccordions(p => ({ ...p, [day]: !p[day] }))}
                    className="w-full flex items-center justify-between p-4 cursor-pointer text-left">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded-lg border ${
                        isToday ? 'bg-emerald-950 text-emerald-400 border-emerald-800/40' : 'bg-white/4 text-slate-400 border-white/8'
                      }`}>{day.slice(0,3).toUpperCase()}</span>
                      <div>
                        <span className={`text-xs font-extrabold ${isToday ? 'text-emerald-400' : 'text-slate-200'}`}>{routine?.title}</span>
                        {isToday && <span className="ml-2 text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-800/40 px-1.5 py-0.5 rounded font-mono font-bold">TODAY</span>}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════ LOG WORKOUT TAB ══════ */}
        {view === 'log' && (
          <div className="max-w-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-sm font-black tracking-widest uppercase font-mono text-slate-300">Log Workout</h2>
              <p className="text-[9px] text-slate-500 font-mono mt-1">Pick exercises, tap in sets — saves straight to your sheet</p>
            </div>
            <a href="/log"
              className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-sm tracking-wider bg-gradient-to-r from-emerald-500 to-sky-500 text-black hover:from-emerald-400 hover:to-sky-400 transition-all shadow-lg shadow-emerald-500/10 cursor-pointer">
              Open Workout Logger <Dumbbell className="h-4 w-4" />
            </a>
            <div className="bg-white/2 border border-white/6 rounded-2xl p-5 text-[11px] text-slate-400 leading-relaxed">
              <p className="font-bold text-slate-200 mb-2">On iPhone</p>
              <p>Open <span className="font-mono text-slate-200">/log</span> in Safari → Share → <span className="text-slate-200">Add to Home Screen</span>. It opens full-screen like an app and keeps your draft while you train.</p>
            </div>
            <a href={googleFormLink} target="_blank" rel="noopener noreferrer"
              className="self-start flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300">
              Old Google Form <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-white/4 mt-4 text-center">
        <p className="text-[9px] text-slate-700 font-mono">© 2026 ISHRAR FITNESS OS · All sessions logged · Built for consistent progress</p>
      </footer>
    </div>
  );
}
