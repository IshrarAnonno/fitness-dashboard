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
  RefreshCw,
  HelpCircle,
  X,
  Info,
  Camera,
  Scan,
  Maximize2,
  MoveHorizontal
} from 'lucide-react';
import PhysiqueTracker from '../components/PhysiqueTracker';

const WEEKDAYS = [
  { day: 'Sunday', key: 'Sunday', title: "Lower Body, Abs & Cardio — Endocrine Activation & Leaning" },
  { day: 'Monday', key: 'Monday', title: "Upper Body & Arms — V-Taper Primary Width Focus" },
  { day: 'Tuesday', key: 'Tuesday', title: "Active Recovery — Postural Calibration & Core Stability" },
  { day: 'Wednesday', key: 'Wednesday', title: "Active Recovery — Spinal Decompression & Tissue Repair" },
  { day: 'Thursday', key: 'Thursday', title: "Lower Body, Abs & Cardio — Endocrine Activation & Leaning" },
  { day: 'Friday', key: 'Friday', title: "Absolute Rest — Nervous System Restoration" },
  { day: 'Saturday', key: 'Saturday', title: "Upper Body & Arms — V-Taper Primary Width Focus" }
];

const UPPER_BODY_ROSTER = [
  { name: 'Warm-up Protocol', target: '5 Mins', note: 'Arm Circles & Cat-Cow Stretch' },
  { name: 'Assisted Pull-ups', target: '3-4 sets × 5-7 reps', note: 'Primary V-taper lat width driver' },
  { name: 'Seated Machine Rows', target: '3 sets × 10-12 reps', note: 'Mid-back thickness and posture control' },
  { name: 'Dumbbell Bench Press', target: '3 sets × 10 reps', note: 'Horizontal pressing chest mass builder' },
  { name: 'Assisted Push-ups on Knees', target: '2 sets × 10 reps', note: 'Chest conditioner & endurance finisher' },
  { name: 'Dumbbell Shoulder Press', target: '3 sets × 10 reps', note: 'Anterior deltoid mass builder' },
  { name: 'Dumbbell Lateral Raises', target: '3 sets × 12-15 reps', note: 'Medial deltoid lateral width' },
  { name: 'Dumbbell Bicep Curls', target: '3 sets × 10-12 reps', note: 'Arm flexion biceps hypertrophy' },
  { name: 'Overhead DB Tricep Extensions', target: '3 sets × 12 reps', note: 'Triceps long head developer' },
  { name: 'Wrist Curls + Reverse Wrist Curls Superset', target: '3 sets × Failure', note: 'Grip stabilization & wrist density' }
];

const LOWER_BODY_ROSTER = [
  { name: 'Warm-up Protocol', target: '5 Mins', note: 'Bodyweight Squats & Torso Twists' },
  { name: 'Weighted Squats', target: '3 sets × 12 reps', note: 'CNS stimulation & quad sweeps' },
  { name: 'Walking Lunges', target: '3 sets × 20 steps total', note: 'Dynamic unilateral quad and glute load' },
  { name: 'Dumbbell Romanian Deadlifts (RDLs)', target: '3 sets × 10 reps', note: 'Posterior chain glutes & hamstring builder' },
  { name: 'Standing Calf Raises', target: '3 sets × 15-20 reps', note: 'Ankle flexion and lower leg density' },
  { name: 'Lying Leg Raises', target: '3 sets × 12-15 reps', note: 'Core stabilizer lower abdominal target' },
  { name: 'Core & Flexibility Superset', target: '3 Rounds', note: 'Forearm Planks (45s) & Cobra Stretch (30s)' },
  { name: 'Cardio Finisher', target: '17-20 Mins total', note: '12-15 min Run + 5 min Cycle' }
];

const ROUTINES = {
  'Saturday': {
    title: 'Upper Body & Arms — V-Taper Primary Width Focus',
    color: 'border-sky-500/40 text-sky-400',
    accentColor: '#38bdf8',
    roster: UPPER_BODY_ROSTER
  },
  'Monday': {
    title: 'Upper Body & Arms — V-Taper Primary Width Focus',
    color: 'border-sky-500/40 text-sky-400',
    accentColor: '#38bdf8',
    roster: UPPER_BODY_ROSTER
  },
  'Sunday': {
    title: 'Lower Body, Abs & Cardio — Endocrine Activation & Leaning',
    color: 'border-emerald-500/40 text-emerald-400',
    accentColor: '#34d399',
    roster: LOWER_BODY_ROSTER
  },
  'Thursday': {
    title: 'Lower Body, Abs & Cardio — Endocrine Activation & Leaning',
    color: 'border-emerald-500/40 text-emerald-400',
    accentColor: '#34d399',
    roster: LOWER_BODY_ROSTER
  },
  'Tuesday': {
    title: 'Active Recovery — Postural Calibration & Core Stability',
    color: 'border-amber-500/40 text-amber-400',
    accentColor: '#fbbf24',
    roster: [
      { name: 'Light Treadmill Walking', target: '20-30 Mins', note: 'CNS down-regulation & fat wash' },
      { name: 'Steady Cycling', target: '15-20 Mins', note: 'Lactic acid clearance & leg flushing' },
      { name: 'Postural Activation: Bird-Dog Exercise', target: '3 sets × 10 reps/side', note: 'Scapular & glute cross-stabilizer' },
      { name: 'Core Endurance: Forearm Core Planks', target: '3 sets × 45-60s hold', note: 'Static transverse core brace conditioning' },
      { name: 'Decompression Flow: Cobra Stretch & Cat-Cow', target: '5-10 Mins', note: 'Spine mobilizing & lumbar extension' }
    ]
  },
  'Wednesday': {
    title: 'Active Recovery — Spinal Decompression & Tissue Repair',
    color: 'border-amber-500/40 text-amber-400',
    accentColor: '#fbbf24',
    roster: [
      { name: 'Light Treadmill Walking', target: '20-30 Mins', note: 'Low-impact recovery blood circulation' },
      { name: 'Steady Cycling', target: '15-20 Mins', note: 'Joint articulation & active recovery' },
      { name: 'Spinal Decompression Flow', target: '5 Mins', note: 'Cobra Stretch & Cat-Cow dynamic flow' },
      { name: 'Full-Body Flexibility', target: '10 Mins', note: "Child's Pose & Hamstring Stretch static holds" }
    ]
  },
  'Friday': {
    title: 'Absolute Rest — Nervous System Restoration',
    color: 'border-rose-500/40 text-rose-400',
    accentColor: '#f43f5e',
    roster: [
      { name: 'Zero Physical Exercise', target: 'Rest Focus', note: 'Nervous system recalibration & muscle tissue remodeling' },
      { name: 'Nutrition Directive: Amino Acid Baseline', target: '4 Whole Eggs', note: 'Healthy fats, minerals, and muscle building blocks' },
      { name: 'Total Protein Target', target: '130 - 140 grams', note: 'Achieve precise muscle synthesis recovery target' }
    ]
  }
};

const HELP_GLOSSARY = {
  'biometrics': {
    title: 'Pre-Workout vs. Post-Workout Weight (Biometric Fluid Trend)',
    simpleMeaning: 'Your weight right before you start training versus right after you finish your workout/cardio.',
    whyItMatters: 'The drop shows how much sweat/water your body flushed out during the session. It helps track how hard your metabolism is working and prevents dehydration. Tracking this ensures you stay properly hydrated post-session.'
  },
  'volume': {
    title: 'Training Volume Load (Progressive Overload)',
    simpleMeaning: 'The total weight lifted multiplied by the total repetitions completed (Weight × Total Reps).',
    whyItMatters: 'To build an aesthetic V-Taper, your muscles need to do slightly more work over time. If your volume line is going up week-by-week, you are successfully forcing your body to grow and adapt. It represents the absolute overload stimulus.'
  },
  'vTaper': {
    title: 'V-Taper Ratio Metrics (Pull-Ups & Lateral Raises)',
    simpleMeaning: 'Tracking how much work your back (Pull-Ups) and side shoulders (Dumbbell Lateral Raises) are doing.',
    whyItMatters: 'These are the two specific muscle groups that make your shoulders look broader and your waist look narrower, carving out that classic aesthetic, athletic physique.'
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

  const [dashboardView, setDashboardView] = useState('telemetry'); // 'telemetry' or 'physique'
  const [systemTime, setSystemTime] = useState('');

  // Help Modal State
  const [helpModal, setHelpModal] = useState({
    isOpen: false,
    title: '',
    simpleMeaning: '',
    whyItMatters: ''
  });

  const googleFormLink = "https://docs.google.com/forms/d/e/1FAIpQLSdVNfNAvYbliACRYzgkozkfvKB-bonPel-7J8TSKcaxPjAIHQ/viewform?usp=send_form";
  const embedFormLink = "https://docs.google.com/forms/d/e/1FAIpQLSdVNfNAvYbliACRYzgkozkfvKB-bonPel-7J8TSKcaxPjAIHQ/viewform?embedded=true";

  useEffect(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[new Date().getDay()];
    setTodayName(currentDayName);
    setActiveTab(currentDayName);
    setSystemTime(new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }));
    fetchWorkoutData();
  }, []);

  const fetchWorkoutData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workout');
      if (!res.ok) throw new Error('Failed to retrieve biometrics from API route');
      const workoutData = await res.json();
      
      setData(workoutData);

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

  const openExplanation = (key) => {
    const item = HELP_GLOSSARY[key];
    if (item) {
      setHelpModal({
        isOpen: true,
        title: item.title,
        simpleMeaning: item.simpleMeaning,
        whyItMatters: item.whyItMatters
      });
    }
  };

  const closeExplanation = () => {
    setHelpModal(prev => ({ ...prev, isOpen: false }));
  };

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
        <title>Ishrar's Fitness Tracker</title>
        <meta name="description" content="Beginner-friendly dark-mode fitness tracking architecture & biometric analytics." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Interactive Explanation Modal */}
      {helpModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl animate-scale-up">
            <button 
              onClick={closeExplanation}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-200 transition-colors p-1.5 hover:bg-slate-850 rounded-lg cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-start gap-3 mt-2">
              <div className="bg-sky-950 border border-sky-850 text-sky-400 p-2 rounded-xl shrink-0 mt-0.5">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-100 pr-6">
                  {helpModal.title}
                </h3>
                <div className="mt-4 flex flex-col gap-4">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono mb-1">Simple Explanation</h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-lg border border-slate-850">
                      {helpModal.simpleMeaning}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono mb-1">Why it matters</h4>
                    <p className="text-xs text-slate-300 leading-relaxed bg-sky-950/10 p-3 rounded-lg border border-sky-950/40">
                      {helpModal.whyItMatters}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header Area */}
      <header className="relative border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40 py-4 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold font-mono">Biometric Terminal Ready</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-slate-200 to-sky-400">
              ISHRAR'S FITNESS TRACKER
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
              <span>SYNC TELEMETRY</span>
            </button>
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-right hidden sm:block">
              <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">System Time</div>
              <div className="text-xs font-mono font-bold text-slate-300">
                {systemTime || '---'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Core Dashboard Grid */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 md:px-12 flex flex-col gap-8">
        
        {/* Dynamic High-Density Metric Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all relative group">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Pre-Weight</span>
              <button 
                onClick={() => openExplanation('biometrics')}
                className="text-slate-500 hover:text-sky-400 p-0.5 rounded cursor-pointer transition-colors"
                title="Explain parameter"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <div className="text-2xl md:text-3xl font-black tracking-tight text-sky-400">
                {loading ? '---' : `${stats.lastPreWeight || '0'} kg`}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Starting Body weight</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all relative group">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Post-Weight</span>
              <button 
                onClick={() => openExplanation('biometrics')}
                className="text-slate-500 hover:text-amber-500 p-0.5 rounded cursor-pointer transition-colors"
                title="Explain parameter"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <div className="text-2xl md:text-3xl font-black tracking-tight text-amber-500">
                {loading ? '---' : `${stats.lastPostWeight || '0'} kg`}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Post-workout weight</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all relative group">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Sweat Loss</span>
              <button 
                onClick={() => openExplanation('biometrics')}
                className="text-slate-500 hover:text-emerald-400 p-0.5 rounded cursor-pointer transition-colors"
                title="Explain parameter"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <div className={`text-2xl md:text-3xl font-black tracking-tight ${stats.weightDiff < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {loading ? '---' : `${stats.weightDiff > 0 ? '+' : ''}${stats.weightDiff} kg`}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Acute fluid volatility</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all relative group">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Max Pull-up Vol</span>
              <button 
                onClick={() => openExplanation('vTaper')}
                className="text-slate-500 hover:text-sky-400 p-0.5 rounded cursor-pointer transition-colors"
                title="Explain parameter"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <div className="text-2xl md:text-3xl font-black tracking-tight text-sky-400">
                {loading ? '---' : `${stats.maxPullUpVol.toLocaleString()} kg`}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Back overload peak</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all relative group">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Max Side-Delt Vol</span>
              <button 
                onClick={() => openExplanation('vTaper')}
                className="text-slate-500 hover:text-emerald-400 p-0.5 rounded cursor-pointer transition-colors"
                title="Explain parameter"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <div className="text-2xl md:text-3xl font-black tracking-tight text-emerald-400">
                {loading ? '---' : `${stats.maxBenchVol.toLocaleString()} kg`}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Pressing/Lateral peak</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-between hover:border-slate-800 transition-all relative group">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold tracking-widest uppercase">Max Squat Vol</span>
              <button 
                onClick={() => openExplanation('volume')}
                className="text-slate-500 hover:text-purple-400 p-0.5 rounded cursor-pointer transition-colors"
                title="Explain parameter"
              >
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3">
              <div className="text-2xl md:text-3xl font-black tracking-tight text-purple-400">
                {loading ? '---' : `${stats.maxSquatVol.toLocaleString()} kg`}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Posterior chain peak</p>
            </div>
          </div>
        </section>

        {/* Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: PANE 1 & PANE 3 */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* Dashboard Sub-View Navigation Tabs */}
            <div className="flex border-b border-slate-900 bg-slate-900/10 p-1 rounded-xl gap-2 self-start">
              <button
                onClick={() => setDashboardView('telemetry')}
                className={`px-4 py-2 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                  dashboardView === 'telemetry'
                    ? 'bg-gradient-to-r from-sky-500/15 to-emerald-500/15 border border-sky-500/30 text-sky-400 shadow-md shadow-sky-950/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5" />
                  Telemetry Charts
                </span>
              </button>
              <button
                onClick={() => setDashboardView('physique')}
                className={`px-4 py-2 rounded-lg text-xs font-black tracking-wider uppercase transition-all duration-305 cursor-pointer ${
                  dashboardView === 'physique'
                    ? 'bg-gradient-to-r from-sky-500/15 to-emerald-500/15 border border-sky-500/30 text-sky-400 shadow-md shadow-sky-950/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Camera className="h-3.5 w-3.5" />
                  Physique Progress & AI Coach
                </span>
              </button>
            </div>

            {dashboardView === 'telemetry' ? (
              /* PANE 1: BEGINNER-FRIENDLY VISUALIZATION ENGINE */
              <section className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col gap-6">
                
                {/* Chart 1: Sweat & Fluid Loss Chart */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-sky-400" />
                        SWEAT & FLUID LOSS CHART (BIOMETRIC FLUID TREND)
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Visualizes weight changes before and after workouts to audit hydration and cardiovascular pacing.
                      </p>
                    </div>
                    <button 
                      onClick={() => openExplanation('biometrics')}
                      className="flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 font-mono bg-sky-950/40 border border-sky-900/40 py-1 px-2.5 rounded-lg cursor-pointer"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>EXPLAIN CHART</span>
                    </button>
                  </div>

                  <div 
                    onClick={() => openExplanation('biometrics')}
                    className="h-72 w-full bg-slate-950/40 rounded-xl border border-slate-850 p-4 relative cursor-pointer hover:border-slate-850/80 transition-all group"
                    title="Click to view full scientific explanation"
                  >
                    <div className="absolute top-2 right-2 bg-slate-900/80 border border-slate-850 text-[9px] font-mono text-slate-500 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to explain chart variables
                    </div>
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
                            name="Pre-Workout Weight (kg)"
                            type="monotone" 
                            dataKey="preWeight" 
                            stroke="#38bdf8" 
                            strokeWidth={2.5}
                            dot={{ r: 3, strokeWidth: 1 }}
                            activeDot={{ r: 5 }}
                          />
                          <Line 
                            name="Post-Workout Weight (kg)"
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
                  <div className="bg-slate-950/30 border border-slate-900 px-4 py-3 rounded-lg text-slate-400 text-xs flex items-center gap-2">
                    <span className="font-semibold text-sky-400 uppercase font-mono text-[9px] bg-sky-950/50 border border-sky-900/40 px-1.5 py-0.5 rounded">Core Logic</span>
                    <span><strong>Fluid Loss Correlation:</strong> Post-session drop reveals acute sweating volume relative to total calorie output. Compare weights above to measure training hydration needs.</span>
                  </div>
                </div>

                {/* Chart 2: Muscle Strength Progress Chart */}
                <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-slate-850/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-400" />
                        MUSCLE STRENGTH PROGRESS CHART (TRAINING VOLUME TRACKER)
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Monitors overload performance metrics over time to verify systematic physical enhancements.
                      </p>
                    </div>
                    <button 
                      onClick={() => openExplanation('volume')}
                      className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-mono bg-emerald-950/40 border border-emerald-900/40 py-1 px-2.5 rounded-lg cursor-pointer"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>EXPLAIN OVERLOAD</span>
                    </button>
                  </div>

                  <div 
                    onClick={() => openExplanation('volume')}
                    className="h-72 w-full bg-slate-950/40 rounded-xl border border-slate-850 p-4 relative cursor-pointer hover:border-slate-850/80 transition-all group"
                    title="Click to view overload explanation"
                  >
                    <div className="absolute top-2 right-2 bg-slate-900/80 border border-slate-850 text-[9px] font-mono text-slate-500 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to explain overload progression
                    </div>
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
                  <div className="bg-slate-950/30 border border-slate-900 px-4 py-3 rounded-lg text-slate-400 text-xs flex items-center gap-2">
                    <span className="font-semibold text-emerald-400 uppercase font-mono text-[9px] bg-emerald-950/50 border border-emerald-900/40 px-1.5 py-0.5 rounded">Core Logic</span>
                    <span><strong>Trajectory Analysis:</strong> Upward spikes confirm progressive overload development. Aim to increase the volume profiles weekly to support long-term muscular hypertrophy.</span>
                  </div>
                </div>
              </section>
            ) : (
              <PhysiqueTracker data={data} loading={loading} error={error} />
            )}

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

                  <h3 className="text-xl font-black text-slate-100 mb-2 tracking-tight">
                    {ROUTINES[todayName]?.title.split(' — ')[0]}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 italic">
                    {ROUTINES[todayName]?.title.split(' — ')[1]}
                  </p>

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
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-900/20 px-2.5 py-0.5 rounded-md shrink-0 ml-4">
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
                              <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0 ml-4">
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
                <span>LOG LATEST METRICS — LAUNCH PORTAL</span>
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
        <span>© 2026 ISHRAR'S FITNESS TRACKER. ALL SYSTEMS ACTIVE.</span>
        <span className="text-sky-500/60 flex items-center gap-1 text-[9px]">
          <Heart className="h-3 w-3 fill-current text-rose-500" />
          OPTIMIZED METRIC DEPLOYMENT
        </span>
      </footer>
    </div>
  );
}
