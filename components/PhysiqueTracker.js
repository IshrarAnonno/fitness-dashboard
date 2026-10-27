import React, { useState, useEffect, useRef } from 'react';
import { 
  MoveHorizontal, 
  Camera, 
  Scan, 
  Maximize2, 
  X, 
  RefreshCw,
  Sparkles,
  Info,
  TrendingUp,
  Dumbbell,
  Award,
  Activity,
  Flame
} from 'lucide-react';

// Progress photos are private Drive files, so they're served through /api/photo,
// which only answers browsers unlocked with the logging PIN (see usePhotoAccess).
const getDirectDriveUrl = (driveUrl) => {
  if (!driveUrl) return '';
  const match = driveUrl.match(/(?:id=|\/d\/|open\?id=)([^&]+)/);
  if (match && match[1]) {
    return `/api/photo?id=${encodeURIComponent(match[1])}`;
  }
  return driveUrl;
};

// 'checking' | 'unlocked' | 'locked'. A phone that already saved its PIN in the
// workout logger is unlocked automatically.
function usePhotoAccess() {
  const [access, setAccess] = useState('checking');
  const unlock = async (pin) => {
    const r = await fetch('/api/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
    if (r.ok) setAccess('unlocked');
    return r.ok;
  };
  useEffect(() => {
    (async () => {
      try {
        const { unlocked } = await (await fetch('/api/unlock')).json();
        if (unlocked) return setAccess('unlocked');
        let saved = '';
        try { saved = JSON.parse(localStorage.getItem('ft.pin') || '""'); } catch {}
        if (!(saved && (await unlock(saved)))) setAccess('locked');
      } catch { setAccess('locked'); }
    })();
  }, []);
  return { access, unlock };
}

function PhotoUnlock({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!(await onUnlock(pin))) setError('That PIN was not accepted.');
  };
  return (
    <form onSubmit={submit} className="bg-slate-900/40 border border-slate-850 rounded-2xl p-10 text-center text-xs text-slate-400 font-mono flex flex-col items-center gap-3">
      <Camera className="h-8 w-8 text-slate-500" />
      <div className="text-slate-300">Progress photos are private</div>
      <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">Enter your logging PIN once to view them on this device.</p>
      <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoComplete="off"
        className="w-48 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base text-white text-center tracking-widest outline-none" />
      {error && <div className="text-rose-400">{error}</div>}
      <button type="submit" disabled={!pin} className="px-5 py-2 rounded-xl bg-sky-500 text-black font-bold disabled:opacity-30">Unlock photos</button>
    </form>
  );
}

// Muscle groups definition for the interactive anatomical scan
const MUSCLES = {
  lats: {
    name: 'Latissimus Dorsi (Lats)',
    category: 'back',
    desc: 'Primary driver of V-taper width. Broader lats create the illusion of a narrower waist and a wide, athletic back sweep.',
    guide: 'Perform assisted pull-ups with a strict 4-second eccentric (lowering) phase. Keep elbows flared slightly outward and pull with back force, not biceps.',
    tip: 'Focus on full vertical stretches at the bottom of pulldowns to engage the lower insertion of the lats.'
  },
  delts: {
    name: 'Deltoids (Shoulders)',
    category: 'shoulders',
    desc: 'Builds side roundness and capped shoulder shape. Essential for three-dimensional silhouette width.',
    guide: 'Control lateral raises; avoid swinging weight. Focus on raising dumbbells to your sides (plane of the scapula, about 30 degrees forward) rather than straight out.',
    tip: 'Inject high-rep lateral raise dropsets at the end of chest sessions to force blood perfusion and delt caps.'
  },
  chest: {
    name: 'Pectorals (Chest)',
    category: 'chest',
    desc: 'Horizontal pressing mass. Target upper clavicular chest (incline) and flat pectoral thickness.',
    guide: 'During dumbbell bench press, descend deep to stretch the outer fibers. Squeeze the pectorals hard at the top without banging the weights together.',
    tip: 'Incline pressing creates the visual shelf that makes the upper chest look thick and full.'
  },
  arms: {
    name: 'Biceps & Triceps (Arms)',
    category: 'arms',
    desc: 'Arm thickness and forearm density. Tricep long head extensions combined with hammer curls drive overall sleeve size.',
    guide: 'During curls, lock your elbows at your ribcage. For triceps, concentrate on the full lockouts at terminal extension to fire the medial and lateral heads.',
    tip: 'Aesthetic forearm density is driven by heavy grip holds and wrist roller curls. Do not skip forearm curls at the end of pull sessions.'
  },
  core: {
    name: 'Abdominals & Core',
    category: 'core',
    desc: 'Leaning and posture control. Static plank holds and leg raises build the transverse abdominal wall for a tight waistline.',
    guide: 'During lying leg raises, press your lower back flat into the ground. Control the lowering phase without letting your feet touch the floor.',
    tip: 'Core aesthetics are revealed by a low body fat percentage, but built through heavy breathing bracing during squats and deadlifts.'
  },
  legs: {
    name: 'Quads & Hamstrings (Legs)',
    category: 'legs',
    desc: 'Hypertrophy engine and central nervous system driver. Heavy squats and leg presses trigger general growth hormone release.',
    guide: 'Hinge back at the hips during Romanian deadlifts to load the hamstrings. Drive through your heels on squats and leg press for quad loading.',
    tip: 'Unilateral work (like walking lunges) fixes leg size imbalances and improves ankle/knee joint stability.'
  }
};

const MUSCLE_HOTPOINTS = [
  { id: 'delts', top: '28%', left: '26%', side: 'Left Shoulder' },
  { id: 'delts', top: '28%', left: '74%', side: 'Right Shoulder' },
  { id: 'lats', top: '38%', left: '32%', side: 'Left Lat' },
  { id: 'lats', top: '38%', left: '68%', side: 'Right Lat' },
  { id: 'chest', top: '32%', left: '50%', side: 'Upper Chest' },
  { id: 'arms', top: '42%', left: '20%', side: 'Left Arm' },
  { id: 'arms', top: '42%', left: '80%', side: 'Right Arm' },
  { id: 'core', top: '46%', left: '50%', side: 'Core Wall' },
  { id: 'legs', top: '68%', left: '44%', side: 'Left Quad' },
  { id: 'legs', top: '68%', left: '56%', side: 'Right Quad' }
];

export default function PhysiqueTracker({ data, loading, error }) {
  const [beforeIdx, setBeforeIdx] = useState(0);
  const [afterIdx, setAfterIdx] = useState(0);
  const [comparePct, setComparePct] = useState(50);
  const [isDraggingCompare, setIsDraggingCompare] = useState(false);
  const compareContainerRef = useRef(null);
  
  const [trackerTab, setTrackerTab] = useState('scanner'); // 'scanner' (Interactive) or 'visual' (Slider Compare)
  const [scannedIdx, setScannedIdx] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanComplete, setScanComplete] = useState(false);
  
  const [selectedMuscle, setSelectedMuscle] = useState('lats');
  const [lightboxUrl, setLightboxUrl] = useState('');
  const { access, unlock } = usePhotoAccess();

  // Extract muscle-specific volumes from a record
  const getMuscleVolume = (record, category) => {
    if (!record) return 0;
    
    // Main column mappings
    let baseVol = 0;
    if (category === 'chest') baseVol = record.benchVolume || 0;
    if (category === 'back') baseVol = record.pullUpVolume || 0;
    if (category === 'shoulders') baseVol = record.lateralVolume || 0;
    if (category === 'legs') baseVol = record.squatVolume || 0;
    
    // Sum matching accessories parsed from session notes
    const accVol = (record.accessories || [])
      .filter(a => a.category === category)
      .reduce((sum, a) => sum + (a.volume || 0), 0);
      
    return baseVol + accVol;
  };

  // Find all records that have a valid photoUrl and select defaults
  useEffect(() => {
    if (data && data.length > 0) {
      const photoIndices = data
        .map((r, idx) => r.photoUrl ? idx : -1)
        .filter(idx => idx !== -1);

      if (photoIndices.length > 0) {
        setBeforeIdx(photoIndices[0]);
        const latestIdx = photoIndices[photoIndices.length - 1];
        setAfterIdx(latestIdx);
        setScannedIdx(latestIdx);
      }
    }
  }, [data]);

  const updateComparePct = (clientX) => {
    const el = compareContainerRef.current;
    if (!el) return;
    const { left, width } = el.getBoundingClientRect();
    const percent = Math.min(96, Math.max(4, ((clientX - left) / width) * 100));
    setComparePct(percent);
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingCompare(true);
    updateComparePct(e.clientX);
  };

  const handleTouchStart = (e) => {
    setIsDraggingCompare(true);
    updateComparePct(e.touches[0].clientX);
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDraggingCompare) updateComparePct(e.clientX);
    };
    const onMouseUp = () => {
      setIsDraggingCompare(false);
    };
    const onTouchMove = (e) => {
      if (isDraggingCompare) {
        updateComparePct(e.touches[0].clientX);
      }
    };
    const onTouchEnd = () => {
      setIsDraggingCompare(false);
    };

    if (isDraggingCompare) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove, { passive: true });
      window.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDraggingCompare]);

  const triggerAiScan = () => {
    const record = data[scannedIdx];
    if (!record || !record.photoUrl) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanComplete(false);

    const steps = [
      { progress: 15, text: '🧠 [SYS] Initializing biomechanical mesh nodes...' },
      { progress: 35, text: '🦴 [SKELETON] Mapping structural coordinates & postural alignment...' },
      { progress: 60, text: '📐 [CONTOURS] Tracking delta-lat sweeps & shoulder-to-waist ratios...' },
      { progress: 85, text: '📊 [OVERLOAD] Parsing active accessory and training volume sets...' },
      { progress: 100, text: '✅ [DONE] Scan telemetry ready.' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setScanStep(steps[currentStep].text);
        setScanProgress(steps[currentStep].progress);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsScanning(false);
        setScanComplete(true);
      }
    }, 450);
  };

  const hasPhotos = data && data.some(r => r.photoUrl);

  if (loading) {
    return (
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-12 text-center text-xs text-slate-400 font-mono">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-sky-400" />
          <span>Syncing Physique Telemetry...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-12 text-center text-xs text-rose-400 font-mono">
        {error}
      </div>
    );
  }

  if (!hasPhotos) {
    return (
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-12 text-center text-xs text-slate-500 font-mono flex flex-col items-center gap-3">
        <Camera className="h-8 w-8 text-slate-600" />
        <div>No physique progress photos recorded yet.</div>
        <p className="text-[10px] text-slate-600 max-w-xs leading-relaxed">
          Add a progress photo when you log a session in the workout logger.
        </p>
      </div>
    );
  }

  if (access === 'checking') {
    return (
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-12 text-center text-xs text-slate-400 font-mono">
        <RefreshCw className="h-8 w-8 animate-spin text-sky-400 mx-auto" />
      </div>
    );
  }
  if (access === 'locked') return <PhotoUnlock onUnlock={unlock} />;

  // Calculate telemetry comparison metrics for the selected before/after indices
  const beforeRecord = data[beforeIdx];
  const afterRecord = data[afterIdx];

  const beforeMuscleVols = beforeRecord ? {
    chest: getMuscleVolume(beforeRecord, 'chest'),
    back: getMuscleVolume(beforeRecord, 'back'),
    shoulders: getMuscleVolume(beforeRecord, 'shoulders'),
    arms: getMuscleVolume(beforeRecord, 'arms'),
    legs: getMuscleVolume(beforeRecord, 'legs'),
    core: getMuscleVolume(beforeRecord, 'core')
  } : {};

  const afterMuscleVols = afterRecord ? {
    chest: getMuscleVolume(afterRecord, 'chest'),
    back: getMuscleVolume(afterRecord, 'back'),
    shoulders: getMuscleVolume(afterRecord, 'shoulders'),
    arms: getMuscleVolume(afterRecord, 'arms'),
    legs: getMuscleVolume(afterRecord, 'legs'),
    core: getMuscleVolume(afterRecord, 'core')
  } : {};

  const selectedScannedRecord = data[scannedIdx];
  const baselineRecord = data[0];

  const scannedMuscleVols = selectedScannedRecord ? {
    chest: getMuscleVolume(selectedScannedRecord, 'chest'),
    back: getMuscleVolume(selectedScannedRecord, 'back'),
    shoulders: getMuscleVolume(selectedScannedRecord, 'shoulders'),
    arms: getMuscleVolume(selectedScannedRecord, 'arms'),
    legs: getMuscleVolume(selectedScannedRecord, 'legs'),
    core: getMuscleVolume(selectedScannedRecord, 'core')
  } : {};

  const baselineMuscleVols = baselineRecord ? {
    chest: getMuscleVolume(baselineRecord, 'chest'),
    back: getMuscleVolume(baselineRecord, 'back'),
    shoulders: getMuscleVolume(baselineRecord, 'shoulders'),
    arms: getMuscleVolume(baselineRecord, 'arms'),
    legs: getMuscleVolume(baselineRecord, 'legs'),
    core: getMuscleVolume(baselineRecord, 'core')
  } : {};

  const getDynamicMuscleAdvice = (muscleId, record) => {
    if (!record) return "";
    const date = record.date;
    const volume = getMuscleVolume(record, MUSCLES[muscleId].category);
    
    if (volume === 0) {
      return `Rest/Recovery state active. No direct mechanical load was logged for ${MUSCLES[muscleId].name} on this day (${date}). Hypertrophy in this region is in stasis. Advice: In your next active session of this split, schedule at least 3 high-intensity direct target sets to trigger protein synthesis.`;
    }
    
    if (muscleId === 'lats') {
      return `Hypertrophy active: Your back width was loaded with ${volume.toLocaleString()} kg·rep of mechanical tension on ${date}. Direct lat engagement is confirmed. Directive: In your next pull split, target assisted pull-ups with a strict 4-second eccentric (lowering) phase. Keep elbows flared slightly outward and pull with back force, not biceps, to expand lat width.`;
    }
    if (muscleId === 'delts') {
      return `Hypertrophy active: Your lateral delts received ${volume.toLocaleString()} kg·rep of mechanical workload on ${date}. Direct side-delt caps are developing. Directive: Control lateral raises; avoid swinging weight. Focus on raising dumbbells to your sides (plane of the scapula, about 30 degrees forward) rather than straight out to isolate the medial head.`;
    }
    if (muscleId === 'chest') {
      return `Hypertrophy active: Pressing mass hit ${volume.toLocaleString()} kg·rep on ${date}. Horizontal chest fibers are stimulated. Directive: In your next push split, focus on incline dumbbell press. Ensure a deep stretch at the bottom of the movement before driving up to build chest thickness.`;
    }
    if (muscleId === 'arms') {
      return `Hypertrophy active: Biceps/Triceps arm volume logged at ${volume.toLocaleString()} kg·rep on ${date}. Arm density is active. Directive: During curls, lock your elbows at your ribcage. For triceps, concentrate on the full lockouts at terminal extension to fire the medial and lateral heads.`;
    }
    if (muscleId === 'core') {
      return `Hypertrophy active: Core stabilization hit ${volume.toLocaleString()} kg·rep on ${date}. Abdominal wall is stimulated. Directive: During lying leg raises, press your lower back flat into the ground. Control the lowering phase without letting your feet touch the floor.`;
    }
    if (muscleId === 'legs') {
      return `Hypertrophy active: Quads and hamstrings loaded with ${volume.toLocaleString()} kg·rep of volume on ${date}. CNS stimulation is high. Directive: Push deep in leg press to engage quads fully. Keep tension on hamstrings during Romanian deadlifts by hinge-focusing hips.`;
    }
    
    return MUSCLES[muscleId].guide;
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div 
          onClick={() => setLightboxUrl('')}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center">
            <button 
              onClick={() => setLightboxUrl('')}
              className="absolute -top-10 right-0 text-slate-400 hover:text-white p-2 cursor-pointer z-[110]"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={lightboxUrl} 
              alt="Zoomed Progress" 
              className="max-w-full max-h-[80vh] rounded-xl object-contain border border-slate-850 shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Switcher Tab Header */}
      <div className="flex items-center gap-3 border-b border-slate-900 pb-2">
        <button
          onClick={() => setTrackerTab('scanner')}
          className={`pb-2 px-1 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            trackerTab === 'scanner' 
              ? 'text-sky-400 border-b-2 border-sky-400 font-bold' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Scan className="h-4 w-4" />
          <span>Muscle Mesh Scanner & Coach</span>
        </button>
        <button
          onClick={() => setTrackerTab('visual')}
          className={`pb-2 px-1 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            trackerTab === 'visual' 
              ? 'text-sky-400 border-b-2 border-sky-400 font-bold' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <MoveHorizontal className="h-4 w-4" />
          <span>Before & After Compare Slider</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE MUSCLE SCANNER */}
      {trackerTab === 'scanner' && selectedScannedRecord && (
        <section className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
                <Scan className="h-5 w-5 text-emerald-400" />
                NEUROMUSCULAR MATRIX OVERLAY & PHYSIQUE SCANNER
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-normal">
                Click any pulsing diagnostic point on the image to inspect muscle-specific volume loads and aesthetic coaching tips.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-850">
                <label className="text-[9px] font-bold font-mono text-slate-405 uppercase tracking-wider shrink-0">
                  Active Scan Photo:
                </label>
                <select
                  value={scannedIdx}
                  onChange={(e) => {
                    setScannedIdx(Number(e.target.value));
                    setScanComplete(false);
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-slate-200 outline-none focus:border-sky-500/50 cursor-pointer font-mono"
                >
                  {data.map((r, i) => r.photoUrl ? (
                    <option key={i} value={i}>{`[${r.date}] — ${r.routine.split(' — ')[0]}`}</option>
                  ) : null)}
                </select>
              </div>

              <button
                onClick={triggerAiScan}
                disabled={isScanning}
                className="bg-slate-900 hover:bg-slate-850 text-emerald-400 hover:text-emerald-300 border border-slate-800 hover:border-slate-700 py-2 px-4 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'SCANNING MESH...' : 'RE-RUN POSTURAL SCAN'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Interactive Image Panel */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-850 aspect-[4/5] bg-slate-950 shadow-2xl">
                <img 
                  loading="lazy"
                  src={getDirectDriveUrl(selectedScannedRecord.photoUrl)} 
                  alt={`Physique Target ${selectedScannedRecord.date}`}
                  className="w-full h-full object-cover object-center"
                />

                {/* Laser scan line anim */}
                {isScanning && (
                  <>
                    <div className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] z-20 animate-scan-laser pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.04)_1px,transparent_1px)] bg-[size:15px_15px] z-10 pointer-events-none" />
                  </>
                )}

                {/* Interactive Points Grid */}
                {!isScanning && (
                  <div className="absolute inset-0 z-20">
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                      {/* Interactive vector lines connecting to active target node */}
                      {selectedMuscle && MUSCLE_HOTPOINTS.filter(hp => hp.id === selectedMuscle).map((hp, idx) => (
                        <g key={idx}>
                          <line 
                            x1={hp.left} 
                            y1={hp.top} 
                            x2="50%" 
                            y2="92%" 
                            stroke="#38bdf8" 
                            strokeWidth="1.5" 
                            strokeDasharray="4 4" 
                          />
                        </g>
                      ))}
                    </svg>

                    {MUSCLE_HOTPOINTS.map((hp, idx) => {
                      const isActive = selectedMuscle === hp.id;
                      return (
                        <button
                          key={idx}
                          onClick={() => setSelectedMuscle(hp.id)}
                          style={{ top: hp.top, left: hp.left }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 p-2 group cursor-pointer"
                          title={`Select ${MUSCLES[hp.id].name}`}
                        >
                          <span className="relative flex h-5 w-5 items-center justify-center">
                            {/* Inner core dot */}
                            <span className={`h-2.5 w-2.5 rounded-full border border-white transition-all duration-300 ${
                              isActive 
                                ? 'bg-sky-400 scale-125 shadow-[0_0_12px_#38bdf8]' 
                                : 'bg-emerald-400 group-hover:bg-sky-400'
                            }`} />
                            {/* Outer pulsing ping */}
                            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                              isActive ? 'bg-sky-400/50' : 'bg-emerald-400/40'
                            }`} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Overlay details */}
                <div className="absolute bottom-4 left-4 bg-slate-950/80 border border-slate-800 text-[10px] font-mono tracking-widest text-emerald-400 py-1 px-2.5 rounded-lg backdrop-blur-sm z-30">
                  [MESH MATRIX ACTIVE: {selectedScannedRecord.date}]
                </div>
              </div>
              <button
                onClick={() => setLightboxUrl(getDirectDriveUrl(selectedScannedRecord.photoUrl))}
                className="w-full bg-slate-900/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 py-2.5 rounded-xl text-[10px] font-mono font-bold tracking-wider text-slate-400 hover:text-slate-200 transition-colors uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>EXPAND PHYSIQUE VIEW</span>
              </button>
            </div>

            {/* Right: Muscle details diagnostic pane */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Muscle Details Card */}
              {selectedMuscle && MUSCLES[selectedMuscle] && (
                <div className="bg-gradient-to-r from-slate-900/80 to-slate-950 border border-slate-850 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col gap-4">
                  <div className="absolute top-0 right-0 h-40 w-40 bg-sky-400/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  {/* Title & category */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="bg-sky-950 border border-sky-850 text-sky-400 px-3 py-1 rounded-full text-[9px] font-bold font-mono tracking-widest uppercase">
                      Anatomical Diagnostic Node
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                      Split Category: {MUSCLES[selectedMuscle].category.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-sky-400" />
                      {MUSCLES[selectedMuscle].name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {MUSCLES[selectedMuscle].desc}
                    </p>
                  </div>

                  {/* Dynamic volume calculations for scanned record */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 border-y border-slate-850/60 py-4">
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Scanned Day Training Volume</span>
                      <span className="text-lg font-black text-sky-400 mt-1 block">
                        {getMuscleVolume(selectedScannedRecord, MUSCLES[selectedMuscle].category).toLocaleString()} kg·rep
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {selectedScannedRecord.routine.split(' — ')[0]} log data
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest block">Anatomical Muscle Targets</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {selectedScannedRecord.accessories && selectedScannedRecord.accessories
                          .filter(a => a.category === MUSCLES[selectedMuscle].category)
                          .map((a, idx) => (
                            <span key={idx} className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-900/40 px-2 py-0.5 rounded">
                              {a.name}: {a.raw}
                            </span>
                          ))}
                        {MUSCLES[selectedMuscle].category === 'back' && selectedScannedRecord.pullUpVolume > 0 && (
                          <span className="text-[9px] font-mono font-bold text-sky-400 bg-sky-950/40 border border-sky-900/40 px-2 py-0.5 rounded">Assisted Pull-ups</span>
                        )}
                        {MUSCLES[selectedMuscle].category === 'chest' && selectedScannedRecord.benchVolume > 0 && (
                          <span className="text-[9px] font-mono font-bold text-purple-400 bg-purple-950/40 border border-purple-900/40 px-2 py-0.5 rounded">Dumbbell Bench Press</span>
                        )}
                        {MUSCLES[selectedMuscle].category === 'shoulders' && selectedScannedRecord.lateralVolume > 0 && (
                          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/40 px-2 py-0.5 rounded">Lateral Raises</span>
                        )}
                        {MUSCLES[selectedMuscle].category === 'legs' && selectedScannedRecord.squatVolume > 0 && (
                          <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950/40 border border-rose-900/40 px-2 py-0.5 rounded">Weighted Squats</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Aesthetic Guide */}
                  <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col gap-2.5">
                    <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                      AI Aesthetic Coach Guide
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                      {getDynamicMuscleAdvice(selectedMuscle, selectedScannedRecord)}
                    </p>
                    <div className="border-t border-slate-900/80 pt-2 text-[10px] text-slate-500 italic flex items-center gap-1">
                      <Info className="h-3 w-3 text-sky-400 shrink-0" />
                      <span>{MUSCLES[selectedMuscle].tip}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Muscle Overload Progression (Baseline vs Scanned Comparison) */}
              <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    Baseline vs Scanned Strength Progression Matrix
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Comparing training load volumes between Baseline (<span className="text-sky-400 font-bold">{data[0]?.date}</span>) and Scanned Day (<span className="text-emerald-400 font-bold">{selectedScannedRecord?.date}</span>):
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.keys(scannedMuscleVols).map(key => {
                    const beforeVal = baselineMuscleVols[key] || 0;
                    const afterVal = scannedMuscleVols[key] || 0;
                    const pct = beforeVal > 0 ? (((afterVal - beforeVal) / beforeVal) * 100).toFixed(1) : '0';
                    const isPositive = afterVal > beforeVal;
                    const hasChanged = beforeVal !== afterVal;

                    return (
                      <div key={key} className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl flex flex-col justify-between hover:border-slate-800 transition-colors">
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase truncate">
                          {key === 'chest' ? 'Pectorals' : key === 'back' ? 'Lats/Back' : key === 'shoulders' ? 'Shoulders' : key}
                        </span>
                        <div className="mt-2 flex flex-col">
                          <span className="text-[10px] text-slate-400">Baseline: {beforeVal.toLocaleString()}</span>
                          <span className="text-xs font-black text-slate-200 mt-0.5">Scanned: {afterVal.toLocaleString()}</span>
                        </div>
                        {hasChanged ? (
                          <span className={`text-[10px] font-mono font-bold mt-2 inline-flex items-center gap-1 ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}{pct}%
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-600 mt-2">No delta</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: BEFORE/AFTER COMPARE SLIDER */}
      {trackerTab === 'visual' && (
        <section className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
              <MoveHorizontal className="h-5 w-5 text-sky-400 font-bold" />
              VISUAL PHYSIQUE COMPARE SLIDER
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-normal">
              Select two dates to drag the visual slider and track changes in vascularity, muscle definition, and posture.
            </p>
          </div>

          {/* Selector selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 font-mono">Select Before Photo</label>
              <select 
                value={beforeIdx}
                onChange={(e) => setBeforeIdx(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 outline-none focus:border-sky-500/50 cursor-pointer"
              >
                {data.map((r, i) => r.photoUrl ? (
                  <option key={i} value={i}>{`${r.date} — ${r.routine.split(' — ')[0]}`}</option>
                ) : null)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 font-mono">Select After Photo</label>
              <select 
                value={afterIdx}
                onChange={(e) => setAfterIdx(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 outline-none focus:border-sky-500/50 cursor-pointer"
              >
                {data.map((r, i) => r.photoUrl ? (
                  <option key={i} value={i}>{`${r.date} — ${r.routine.split(' — ')[0]}`}</option>
                ) : null)}
              </select>
            </div>
          </div>

          {/* Slider Container */}
          {beforeRecord && afterRecord && (
            <div className="flex flex-col gap-4">
              <div 
                ref={compareContainerRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className="relative w-full rounded-2xl overflow-hidden select-none aspect-[4/5] sm:aspect-[4/3] border border-slate-850 cursor-ew-resize"
              >
                {/* BEFORE IMAGE (Bottom/Left) */}
                <div className="absolute inset-0">
                  <img 
                    loading="lazy"
                    src={getDirectDriveUrl(beforeRecord.photoUrl)} 
                    alt="Before" 
                    className="w-full h-full object-cover object-center pointer-events-none" 
                  />
                  <span className="absolute top-4 left-4 bg-slate-950/80 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-200 py-1 px-2.5 rounded-lg backdrop-blur-sm">
                    Before: {beforeRecord.date}
                  </span>
                </div>

                {/* AFTER IMAGE (Top/Right, Clipped) */}
                <div 
                  className="absolute inset-0" 
                  style={{ clipPath: `inset(0 0 0 ${comparePct}%)` }}
                >
                  <img 
                    loading="lazy"
                    src={getDirectDriveUrl(afterRecord.photoUrl)} 
                    alt="After" 
                    className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" 
                  />
                  <span className="absolute top-4 right-4 bg-slate-950/80 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-emerald-400 py-1 px-2.5 rounded-lg backdrop-blur-sm">
                    After: {afterRecord.date}
                  </span>
                </div>

                {/* Handle bar */}
                <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-white z-10"
                  style={{ left: `${comparePct}%`, transform: 'translateX(-50%)' }}
                />
                
                {/* Drag Handle button */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 shadow-2xl flex items-center justify-center pointer-events-none z-20"
                  style={{ left: `${comparePct}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <MoveHorizontal className="h-4 w-4 text-slate-900" />
                </div>
              </div>

              {/* Data table below slider */}
              <div className="bg-slate-950/30 border border-slate-900 p-4 rounded-xl text-xs text-slate-400 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sky-400 uppercase font-mono text-[9px] bg-sky-950/50 border border-sky-900/40 px-1.5 py-0.5 rounded">Compare Metrics</span>
                  <span>Biometric variations:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-1 border-t border-slate-900 pt-2.5">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold font-mono tracking-widest block">Before Weight</span>
                    <span className="text-xs font-bold text-slate-200">{beforeRecord.preWeight || '0'} kg</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold font-mono tracking-widest block">After Weight</span>
                    <span className="text-xs font-bold text-emerald-400">{afterRecord.preWeight || '0'} kg</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold font-mono tracking-widest block">Delta Weight</span>
                    <span className="text-xs font-bold text-slate-200">
                      {(afterRecord.preWeight - beforeRecord.preWeight).toFixed(1)} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold font-mono tracking-widest block">Volume Overload Diff</span>
                    <span className="text-xs font-bold text-slate-200">
                      {(((afterRecord.pullUpVolume + afterRecord.benchVolume + afterRecord.squatVolume + afterRecord.lateralVolume) - 
                        (beforeRecord.pullUpVolume + beforeRecord.benchVolume + beforeRecord.squatVolume + beforeRecord.lateralVolume))).toLocaleString()} kg·rep
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 3. PHOTO GALLERY TIMELINE (FOOTER GRID) */}
      <section className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
            <Camera className="h-5 w-5 text-sky-400" />
            DAILY PHYSIQUE PHOTOGRAPHY TIMELINE
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any thumbnail to inspect details. Pulse points will draw over the photo above.
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
          {data.map((r, i) => {
            if (!r.photoUrl) return null;
            const isScanned = i === scannedIdx;
            
            return (
              <div 
                key={i}
                onClick={() => {
                  setScannedIdx(i);
                  setScanComplete(false);
                }}
                className={`flex-shrink-0 w-36 rounded-xl overflow-hidden border bg-slate-950 p-2 cursor-pointer transition-all duration-300 flex flex-col gap-2 ${
                  isScanned 
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-950/20 scale-95' 
                    : 'border-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-slate-900">
                  <img 
                    loading="lazy"
                    src={getDirectDriveUrl(r.photoUrl)} 
                    alt={r.date} 
                    className="w-full h-full object-cover object-center pointer-events-none"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxUrl(getDirectDriveUrl(r.photoUrl));
                    }}
                    className="absolute bottom-1.5 right-1.5 bg-slate-950/80 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 z-10 transition-colors cursor-pointer"
                    title="Zoom"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-col gap-0.5 px-0.5">
                  <span className="text-[10px] font-bold text-slate-300 block font-sans">{r.date}</span>
                  <span className="text-[9px] text-slate-500 block truncate font-sans">{r.routine.split(' — ')[0]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
