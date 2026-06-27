import React, { useState, useEffect, useRef } from 'react';
import { 
  MoveHorizontal, 
  Camera, 
  Scan, 
  Maximize2, 
  X, 
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';

const getDirectDriveUrl = (driveUrl) => {
  if (!driveUrl) return '';
  const match = driveUrl.match(/(?:id=|\/d\/|open\?id=)([^&]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return driveUrl;
};

export default function PhysiqueTracker({ data, loading, error }) {
  const [beforeIdx, setBeforeIdx] = useState(0);
  const [afterIdx, setAfterIdx] = useState(0);
  const [comparePct, setComparePct] = useState(50);
  const [isDraggingCompare, setIsDraggingCompare] = useState(false);
  const compareContainerRef = useRef(null);
  
  const [scannedIdx, setScannedIdx] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanReport, setScanReport] = useState(null);
  const [aiTab, setAiTab] = useState('report'); // 'report' or 'coach'
  const [lightboxUrl, setLightboxUrl] = useState('');

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

  const triggerAiScan = (idx) => {
    const record = data[idx];
    if (!record || !record.photoUrl) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanReport(null);

    const steps = [
      { progress: 10, text: '🔍 [BOOT] Launching computer vision analysis tensors...' },
      { progress: 30, text: '🦴 [ALIGNMENT] Isolating joints, posture vectors, and skeletal map...' },
      { progress: 60, text: '📐 [CONTOUR] Outlining chest-shoulder contours & shoulder-to-waist ratio...' },
      { progress: 85, text: '📊 [INTEGRATION] Correlating biometric fluid shift and workout volume logs...' },
      { progress: 100, text: '🧠 [SYNTHESIS] Finalizing coaching report & aesthetic diagnostics...' }
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

        const sweatLoss = record.preWeight && record.postWeight
          ? (record.preWeight - record.postWeight).toFixed(1)
          : 0;

        const isUpperBody = record.routine.toLowerCase().includes('upper');
        const isLowerBody = record.routine.toLowerCase().includes('lower');
        const pullUpVol = record.pullUpVolume || 0;
        const lateralVol = record.lateralVolume || 0;

        let vTaperScore = 70;
        if (pullUpVol > 0) vTaperScore += Math.min(20, Math.floor(pullUpVol / 20));
        if (lateralVol > 0) vTaperScore += Math.min(10, Math.floor(lateralVol / 10));

        let definitionRating = 'Balanced (Aesthetic Baseline)';
        if (sweatLoss > 1.0) definitionRating = 'High Definition (Vascular/Lean)';
        else if (sweatLoss > 0.6) definitionRating = 'Moderately Defined (Calibrated)';

        const fluidStatus = sweatLoss > 1.0 ? 'Critical Depletion' : sweatLoss > 0.5 ? 'Mild Depletion' : 'Optimal';

        const coachDirectives = [];
        if (sweatLoss > 1.0) {
          coachDirectives.push(`💧 Critical: You lost ${sweatLoss} kg of water weight. Rehydrate immediately with 1.25L of mineralized water or electrolytes.`);
        } else {
          coachDirectives.push(`💧 Hydration: Pacing is clean. Drink 750ml water to maintain cell volume.`);
        }

        if (isUpperBody) {
          coachDirectives.push(`🍗 Protein Target: Consume 35-40g high-availability protein (e.g. egg whites/whey) within 90 minutes to repair micro-tears.`);
          coachDirectives.push(`🏋️ Lat overload: Next Upper day, aim to increase pull-up volume by 5% to expand V-taper lat width.`);
        } else if (isLowerBody) {
          coachDirectives.push(`🥑 Energy Baseline: Restore glycogen stores with 60g complex carbs + 30g protein.`);
          coachDirectives.push(`🦵 Leg recovery: Foam roll hamstrings and quads. Ensure 48 hours recovery before next heavy squat session.`);
        } else {
          coachDirectives.push(`💤 Rest Directive: Prioritize 8 hours sleep tonight to allow full CNS down-regulation and nervous system restoration.`);
        }

        setScanReport({
          vTaperScore,
          definitionRating,
          sweatLoss,
          fluidStatus,
          muscleHypertrophy: isUpperBody ? 'Upper Lats & Delts Primary Stimulus' : isLowerBody ? 'Posterior Chain & CNS Load' : 'Recovery & Cell Partitioning Active',
          coachDirectives
        });
      }
    }, 600);
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
          Please submit a workout log via the Google Form that includes a Google Drive link in the progress photo field.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      
      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div 
          onClick={() => setLightboxUrl('')}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] flex items-center justify-center">
            <button 
              onClick={() => setLightboxUrl('')}
              className="absolute -top-10 right-0 text-slate-400 hover:text-white p-2 cursor-pointer z-[60]"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={lightboxUrl} 
              alt="Zoomed Progress" 
              className="max-w-full max-h-[80vh] rounded-xl object-contain border border-slate-850"
            />
          </div>
        </div>
      )}

      {/* 1. COMPARE SYSTEM (Before/After Slider) */}
      <section className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
            <MoveHorizontal className="h-5 w-5 text-sky-400 font-bold" />
            VISUAL PHYSIQUE ADJUSTMENT METRIC (BEFORE & AFTER COMPARE)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-normal">
            Choose any two dates below to slide between progress photos and visually trace body shape changes.
          </p>
        </div>

        {/* Photo Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 font-mono">Select Before Photo</label>
            <select 
              value={beforeIdx}
              onChange={(e) => setBeforeIdx(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 outline-none focus:border-sky-500/50"
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
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 outline-none focus:border-sky-500/50"
            >
              {data.map((r, i) => r.photoUrl ? (
                <option key={i} value={i}>{`${r.date} — ${r.routine.split(' — ')[0]}`}</option>
              ) : null)}
            </select>
          </div>
        </div>

        {/* Slider Container */}
        {data[beforeIdx] && data[afterIdx] && (
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
                  src={getDirectDriveUrl(data[beforeIdx].photoUrl)} 
                  alt="Before" 
                  className="w-full h-full object-cover object-center pointer-events-none" 
                />
                <span className="absolute top-4 left-4 bg-slate-950/80 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-200 py-1 px-2.5 rounded-lg backdrop-blur-sm">
                  Before: {data[beforeIdx].date}
                </span>
              </div>

              {/* AFTER IMAGE (Top/Right, Clipped) */}
              <div 
                className="absolute inset-0" 
                style={{ clipPath: `inset(0 0 0 ${comparePct}%)` }}
              >
                <img 
                  src={getDirectDriveUrl(data[afterIdx].photoUrl)} 
                  alt="After" 
                  className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none" 
                />
                <span className="absolute top-4 right-4 bg-slate-950/80 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-emerald-400 py-1 px-2.5 rounded-lg backdrop-blur-sm">
                  After: {data[afterIdx].date}
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

            {/* Info bar beneath compare slider */}
            <div className="bg-slate-950/30 border border-slate-900 p-4 rounded-xl text-xs text-slate-400 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sky-400 uppercase font-mono text-[9px] bg-sky-950/50 border border-sky-900/40 px-1.5 py-0.5 rounded">Adjustment Metrics</span>
                <span>Compare weights and overload levels between dates:</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-1 border-t border-slate-900 pt-2.5">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold font-mono tracking-widest block">Before Weight</span>
                  <span className="text-sm font-extrabold text-slate-200">{data[beforeIdx].preWeight || '0'} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold font-mono tracking-widest block">After Weight</span>
                  <span className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5">
                    {data[afterIdx].preWeight || '0'} kg 
                    <span className="text-xs text-slate-400 font-normal">
                      ({(data[afterIdx].preWeight - data[beforeIdx].preWeight).toFixed(1)} kg change)
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 2. AI PHYSIQUE SCANNER & COACH */}
      <section className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
            <Scan className="h-5 w-5 text-emerald-400" />
            AI PHYSIQUE & BIOMETRIC SCANNERS (COMPUTER VISION ENGINE)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a log day photo below to activate the computer vision model and synthesize a physical diagnostic.
          </p>
        </div>

        {data[scannedIdx] && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Scan Target */}
            <div className="flex flex-col gap-3">
              <div className="relative rounded-xl overflow-hidden border border-slate-850 aspect-[4/5] sm:aspect-square md:aspect-[4/5] bg-slate-950">
                <img 
                  src={getDirectDriveUrl(data[scannedIdx].photoUrl)} 
                  alt="Scan Target" 
                  className="w-full h-full object-cover object-center"
                />

                {/* Scanning Laser Overlay */}
                {isScanning && (
                  <>
                    <div className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] z-20 animate-scan-laser pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:20px_20px] z-10 pointer-events-none" />
                  </>
                )}

                {/* Completed AI Overlay Indicators */}
                {!isScanning && scanReport && (
                  <div className="absolute inset-0 z-10 pointer-events-none animate-fade-in">
                    <div className="absolute top-[28%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping absolute"></span>
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 border border-white"></span>
                    </div>
                    <div className="absolute top-[28%] right-[25%] translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping absolute"></span>
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 border border-white"></span>
                    </div>
                    <svg className="absolute inset-0 w-full h-full opacity-60">
                      <line x1="25%" y1="28%" x2="35%" y2="52%" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="75%" y1="28%" x2="65%" y2="52%" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="35%" y1="52%" x2="65%" y2="52%" stroke="#38bdf8" strokeWidth="1.5" />
                    </svg>
                    <div className="absolute top-[52%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <span className="h-2 w-2 rounded-full bg-sky-400 border border-white"></span>
                    </div>
                    <span className="absolute bottom-4 left-4 bg-slate-950/80 border border-slate-800 text-[9px] font-mono tracking-widest text-emerald-400 py-0.5 px-2 rounded backdrop-blur-sm">
                      [CV-MESH-CALIBRATED]
                    </span>
                  </div>
                )}

                {/* Date Overlay */}
                <div className="absolute top-4 left-4 bg-slate-950/80 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-200 py-1 px-2.5 rounded-lg backdrop-blur-sm z-30">
                  TARGET: {data[scannedIdx].date}
                </div>
              </div>

              {/* Scan trigger button */}
              <button
                onClick={() => triggerAiScan(scannedIdx)}
                disabled={isScanning}
                className="w-full bg-slate-900 hover:bg-slate-850 text-emerald-400 hover:text-emerald-300 border border-slate-800 hover:border-slate-700 py-3 px-4 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Scan className="h-4 w-4" />
                <span>{isScanning ? 'SCANNERS ACTIVE...' : 'ANALYZE PHYSIQUE PROGRESS PHOTO'}</span>
              </button>
            </div>

            {/* Right: Scan Results */}
            <div className="flex flex-col border border-slate-850 rounded-xl bg-slate-950/40 overflow-hidden min-h-[350px]">
              {isScanning ? (
                /* Scanning Logs console */
                <div className="flex-1 p-5 font-mono text-[11px] text-emerald-400 flex flex-col justify-end gap-3 leading-relaxed min-h-[300px]">
                  <div className="flex-1 flex flex-col justify-center items-center gap-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-emerald-400" />
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Computing Contours...</span>
                  </div>
                  <div className="border-t border-slate-900 pt-3 flex flex-col gap-1 text-slate-400">
                    <div>{scanStep}</div>
                    <div className="w-full bg-slate-900 h-1.5 mt-2">
                      <div className="bg-emerald-400 h-1.5 rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                    </div>
                  </div>
                </div>
              ) : scanReport ? (
                /* Report Resolved */
                <div className="flex flex-col h-full flex-1">
                  {/* Inner Tab bar */}
                  <div className="flex border-b border-slate-900 bg-slate-900/60 p-1">
                    <button
                      onClick={() => setAiTab('report')}
                      className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        aiTab === 'report' ? 'text-sky-400 border-b-2 border-sky-400 bg-sky-950/10' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Diagnostic Report
                    </button>
                    <button
                      onClick={() => setAiTab('coach')}
                      className={`flex-1 py-2 text-center text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        aiTab === 'coach' ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/10' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Coach Directives
                    </button>
                  </div>

                  {/* Tab Panels */}
                  <div className="p-5 flex-1 flex flex-col gap-4 text-xs">
                    {aiTab === 'report' ? (
                      <div className="flex flex-col gap-4 animate-fade-in">
                        <div>
                          <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Target Workout split</h4>
                          <p className="text-slate-200 font-extrabold">{data[scannedIdx].routine}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-3">
                          <div>
                            <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">V-Taper Index</h4>
                            <span className="text-lg font-black text-sky-400">{scanReport.vTaperScore}/100</span>
                          </div>
                          <div>
                            <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Physique Definition</h4>
                            <span className="text-slate-200 font-bold">{scanReport.definitionRating}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-3">
                          <div>
                            <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Hydration Index</h4>
                            <span className={`font-bold ${scanReport.sweatLoss > 1.0 ? 'text-amber-500' : 'text-emerald-400'}`}>
                              {scanReport.fluidStatus}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Sweat Loss</h4>
                            <span className="text-slate-200 font-bold">{scanReport.sweatLoss} kg</span>
                          </div>
                        </div>
                        <div className="border-t border-slate-900 pt-3">
                          <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">Primary Muscle Target</h4>
                          <p className="text-slate-300 font-semibold">{scanReport.muscleHypertrophy}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 animate-fade-in">
                        <h4 className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-1">AI Coach Suggestions</h4>
                        <div className="flex flex-col gap-2.5">
                          {scanReport.coachDirectives.map((d, i) => (
                            <div key={i} className="p-3 rounded-lg border border-emerald-950/40 bg-emerald-950/10 text-emerald-300 leading-relaxed font-sans font-medium">
                              {d}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Initial Screen */
                <div className="flex-1 flex flex-col justify-center items-center p-6 text-center text-slate-500 min-h-[300px]">
                  <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-850 mb-3 text-slate-400">
                    <Scan className="h-6 w-6" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1 font-sans">Telemetry Diagnostics Ready</h3>
                  <p className="text-[11px] max-w-[240px] leading-relaxed">
                    Click the analyze button to process this physique image with your logged workout volume and weight.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 3. GALLERY & TIMELINE */}
      <section className="bg-slate-900/40 border border-slate-850 rounded-2xl p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
            <Camera className="h-5 w-5 text-sky-400" />
            PHYSIQUE PHOTO GALLERY TIMELINE
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Scroll through your daily physique uploads. Click a thumbnail to load it into the AI Scanner.
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
                  setScanReport(null);
                }}
                className={`flex-shrink-0 w-36 rounded-xl overflow-hidden border bg-slate-950 p-2 cursor-pointer transition-all duration-300 flex flex-col gap-2 ${
                  isScanned 
                    ? 'border-emerald-500/50 shadow-md shadow-emerald-950/20 scale-95' 
                    : 'border-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-slate-900">
                  <img 
                    src={getDirectDriveUrl(r.photoUrl)} 
                    alt={r.date} 
                    className="w-full h-full object-cover object-center pointer-events-none"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxUrl(getDirectDriveUrl(r.photoUrl));
                    }}
                    className="absolute bottom-1.5 right-1.5 bg-slate-950/80 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 z-10 transition-colors"
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
