import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  Droplet, 
  Flame, 
  Calendar, 
  Dumbbell, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  Sparkles, 
  Clock, 
  Utensils, 
  Heart,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

const WEEKDAYS = [
  { day: 'Sunday', key: 'Sunday', title: "Lower Body, Abs & Cardio (A) — Endocrine Activation" },
  { day: 'Monday', key: 'Monday', title: "Upper Body & Arms (B) — Postural Realignment" },
  { day: 'Tuesday', key: 'Tuesday', title: "Active Functional Recovery — Postural Calibration" },
  { day: 'Wednesday', key: 'Wednesday', title: "Active Functional Recovery — Postural Calibration" },
  { day: 'Thursday', key: 'Thursday', title: "Lower Body, Abs & Cardio (B) — Posterior Chain" },
  { day: 'Friday', key: 'Friday', title: "Absolute Nervous System Restoration — Peak Synthesis" },
  { day: 'Saturday', key: 'Saturday', title: "Upper Body & Arms (A) — V-Taper Primary Width" }
];

const ROUTINES = {
  'Saturday': {
    title: 'Upper Body & Arms (A) — V-Taper Primary Width Focus',
    color: 'border-sky-500/40 text-sky-400',
    accentColor: '#38bdf8',
    roster: [
      { name: 'Weighted Pull-Ups', target: '3-4 sets × 6-8 reps', note: 'Primary V-taper lat width driver' },
      { name: 'Bench / Chest Press', target: '3-4 sets × 8-10 reps', note: 'Horizontal pressing mass builder' },
      { name: 'Seated Rows', target: '3 sets × 10 reps', note: 'Mid-back thickness and posture control' },
      { name: 'Dumbbell Lateral Raises', target: '4 sets × 12-15 reps', note: 'Medial deltoid lateral width' },
      { name: 'Forearm Isolation Circuit', target: '3 sets × 15 reps', note: 'Grip stabilization and wrist density' }
    ]
  },
  'Sunday': {
    title: 'Lower Body, Abs & Cardio (A) — Endocrine Activation & Leaning',
    color: 'border-emerald-500/40 text-emerald-400',
    accentColor: '#34d399',
    roster: [
      { name: 'Weighted Squats', target: '4 sets × 8-10 reps', note: 'Posterior chain recruitment and CNS load' },
      { name: 'Romanian Deadlifts (RDLs)', target: '3 sets × 10 reps', note: 'Hamstring & glute hypertrophy focus' },
      { name: 'Walking Lunges', target: '3 sets × 12 reps per leg', note: 'Unilateral loading & quad sweeps' },
      { name: 'Standing Calf Raises', target: '4 sets × 15 reps', note: 'Ankle mobility and calf density' },
      { name: 'Hanging Leg Raises', target: '3 sets × Failure', note: 'Deep lower abdominal compression' },
      { name: 'Metabolic Finisher: Run & Cycle Intervals', target: '15-20 Minutes', note: 'High intensity aerobic optimization' }
    ]
  },
  'Monday': {
    title: 'Upper Body & Arms (B) — Postural Realignment & Mass Density',
    color: 'border-sky-500/40 text-sky-400',
    accentColor: '#38bdf8',
    roster: [
      { name: 'Bodyweight Pull-Ups', target: '4 sets × Max Reps', note: 'Structural endurance & postural reset' },
      { name: 'Incline Dumbbell Press', target: '3 sets × 10-12 reps', note: 'Upper clavicular pectoral target' },
      { name: 'Chest-Supported Rows', target: '3 sets × 12 reps', note: 'Rear deltoid and rhomboid scapular retraction' },
      { name: 'Cable Lateral Raises', target: '4 sets × 15 reps', note: 'Constant tension lateral shoulder sweep' },
      { name: 'Isolated Wrist Curls', target: '3 sets × 20 reps', note: 'Pronator and flexor mass building' }
    ]
  },
  'Tuesday': {
    title: 'Active Functional Recovery — Postural Calibration & CNS Reset',
    color: 'border-amber-500/40 text-amber-400',
    accentColor: '#fbbf24',
    roster: [
      { name: 'Low-Intensity Steady State (LISS) Walking', target: '30-40 Minutes', note: 'Fat oxidation & active recovery window' },
      { name: 'Deep Core Isometric Planks', target: '3 sets × 60s holds', note: 'Transverse abdominis stabilization' },
      { name: 'Spinal Decompression & Postural Drills', target: 'Daily Protocol', note: 'Tissue mobilization and chest opening' }
    ]
  },
  'Wednesday': {
    title: 'Active Functional Recovery — Postural Calibration & CNS Reset',
    color: 'border-amber-500/40 text-amber-400',
    accentColor: '#fbbf24',
    roster: [
      { name: 'Low-Intensity Steady State (LISS) Walking', target: '30-40 Minutes', note: 'CNS decompression & dynamic recovery' },
      { name: 'Deep Core Isometric Planks', target: '3 sets × 60s holds', note: 'Core stabilizer activation' },
      { name: 'Spinal Decompression & Postural Drills', target: 'Daily Protocol', note: 'Soft tissue mobilization and thoracic mobility' }
    ]
  },
  'Thursday': {
    title: 'Lower Body, Abs & Cardio (B) — Posterior Chain & Hypertrophy',
    color: 'border-emerald-500/40 text-emerald-400',
    accentColor: '#34d399',
    roster: [
      { name: 'Goblet or Front Squats', target: '3 sets × 10-12 reps', note: 'Quad load dominance and core stability' },
      { name: 'Heavy Romanian Deadlifts (RDLs)', target: '4 sets × 8 reps', note: 'Posterior hinge progression' },
      { name: 'Leg Press / Bulgarian Split Squat variations', target: '3 sets × 10 reps', note: 'Unilateral quad and glute focus' },
      { name: 'Seated Calf Raises', target: '4 sets × 12 reps', note: 'Soleus expansion & ankle mobility' },
      { name: 'Decline Ab Crunches', target: '3 sets × 15 reps', note: 'Rectus abdominis overload' },
      { name: 'Cardio Finisher: Run & Cycle Steady State', target: 'LISS Protocol', note: 'Glycogen depletion and recovery acceleration' }
    ]
  },
  'Friday': {
    title: 'Absolute Nervous System Restoration — Peak Protein Synthesis Window',
    color: 'border-rose-500/40 text-rose-400',
    accentColor: '#f43f5e',
    roster: [
      { name: 'Zero Physical Exercise', target: 'Rest Focus', note: 'Nervous system recalibration & tissue remodeling' },
      { name: 'Nutrition Directive: Amino Acid Baseline', target: '4 Whole Eggs', note: 'Healthy fats, zinc, and muscle building blocks' },
      { name: 'Total Protein Target', target: '130 - 140 grams', note: 'To support muscle recovery and synthesis' }
    ]
  }
};

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayName, setTodayName] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [openAccordions, setOpenAccordions] = useState({});
  const [stats, setStats] = useState({
    lastPreWeight: 0,
    lastPostWeight: 0,
    weightDiff: 0,
    maxPullUpVol: 0,
    maxBenchVol: 0,
    maxSquatVol: 0
  });

  const googleFormLink = "https://docs.google.com/forms/d/e/1FAIpQLSdVNfNAvYbliACRYzgkozkfvKB-bonPel-7J8TSKcaxPjAIHQ/viewform?usp=send_form";
  const embedFormLink = "https://docs.google.com/forms/d/e/1FAIpQLSdVNfNAvYbliACRYzgkozkfvKB-bonPel-7J8TSKcaxPjAIHQ/viewform?embedded=true";

  useEffect(() => {
    // Discover local day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[new Date().getDay()];
    setTodayName(currentDayName);
    setActiveTab(currentDayName);

    // Fetch data
    fetchWorkoutData();
  }, []);

  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workout');
      if (!res.ok) throw new Error('Failed to retrieve biometrics from API route');
      const workoutData = await res.json();
      
      setData(workoutData);

      // Compute statistics
      if (workoutData.length > 0) {
        const lastRecord = workoutData[workoutData.length - 1];
        
        let maxPullUp = 0;
        let maxBench = 0;
        let maxSquat = 0;

        workoutData.forEach(r => {
          if (r.pullUpVolume > maxPullUp) maxPullUp = r.pullUpVolume;
          if (r.benchVolume > maxBench) maxBench = r.benchVolume;
          if (r.squatVolume > maxSquat) maxSquat = r.squatVolume;
        });

        const diff = lastRecord.preWeight && lastRecord.postWeight 
          ? (lastRecord.postWeight - lastRecord.preWeight).toFixed(1)
          : 0;

        setStats({
          lastPreWeight: lastRecord.preWeight || 0,
          lastPostWeight: lastRecord.postWeight || 0,
          weightDiff: diff,
          maxPullUpVol: maxPullUp,
          maxBenchVol: maxBench,
          maxSquatVol: maxSquat
        });
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('System connection error. Unable to load metrics database.');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (day) => {
    setOpenAccordions(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  // Custom tooltips for graphs
  const CustomBiometricTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl text-xs">
          <p className="text-slate-400 font-bold mb-1">{`Date: ${label}`}</p>
          <p className="text-sky-400">{`Pre-Workout: ${payload[0].value} kg`}</p>
          {payload[1] && <p className="text-amber-500">{`Post-Workout: ${payload[1].value} kg`}</p>}
          {payload[0] && payload[1] && (
            <p className="text-emerald-400 border-t border-slate-800 mt-1 pt-1 font-semibold">
              {`Loss: ${(payload[1].value - payload[0].value).toFixed(1)} kg`}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomVolumeTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl text-xs">
          <p className="text-slate-400 font-bold mb-1">{`Date: ${label}`}</p>
          {payload.map((p, idx) => (
            <p key={idx} style={{ color: p.color }}>
              {`${p.name}: ${p.value.toLocaleString()} kg·rep`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-slate-950">
      <Head>
        <title>V-Taper Physique Analytics & Biometrics Command Center</title>
        <meta name="description" content="Production-grade dark-mode physique optimization metrics pipeline & active scheduler." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Hero Header Area */}
      <header className="relative border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold font-mono">Mission Control Active</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-200 to-sky-400">
              V-TAPER PHYSIQUE OPTIMIZATION SYSTEM
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              5-Month Physique Design Protocol: <span className="text-sky-400">V-Taper targeting</span> • <span className="text-emerald-400 font-medium">Core leaning</span> • <span className="text-amber-500">Postural calibration</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchWorkoutData} 
              disabled={loading}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-700 py-1.5 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-300 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>REFRESH METRICS</span>
            </button>
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-right hidden sm:block">
              <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">System Time</div>
              <div className="text-xs font-mono font-bold text-slate-300">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Core Dashboard Grid */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-12 flex flex-col gap-8">
        
        {/* Dynamic High-Density Metric Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Pre-Weight</span>
              <Activity className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl md:text-3xl font-black tracking-tight text-sky-400">
                {loading ? '---' : `${stats.lastPreWeight || '0'} kg`}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Last measured baseline</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Post-Weight</span>
              <Droplet className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-3">
              <div className="text-2xl md:text-3xl font-black tracking-tight text-amber-500">
                {loading ? '---' : `${stats.lastPostWeight || '0'} kg`}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Post-workout baseline</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Fluid Volatility</span>
              <Flame className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              <div className={`text-2xl md:text-3xl font-black tracking-tight ${stats.weightDiff < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {loading ? '---' : `${stats.weightDiff > 0 ? '+' : ''}${stats.weightDiff} kg`}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Acute sweating shift</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Max Pull-up Vol</span>
              <Dumbbell className="h-4 w-4 text-sky-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl md:text-3xl font-black tracking-tight text-sky-400">
                {loading ? '---' : `${stats.maxPullUpVol.toLocaleString()} kg`}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Peak load target</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Max Chest Vol</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl md:text-3xl font-black tracking-tight text-emerald-400">
                {loading ? '---' : `${stats.maxBenchVol.toLocaleString()} kg`}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Pressing volume peak</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Max Squat Vol</span>
              <Sparkles className="h-4 w-4 text-purple-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl md:text-3xl font-black tracking-tight text-purple-400">
                {loading ? '---' : `${stats.maxSquatVol.toLocaleString()} kg`}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Posterior overdrive peak</p>
            </div>
          </div>
        </section>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: PANE 1 & PANE 3 */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* PANE 1: BIOMETRIC ANALYTICS ENGINE */}
            <section className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-sky-400" />
                    PANE 1: BIOMETRIC FLUID VOLATILITY GRAPH
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Water balance drop post-session to monitor fat oxidation speeds, system water loss, and true dry metabolic mass.
                  </p>
                </div>
              </div>

              {/* Chart 1: Biometric Fluid Volatility */}
              <div className="h-72 w-full bg-slate-950/40 rounded-xl border border-slate-850 p-4 relative">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-mono">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-sky-400" />
                      <span>Syncing Biometric Matrix...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-rose-400 font-mono">
                    {error}
                  </div>
                ) : data.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-mono">
                    No biometric entries recorded yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false}
                        domain={['dataMin - 1', 'dataMax + 1']} 
                      />
                      <Tooltip content={<CustomBiometricTooltip />} />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                      <Line 
                        name="Pre-Workout Mass (kg)"
                        type="monotone" 
                        dataKey="preWeight" 
                        stroke="#38bdf8" 
                        strokeWidth={2.5}
                        dot={{ r: 3, strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line 
                        name="Post-Workout Mass (kg)"
                        type="monotone" 
                        dataKey="postWeight" 
                        stroke="#f59e0b" 
                        strokeWidth={2.5}
                        dot={{ r: 3, strokeWidth: 1 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Chart 2: Progressive Overload Tracker */}
              <div className="flex flex-col gap-2 mt-4">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    PROGRESSIVE OVERLOAD STIMULUS ENGINE
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Verification of training performance trajectory based on calculated absolute Volume Load (Weight × Repetitions).
                  </p>
                </div>

                <div className="h-72 w-full bg-slate-950/40 rounded-xl border border-slate-850 p-4 relative mt-2">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-mono">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
                        <span>Aggregating Volume Matrix...</span>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-rose-400 font-mono">
                      {error}
                    </div>
                  ) : data.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 font-mono">
                      No overload metrics recorded yet.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSquat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPullUp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorBench" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                        <XAxis 
                          dataKey="date" 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false}
                        />
                        <YAxis 
                          stroke="#64748b" 
                          fontSize={10} 
                          tickLine={false}
                        />
                        <Tooltip content={<CustomVolumeTooltip />} />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                        <Area 
                          name="Squat Volume" 
                          type="monotone" 
                          dataKey="squatVolume" 
                          stroke="#10b981" 
                          fillOpacity={1} 
                          fill="url(#colorSquat)" 
                          strokeWidth={2}
                        />
                        <Area 
                          name="Pull-Up Volume" 
                          type="monotone" 
                          dataKey="pullUpVolume" 
                          stroke="#38bdf8" 
                          fillOpacity={1} 
                          fill="url(#colorPullUp)" 
                          strokeWidth={2}
                        />
                        <Area 
                          name="Chest Press Volume" 
                          type="monotone" 
                          dataKey="benchVolume" 
                          stroke="#a855f7" 
                          fillOpacity={1} 
                          fill="url(#colorBench)" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </section>

            {/* PANE 3: CHRONO-ALIGNED DYNAMIC TRAINING SCHEDULE */}
            <section className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col gap-6">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                  PANE 3: CHRONO-ALIGNED DYNAMIC SCHEDULE
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated local time tracker parsing and aligning daily physique routines based on the calendar day.
                </p>
              </div>

              {/* Today's Target Highlight Card */}
              {todayName && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-400/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-widest uppercase">
                      TODAY'S TARGETED SPLIT
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {todayName} (Active)
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-100 mb-4 tracking-tight">
                    {ROUTINES[todayName]?.title}
                  </h3>

                  <div className="flex flex-col gap-3">
                    {ROUTINES[todayName]?.roster.map((ex, index) => (
                      <div key={index} className="flex items-start justify-between p-3 bg-slate-900/80 border border-slate-850 rounded-lg hover:border-slate-800 hover:bg-slate-850/30 transition-all duration-300">
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold text-slate-100 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                            {ex.name}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5">{ex.note}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/20 px-2.5 py-0.5 rounded-md">
                          {ex.target}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekly Accordions Container */}
              <div className="flex flex-col gap-2.5 mt-2">
                <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase px-1">WEEKLY SPLIT DIRECTORY</h4>
                
                {WEEKDAYS.map((wk, index) => {
                  const isToday = wk.key === todayName;
                  const isOpen = !!openAccordions[wk.key];
                  const routine = ROUTINES[wk.key];
                  
                  return (
                    <div 
                      key={index} 
                      className={`border rounded-xl transition-all duration-300 bg-slate-900/20 ${
                        isToday 
                          ? 'border-emerald-500/20 bg-emerald-950/5' 
                          : 'border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <button 
                        onClick={() => toggleAccordion(wk.key)}
                        className="w-full flex items-center justify-between p-4 cursor-pointer text-left focus:outline-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                            isToday 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' 
                              : 'bg-slate-950 text-slate-400 border border-slate-900'
                          }`}>
                            {wk.day.substring(0, 3).toUpperCase()}
                          </span>
                          <div>
                            <span className={`text-xs font-extrabold ${isToday ? 'text-emerald-400' : 'text-slate-200'}`}>
                              {routine.title.split(' — ')[0]}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {routine.title.split(' — ')[1]}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isToday && (
                            <span className="text-[9px] font-bold text-emerald-500 font-mono tracking-widest bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-900 uppercase">
                              Active
                            </span>
                          )}
                          {isOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-slate-850/60 pt-3 flex flex-col gap-2.5 bg-slate-950/20">
                          {routine.roster.map((ex, exIdx) => (
                            <div key={exIdx} className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-900 rounded-lg">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-200">{ex.name}</span>
                                <span className="text-[10px] text-slate-500 mt-0.5">{ex.note}</span>
                              </div>
                              <span className="text-[11px] font-mono font-bold text-slate-400">
                                {ex.target}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: PANE 2 - INTEGRATED DATA CAPTURE */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            
            {/* PANE 2: INTEGRATED DATA CAPTURE CENTRE */}
            <section className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col gap-6 lg:sticky lg:top-24">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-sky-400" />
                  PANE 2: BIOMETRIC CAPTURE GATEWAY
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct telemetry conduit. Log body mass drops, sets, reps, and workout variables in real-time.
                </p>
              </div>

              {/* High Contrast Direct Launch Button */}
              <a 
                href={googleFormLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 hover:from-sky-400 hover:to-emerald-400 p-3.5 rounded-xl font-black text-center text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-sky-500/10 cursor-pointer active:scale-98"
              >
                <span>LOG LATEST METRICS — LAUNCH INPUT PORTAL</span>
                <ExternalLink className="h-4 w-4" />
              </a>

              {/* Form IFrame Embed Container */}
              <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-950 relative min-h-[600px] flex flex-col">
                <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-850 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Secure IFrame Stream</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                </div>
                <iframe 
                  src={embedFormLink} 
                  width="100%" 
                  height="650" 
                  frameBorder="0" 
                  marginHeight="0" 
                  marginWidth="0"
                  className="flex-1 w-full border-none outline-none filter invert opacity-80"
                  title="Biometrics Submission Terminal"
                >
                  Loading portal telemetry stream...
                </iframe>
              </div>

              {/* Security/Integration Note */}
              <div className="bg-slate-950/50 border border-slate-900 p-3.5 rounded-xl text-[10px] text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-400 block mb-0.5">SYSTEM ARCHITECTURE BRIEF</span>
                Data payloads ingested via the gateway are parsed instantly. If a cell returns unparseable or null notation, the server maps records to <code className="text-slate-400">0</code> to preserve graph continuity.
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer System Branding */}
      <footer className="border-t border-slate-900/60 bg-slate-950/40 py-6 px-6 mt-16 text-center text-slate-500 text-[10px] font-mono tracking-widest uppercase max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© 2026 PHYSIQUE DEPLOYMENT ARCHITECTURE. ALL SYSTEM SYSTEMS GO.</span>
        <span className="text-sky-500/60 flex items-center gap-1 text-[9px]">
          <Heart className="h-3 w-3 fill-current text-rose-500" />
          OPTIMIZED METRIC DEPLOYMENT
        </span>
      </footer>
    </div>
  );
}
