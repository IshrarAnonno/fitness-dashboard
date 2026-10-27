import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Plus, Minus, X, Search, Check, ChevronDown, ChevronUp, Dumbbell, LayoutDashboard,
  Settings, Trash2, History, CloudOff, Loader2, RotateCcw, Copy, ClipboardPaste, AlertTriangle, Camera,
} from 'lucide-react';
import {
  EXERCISES, CATEGORIES, SPLITS, SLEEP_OPTIONS,
  findExercise, canonicalName, categoryOf, parseSets, formatSets,
} from '../lib/exercises';
import { parseLog } from '../lib/importText';

const CAT_COLOR = {
  legs: '#10b981', back: '#38bdf8', chest: '#a855f7', arms: '#f59e0b',
  shoulders: '#f43f5e', core: '#fb923c', cardio: '#e879f9', other: '#64748b',
};
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const KEY = { draft: 'ft.draft', pin: 'ft.pin', queue: 'ft.queue', custom: 'ft.custom' };
const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dayOf = (iso) => { const [y, m, d] = iso.split('-').map(Number); return DAYS[new Date(y, m - 1, d).getDay()]; };
// Sheet dates come back as DD/MM/YYYY
const sheetToISO = (s) => { const m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };
const daysAgo = (iso) => {
  if (!iso) return '';
  const n = Math.round((new Date(todayISO()) - new Date(iso)) / 86400000);
  return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n}d ago`;
};
const fmtKg = (n) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(2)));
const uid = () => Math.random().toString(36).slice(2, 10);

const emptySession = () => ({
  date: todayISO(), split: '', preWeight: '', postWeight: '', sleep: '',
  exercises: [], cardioDistance: '', cardioCalories: '', notes: '', photo: null,
});

// Shrinks a picked photo to a JPEG of at most 1600px so it fits in one request
const readPhoto = (file) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    resolve({ mimeType: 'image/jpeg', data: canvas.toDataURL('image/jpeg', 0.85).split(',')[1] });
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that photo')); };
  img.src = url;
});
const unlockPhotos = (pin) =>
  fetch('/api/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) }).catch(() => {});

// ── History digest: last performance + frequency per exercise ────────────────
function useHistory() {
  const [records, setRecords] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/workout', { cache: 'no-store' });
      const data = await r.json();
      if (Array.isArray(data)) setRecords(data);
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const digest = useMemo(() => {
    const last = {}, count = {}, bySplit = {}, dates = new Set();
    const sorted = records
      .map((r) => ({ ...r, iso: sheetToISO(r.date) }))
      .filter((r) => r.iso)
      .sort((a, b) => a.iso.localeCompare(b.iso));
    for (const r of sorted) {
      dates.add(r.iso);
      for (const e of r.allExercises || []) {
        if (e.isCardio) continue;
        const name = canonicalName(e.name);
        const sets = parseSets(e.raw);
        if (!sets) continue;
        last[name] = { ...sets, raw: e.raw, date: r.iso };
        count[name] = (count[name] || 0) + 1;
        if (r.routine) {
          bySplit[r.routine] = bySplit[r.routine] || {};
          bySplit[r.routine][name] = (bySplit[r.routine][name] || 0) + 1;
        }
      }
    }
    const recent = sorted.slice(-6).reverse();
    return { last, count, bySplit, dates, recent };
  }, [records]);

  return { ...digest, loaded, reload: load };
}

// ── Bottom sheet shell ───────────────────────────────────────────────────────
function Sheet({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/70 animate-fade-in" onClick={onClose} />
      <div className="relative bg-[#0b0e17] border-t border-white/10 rounded-t-3xl max-h-[92dvh] flex flex-col animate-scale-up"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h3 className="text-base font-bold text-white truncate pr-4">{title}</h3>
          <button onClick={onClose} className="h-9 w-9 shrink-0 rounded-full bg-white/5 flex items-center justify-center text-slate-400" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Exercise picker ──────────────────────────────────────────────────────────
function ExercisePicker({ open, onClose, onPick, history, split, taken, customs }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('suggested');
  const inputRef = useRef(null);

  useEffect(() => { if (open) { setQ(''); setCat(split && history.bySplit[split] ? 'suggested' : 'all'); } }, [open, split, history.bySplit]);

  const all = useMemo(() => {
    const names = new Map();
    for (const ex of EXERCISES) names.set(ex.name, ex);
    for (const n of [...Object.keys(history.count), ...customs]) {
      if (!names.has(n)) names.set(n, { name: n, category: categoryOf(n), custom: true });
    }
    return [...names.values()];
  }, [history.count, customs]);

  const list = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    let items = all;
    if (tokens.length) {
      items = items.filter((ex) => {
        const hay = [ex.name, ...(ex.aliases || [])].join(' ').toLowerCase();
        return tokens.every((t) => hay.includes(t));
      });
    } else if (cat === 'suggested') {
      const freq = history.bySplit[split] || {};
      items = items.filter((ex) => freq[ex.name]).sort((a, b) => freq[b.name] - freq[a.name]);
      return items;
    } else if (cat !== 'all') {
      items = items.filter((ex) => ex.category === cat);
    }
    return [...items].sort((a, b) => (history.count[b.name] || 0) - (history.count[a.name] || 0) || a.name.localeCompare(b.name));
  }, [all, q, cat, history, split]);

  const exact = q.trim() && all.some((ex) => ex.name.toLowerCase() === canonicalName(q).toLowerCase());
  const tabs = [...(split && history.bySplit[split] ? ['suggested'] : []), 'all', ...CATEGORIES];

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      <div className="px-5 pb-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4">
          <Search className="h-5 w-5 text-slate-500 shrink-0" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search exercises"
            className="flex-1 bg-transparent py-3.5 text-base text-white placeholder:text-slate-500 outline-none" autoCapitalize="words" autoCorrect="off" />
          {q && <button onClick={() => setQ('')} className="text-slate-500" aria-label="Clear"><X className="h-4 w-4" /></button>}
        </div>
        {!q && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 -mx-5 px-5">
            {tabs.map((t) => (
              <button key={t} onClick={() => setCat(t)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-semibold capitalize border ${cat === t ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-300 border-white/10'}`}>
                {t === 'suggested' ? `For ${split.replace(/ Day$/, '')}` : t}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="overflow-y-auto px-3 pb-6 flex-1 min-h-[40dvh]">
        {list.map((ex) => {
          const last = history.last[ex.name];
          const added = taken.has(ex.name);
          return (
            <button key={ex.name} onClick={() => onPick(ex.name)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl active:bg-white/5 text-left">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: CAT_COLOR[ex.category] || CAT_COLOR.other }} />
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold text-slate-100 truncate">{ex.name}</span>
                <span className="block text-xs text-slate-500 mt-0.5">
                  {last ? <>Last {last.raw} · {daysAgo(last.date)}</> : <span className="capitalize">{ex.category}{ex.equipment === 'db' ? ' · dumbbells' : ''}</span>}
                </span>
              </span>
              {added && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
            </button>
          );
        })}
        {q.trim() && !exact && (
          <button onClick={() => onPick(canonicalName(q))}
            className="w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mt-2 text-left">
            <Plus className="h-5 w-5 text-emerald-400" />
            <span className="text-emerald-300 font-semibold">Add “{canonicalName(q)}” as new exercise</span>
          </button>
        )}
        {!list.length && !q && <p className="text-center text-slate-500 text-sm py-10">Nothing here yet.</p>}
      </div>
    </Sheet>
  );
}

// ── Number stepper ───────────────────────────────────────────────────────────
function Stepper({ value, onChange, step = 1, min = 0, label, suffix, big }) {
  const n = parseFloat(value);
  const bump = (d) => onChange(fmtKg(Math.max(min, (isNaN(n) ? 0 : n) + d)));
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => bump(-step)} className={`${big ? 'h-12 w-12' : 'h-10 w-10'} rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 active:bg-white/10`} aria-label={`Decrease ${label}`}>
        <Minus className="h-4 w-4" />
      </button>
      <div className={`flex-1 flex items-baseline justify-center gap-1 bg-white/5 border border-white/10 rounded-xl ${big ? 'h-12' : 'h-10'}`}>
        <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" aria-label={label}
          className={`w-full min-w-0 bg-transparent text-center font-bold text-white outline-none self-center ${big ? 'text-xl' : 'text-base'}`} />
        {suffix && <span className="text-xs text-slate-500 pr-3 self-center">{suffix}</span>}
      </div>
      <button type="button" onClick={() => bump(step)} className={`${big ? 'h-12 w-12' : 'h-10 w-10'} rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-200 active:bg-white/10`} aria-label={`Increase ${label}`}>
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Set editor ───────────────────────────────────────────────────────────────
function SetEditor({ entry, onSave, onDelete, onClose, history }) {
  const meta = findExercise(entry?.name) || {};
  const isDb = meta.equipment === 'db';
  const isTime = meta.unit === 'sec';
  const last = entry ? history.last[entry.name] : null;

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState([]);
  const [quick, setQuick] = useState('');

  useEffect(() => {
    if (!entry) return;
    setWeight(entry.weight === '' || entry.weight == null ? '' : String(entry.weight));
    setReps(entry.reps.map(String));
    setQuick('');
  }, [entry]);

  if (!entry) return null;

  const w = parseFloat(weight) || 0;
  const cleanReps = reps.map((r) => parseInt(r, 10)).filter((r) => r > 0);
  const preview = cleanReps.length ? formatSets({ weight: w, reps: cleanReps }) : '';

  const applyQuick = (txt) => {
    setQuick(txt);
    const p = parseSets(txt);
    if (p) { setWeight(fmtKg(p.weight)); setReps(p.reps.map(String)); }
  };
  const setRep = (i, v) => setReps((rs) => rs.map((r, j) => (j === i ? v : r)));
  const save = () => onSave({ ...entry, weight: w, reps: cleanReps });

  return (
    <Sheet open onClose={onClose} title={entry.name}>
      <div className="overflow-y-auto px-5 pb-4 flex flex-col gap-5">
        {last && (
          <div className="flex items-center justify-between gap-3 bg-white/3 border border-white/8 rounded-2xl px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Last time · {daysAgo(last.date)}</p>
              <p className="text-white font-bold font-mono mt-0.5">{last.raw}</p>
            </div>
            <button onClick={() => { setWeight(fmtKg(last.weight)); setReps(last.reps.map(String)); }}
              className="shrink-0 flex items-center gap-1.5 text-sm font-semibold text-sky-300 bg-sky-500/10 border border-sky-500/30 rounded-xl px-3 py-2">
              <Copy className="h-4 w-4" /> Repeat
            </button>
          </div>
        )}

        {!isTime && (
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
              {isDb ? 'Weight — both dumbbells combined' : meta.name === 'Assisted Pull-ups' ? 'Assist weight' : 'Weight'}
            </p>
            <Stepper big value={weight} onChange={setWeight} step={isDb ? 5 : 2.5} label="weight" suffix="kg" />
            {isDb && (
              <div className="flex items-center justify-between mt-2 text-sm">
                <span className="text-slate-500">Per hand</span>
                <div className="flex items-center gap-2">
                  <input value={w ? fmtKg(w / 2) : ''} inputMode="decimal" aria-label="Per hand weight"
                    onChange={(e) => { const v = parseFloat(e.target.value.replace(/[^\d.]/g, '')); setWeight(isNaN(v) ? '' : fmtKg(v * 2)); }}
                    className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-center text-base text-white outline-none" />
                  <span className="text-slate-500">kg × 2</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">{isTime ? 'Holds (seconds)' : 'Sets × reps'}</p>
          <div className="flex flex-col gap-2">
            {reps.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-12 text-sm text-slate-500 font-semibold shrink-0">Set {i + 1}</span>
                <div className="flex-1"><Stepper value={r} onChange={(v) => setRep(i, v)} label={`set ${i + 1}`} suffix={isTime ? 'sec' : 'reps'} step={isTime ? 5 : 1} /></div>
                <button onClick={() => setReps((rs) => rs.filter((_, j) => j !== i))} className="h-10 w-8 flex items-center justify-center text-slate-600" aria-label={`Remove set ${i + 1}`}>
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => setReps((rs) => [...rs, rs.length ? rs[rs.length - 1] : isTime ? '30' : '12'])}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/15 text-slate-300 font-semibold text-sm active:bg-white/5">
            <Plus className="h-4 w-4" /> Add set
          </button>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Or type it your way</p>
          <input value={quick} onChange={(e) => applyQuick(e.target.value)} placeholder={last?.raw || '30/16/16/16'} inputMode="decimal"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base font-mono text-white placeholder:text-slate-600 outline-none" />
        </div>
      </div>

      <div className="px-5 pt-3 pb-4 border-t border-white/5 flex items-center gap-3">
        {onDelete && (
          <button onClick={onDelete} className="h-12 w-12 shrink-0 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400" aria-label="Remove exercise">
            <Trash2 className="h-5 w-5" />
          </button>
        )}
        <button onClick={save} disabled={!cleanReps.length}
          className="flex-1 h-12 rounded-2xl bg-emerald-400 text-black font-bold disabled:opacity-30 flex items-center justify-center gap-2">
          <Check className="h-5 w-5" /> {preview ? <span className="font-mono">{preview}</span> : 'Add a set first'}
        </button>
      </div>
    </Sheet>
  );
}

// ── PIN prompt ───────────────────────────────────────────────────────────────
function PinSheet({ open, onClose, onSave, error }) {
  const [pin, setPin] = useState('');
  useEffect(() => { if (open) setPin(''); }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title="Enter your logging PIN">
      <div className="px-5 pb-6 flex flex-col gap-3">
        <p className="text-sm text-slate-400">This is the <span className="font-mono text-slate-200">LOG_PIN</span> you set in Vercel. It is remembered on this phone.</p>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" autoFocus
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-lg text-white tracking-widest text-center outline-none" />
        <button onClick={() => pin && onSave(pin)} disabled={!pin} className="h-12 rounded-2xl bg-emerald-400 text-black font-bold disabled:opacity-30">Save PIN</button>
      </div>
    </Sheet>
  );
}

// ── Paste & import (catch up on sessions written down elsewhere) ─────────────
const IMPORT_EXAMPLE = `21 Sep, 2026
76.3
Assisted pullup - 22.7 10-3
Pulling cable rows - 31.8 15-4
Pullup - 22.7 10-10-8
74.7`;

function ImportSheet({ open, onClose, history, post, getPin, askPin, onSaved }) {
  const [text, setText] = useState('');
  const [sessions, setSessions] = useState(null);
  const [state, setState] = useState({});        // date → 'saving' | 'ok' | error text
  const [busy, setBusy] = useState(false);

  const preview = () => {
    const parsed = parseLog(text).map((s) => ({ ...s, skip: history.dates.has(s.date) }));
    setSessions(parsed);
    setState({});
  };
  const patch = (i, p) => setSessions((list) => list.map((s, j) => (j === i ? { ...s, ...p } : s)));

  const todo = (sessions || []).filter((s) => !s.skip && state[s.date] !== 'ok');
  const saveAll = async () => {
    const pin = getPin();
    if (!pin) { askPin(); return; }
    setBusy(true);
    let saved = 0;
    for (const s of todo) {
      setState((st) => ({ ...st, [s.date]: 'saving' }));
      try {
        const { status, body } = await post({ ...s, day: dayOf(s.date), pin });
        if (status === 401) { setState((st) => ({ ...st, [s.date]: 'PIN not accepted' })); askPin(true); break; }
        setState((st) => ({ ...st, [s.date]: status === 200 ? 'ok' : body.error || `Error ${status}` }));
        if (status === 200) saved++; else break;
      } catch {
        setState((st) => ({ ...st, [s.date]: 'No connection' }));
        break;
      }
    }
    setBusy(false);
    if (saved) onSaved(saved);
  };

  return (
    <Sheet open={open} onClose={busy ? () => {} : onClose} title="Paste & import">
      <div className="overflow-y-auto px-5 pb-6 flex flex-col gap-3">
        {!sessions ? (
          <>
            <p className="text-sm text-slate-400">
              Paste sessions you wrote down: a date line, your weight before, one line per exercise
              (<span className="font-mono text-slate-300">Name - weight reps-sets</span>), your weight after.
            </p>
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} placeholder={IMPORT_EXAMPLE}
              className="w-full bg-white/4 border border-white/8 rounded-2xl px-4 py-3 text-sm font-mono text-white outline-none placeholder:text-slate-600" />
            <button onClick={preview} disabled={!text.trim()} className="h-12 rounded-2xl bg-white text-black font-bold disabled:opacity-30">Preview</button>
          </>
        ) : (
          <>
            {sessions.length === 0 && <p className="text-sm text-rose-300">No sessions found. Each one needs to start with a date line like "21 Sep, 2026".</p>}
            {sessions.map((s, i) => {
              const st = state[s.date];
              const logged = history.dates.has(s.date);
              return (
                <div key={s.date + i} className={`rounded-2xl border px-4 py-3 ${s.skip ? 'border-white/5 opacity-50' : 'border-white/10 bg-white/3'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white">{dayOf(s.date).slice(0, 3)} {s.date}</span>
                    <span className="text-xs text-slate-400 font-mono">{s.preWeight || '—'} → {s.postWeight || '—'} kg</span>
                  </div>
                  <select value={s.split} onChange={(e) => patch(i, { split: e.target.value })} disabled={busy}
                    className="mt-2 w-full bg-white/5 border border-white/10 rounded-xl px-3 h-10 text-sm text-white [color-scheme:dark]">
                    {SPLITS.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                  <ul className="mt-2 text-xs text-slate-400 font-mono space-y-0.5">
                    {s.exercises.map((e, k) => <li key={k}><span className="text-slate-200 font-sans">{e.name}</span> {formatSets(e)}</li>)}
                  </ul>
                  {s.warnings.map((w, k) => <p key={k} className="mt-1.5 text-xs text-amber-400 flex gap-1.5"><AlertTriangle className="h-3.5 w-3.5 shrink-0" />{w}</p>)}
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <label className="flex items-center gap-2 text-slate-400">
                      <input type="checkbox" checked={!s.skip} disabled={busy || st === 'ok'} onChange={(e) => patch(i, { skip: !e.target.checked })} />
                      {logged ? 'Already in sheet — import anyway' : 'Import'}
                    </label>
                    {st === 'saving' && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                    {st === 'ok' && <span className="text-emerald-400 flex items-center gap-1"><Check className="h-4 w-4" /> Saved</span>}
                    {st && st !== 'ok' && st !== 'saving' && <span className="text-rose-400">{st}</span>}
                  </div>
                </div>
              );
            })}
            <div className="sticky bottom-0 pt-2 flex gap-2" style={{ background: '#0b0e17' }}>
              <button onClick={() => setSessions(null)} disabled={busy} className="h-12 px-4 rounded-2xl bg-white/5 text-slate-300 font-semibold">Edit text</button>
              <button onClick={saveAll} disabled={busy || !todo.length}
                className="flex-1 h-12 rounded-2xl font-black text-black bg-gradient-to-r from-emerald-400 to-sky-400 disabled:opacity-30 flex items-center justify-center gap-2">
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                {todo.length ? `Save ${todo.length} session${todo.length > 1 ? 's' : ''}` : 'All saved'}
              </button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function LogPage() {
  const history = useHistory();
  const [session, setSession] = useState(emptySession);
  const [ready, setReady] = useState(false);
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState(null);   // entry being edited
  const [isNew, setIsNew] = useState(false);
  const [showBody, setShowBody] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinError, setPinError] = useState('');
  const [submitAfterPin, setSubmitAfterPin] = useState(false);
  const [queue, setQueue] = useState([]);
  const [customs, setCustoms] = useState([]);
  const [status, setStatus] = useState(null);      // { kind: 'ok'|'err'|'queued', text }
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Restore draft / queue from this phone
  useEffect(() => {
    const draft = store.get(KEY.draft, null);
    if (draft && (draft.exercises?.length || draft.date === todayISO())) setSession({ ...emptySession(), ...draft });
    setQueue(store.get(KEY.queue, []));
    setCustoms(store.get(KEY.custom, []));
    setReady(true);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  useEffect(() => { if (ready) store.set(KEY.draft, session); }, [session, ready]);

  const update = (patch) => setSession((s) => ({ ...s, ...patch }));
  const taken = useMemo(() => new Set(session.exercises.map((e) => e.name)), [session.exercises]);
  const isRest = /rest/i.test(session.split);

  const post = async (payload) => {
    const r = await fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const body = await r.json().catch(() => ({}));
    return { status: r.status, body };
  };

  const reloadHistory = history.reload;
  const flushQueue = useCallback(async () => {
    const pending = store.get(KEY.queue, []);
    if (!pending.length || !navigator.onLine) return;
    const remaining = [];
    for (const item of pending) {
      try {
        const { status } = await post({ ...item, pin: store.get(KEY.pin, '') });
        if (status !== 200) remaining.push(item);
      } catch { remaining.push(item); }
    }
    store.set(KEY.queue, remaining);
    setQueue(remaining);
    if (remaining.length < pending.length) { setStatus({ kind: 'ok', text: `Synced ${pending.length - remaining.length} saved session(s)` }); reloadHistory(); }
  }, [reloadHistory]);

  useEffect(() => {
    if (!ready) return;
    flushQueue();
    window.addEventListener('online', flushQueue);
    return () => window.removeEventListener('online', flushQueue);
  }, [ready, flushQueue]);

  const pick = (name) => {
    setPicker(false);
    if (!findExercise(name) && !history.count[name] && !customs.includes(name)) {
      const next = [...customs, name];
      setCustoms(next);
      store.set(KEY.custom, next);
    }
    const existing = session.exercises.find((e) => e.name === name);
    if (existing) { setIsNew(false); setEditing(existing); return; }
    const last = history.last[name];
    const meta = findExercise(name);
    setIsNew(true);
    setEditing({
      id: uid(), name,
      weight: last ? last.weight : '',
      reps: last ? last.reps : meta?.unit === 'sec' ? [30, 30] : [12, 12, 12],
    });
  };

  const saveEntry = (entry) => {
    setSession((s) => {
      const has = s.exercises.some((e) => e.id === entry.id);
      return { ...s, exercises: has ? s.exercises.map((e) => (e.id === entry.id ? entry : e)) : [...s.exercises, entry] };
    });
    setEditing(null);
  };
  const deleteEntry = (id) => { setSession((s) => ({ ...s, exercises: s.exercises.filter((e) => e.id !== id) })); setEditing(null); };

  const submit = async (pinOverride) => {
    const pin = pinOverride || store.get(KEY.pin, '');
    if (!pin) { setPinError(''); setSubmitAfterPin(true); setPinOpen(true); return; }
    const payload = { ...session, day: dayOf(session.date), exercises: isRest ? [] : session.exercises };
    setBusy(true); setStatus(null);
    try {
      const { status, body } = await post({ ...payload, pin });
      if (status === 401) { store.del(KEY.pin); setPinError('That PIN was not accepted.'); setSubmitAfterPin(true); setPinOpen(true); return; }
      if (status !== 200) { setStatus({ kind: 'err', text: body.error || `Server error (${status})` }); return; }
      setStatus({ kind: 'ok', text: `Saved to your sheet — ${dayOf(session.date)}, ${session.exercises.length} exercise(s)${session.photo ? ' + photo' : ''}` });
      unlockPhotos(pin);
      setSession(emptySession());
      history.reload();
    } catch {
      // Offline at the gym: keep it on the phone and send when back online
      const next = [...store.get(KEY.queue, []), { ...payload, photo: null }];
      store.set(KEY.queue, next); setQueue(next);
      setStatus({ kind: 'queued', text: `No connection — saved on this phone, will sync automatically.${payload.photo ? ' The photo could not be kept offline; add it again later.' : ''}` });
      setSession(emptySession());
    } finally { setBusy(false); }
  };

  const volume = session.exercises.reduce((s, e) => s + (Number(e.weight) || 0) * e.reps.reduce((a, b) => a + b, 0), 0);
  const alreadyLogged = history.dates.has(session.date);
  const canSubmit = session.split && (isRest || session.exercises.length || session.notes.trim()) && !busy;

  return (
    <div className="min-h-dvh text-slate-100" style={{ background: '#05060b' }}>
      <Head>
        <title>Log Workout · Ishrar Fitness</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#05060b" />
      </Head>

      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-white/5" style={{ background: 'rgba(5,6,11,0.85)', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500/25 to-sky-500/10 border border-white/10 flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="font-black tracking-wide text-[15px]">Log Workout</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setImportOpen(true)} className="h-9 w-9 rounded-full flex items-center justify-center text-slate-400" aria-label="Paste & import"><ClipboardPaste className="h-5 w-5" /></button>
            <Link href="/dashboard" className="h-9 w-9 rounded-full flex items-center justify-center text-slate-400" aria-label="Dashboard"><LayoutDashboard className="h-5 w-5" /></Link>
            <button onClick={() => { setPinError(''); setSubmitAfterPin(false); setPinOpen(true); }} className="h-9 w-9 rounded-full flex items-center justify-center text-slate-400" aria-label="PIN settings"><Settings className="h-5 w-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pt-4 pb-40 flex flex-col gap-5">
        {status && (
          <div className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-start gap-2 ${status.kind === 'ok' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : status.kind === 'queued' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'}`}>
            <span className="flex-1">{status.text}</span>
            <button onClick={() => setStatus(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
          </div>
        )}
        {queue.length > 0 && (
          <button onClick={flushQueue} className="rounded-2xl px-4 py-3 text-sm bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-2">
            <CloudOff className="h-4 w-4" /> {queue.length} session(s) waiting to sync — tap to retry
          </button>
        )}

        {/* Date */}
        <section className="flex items-center gap-3">
          <label className="flex-1 flex items-center justify-between bg-white/4 border border-white/8 rounded-2xl px-4 h-14">
            <span>
              <span className="block text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{dayOf(session.date)}</span>
              <span className="block text-white font-bold">{session.date === todayISO() ? 'Today' : session.date}</span>
            </span>
            <input type="date" value={session.date} max={todayISO()} onChange={(e) => e.target.value && update({ date: e.target.value })}
              className="bg-transparent text-slate-300 text-base outline-none [color-scheme:dark]" />
          </label>
        </section>
        {alreadyLogged && <p className="-mt-3 text-xs text-amber-400/90 px-1">You already have an entry for this date in the sheet. Saving adds another row.</p>}

        {/* Split */}
        <section>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 px-1">Today's split</p>
          <div className="flex flex-wrap gap-2">
            {SPLITS.map((s) => (
              <button key={s} onClick={() => update({ split: session.split === s ? '' : s })}
                className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold border ${session.split === s ? 'bg-white text-black border-white' : 'bg-white/4 text-slate-300 border-white/8'}`}>
                {s.replace(' / Active Recovery Day', ' / Recovery')}
              </button>
            ))}
          </div>
        </section>

        {/* Exercises */}
        {!isRest && (
          <section>
            <div className="flex items-baseline justify-between mb-2 px-1">
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Exercises {session.exercises.length > 0 && `· ${session.exercises.length}`}</p>
              {volume > 0 && <p className="text-xs text-slate-500 font-mono">{volume.toLocaleString()} kg·reps</p>}
            </div>
            <div className="flex flex-col gap-2">
              {session.exercises.map((e) => {
                const last = history.last[e.name];
                const cat = categoryOf(e.name);
                return (
                  <button key={e.id} onClick={() => { setIsNew(false); setEditing(e); }}
                    className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-2xl px-4 py-3.5 text-left active:bg-white/8">
                    <span className="w-1 self-stretch rounded-full" style={{ background: CAT_COLOR[cat] }} />
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-white truncate">{e.name}</span>
                      <span className="block font-mono text-sm text-slate-300 mt-0.5">
                        {formatSets(e)}
                        {last && last.date !== session.date && <span className="text-slate-600"> · last {last.raw}</span>}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPicker(true)}
              className="mt-2 w-full h-14 rounded-2xl bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 font-bold flex items-center justify-center gap-2 active:bg-emerald-400/20">
              <Plus className="h-5 w-5" /> Add exercise
            </button>
          </section>
        )}

        {/* Cardio */}
        {!isRest && (
          <section>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 px-1">Cardio finisher</p>
            <div className="grid grid-cols-2 gap-2">
              {[['cardioDistance', 'km'], ['cardioCalories', 'cal']].map(([k, unit]) => (
                <label key={k} className="flex items-center bg-white/4 border border-white/8 rounded-2xl px-4 h-12">
                  <input value={session[k]} onChange={(e) => update({ [k]: e.target.value.replace(/[^\d.]/g, '') })} inputMode="decimal" placeholder="0"
                    className="flex-1 min-w-0 bg-transparent text-base text-white outline-none placeholder:text-slate-600" />
                  <span className="text-sm text-slate-500">{unit}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        {/* Body & sleep */}
        <section className="bg-white/3 border border-white/8 rounded-2xl">
          <button onClick={() => setShowBody((v) => !v)} className="w-full flex items-center justify-between px-4 h-12">
            <span className="text-sm font-semibold text-slate-300">
              Body weight & sleep
              {(session.preWeight || session.sleep) && <span className="text-slate-500 font-normal"> · {[session.preWeight && `${session.preWeight} kg`, session.sleep].filter(Boolean).join(' · ')}</span>}
            </span>
            {showBody ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
          </button>
          {showBody && (
            <div className="px-4 pb-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-2">
                {[['preWeight', 'Pre-workout'], ['postWeight', 'Post-workout']].map(([k, label]) => (
                  <label key={k} className="block">
                    <span className="block text-[11px] text-slate-500 mb-1">{label}</span>
                    <span className="flex items-center bg-white/5 border border-white/10 rounded-xl px-3 h-11">
                      <input value={session[k]} onChange={(e) => update({ [k]: e.target.value.replace(/[^\d.]/g, '') })} inputMode="decimal" placeholder="78.0"
                        className="flex-1 min-w-0 bg-transparent text-base text-white outline-none placeholder:text-slate-600" />
                      <span className="text-sm text-slate-500">kg</span>
                    </span>
                  </label>
                ))}
              </div>
              <div>
                <span className="block text-[11px] text-slate-500 mb-1.5">Sleep last night</span>
                <div className="flex flex-wrap gap-2">
                  {SLEEP_OPTIONS.map((o) => (
                    <button key={o} onClick={() => update({ sleep: session.sleep === o ? '' : o })}
                      className={`px-3 py-2 rounded-xl text-sm border ${session.sleep === o ? 'bg-white text-black border-white font-semibold' : 'bg-white/4 text-slate-300 border-white/8'}`}>
                      {o.replace(' hours', 'h').replace('Less than 5h', '< 5h')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Notes */}
        <section>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 px-1">Notes</p>
          <textarea value={session.notes} onChange={(e) => update({ notes: e.target.value })} rows={3} placeholder="How did it feel?"
            className="w-full bg-white/4 border border-white/8 rounded-2xl px-4 py-3 text-base text-white outline-none placeholder:text-slate-600 resize-none" />
        </section>

        {/* Progress photo */}
        <section>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 px-1">Progress photo</p>
          {session.photo ? (
            <div className="relative w-32">
              <img src={`data:${session.photo.mimeType};base64,${session.photo.data}`} alt="Progress photo" className="w-32 h-44 object-cover rounded-2xl border border-white/10" />
              <button onClick={() => update({ photo: null })} className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-black border border-white/20 flex items-center justify-center text-slate-300" aria-label="Remove photo"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <label className="h-14 rounded-2xl bg-white/4 border border-white/8 text-slate-300 font-semibold flex items-center justify-center gap-2 active:bg-white/8">
              <Camera className="h-5 w-5" /> Add photo
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                try { update({ photo: await readPhoto(file) }); } catch (err) { setStatus({ kind: 'err', text: err.message }); }
              }} />
            </label>
          )}
        </section>

        {(session.exercises.length > 0 || session.notes || session.photo) && (
          <button onClick={() => { if (confirm('Clear this draft?')) setSession(emptySession()); }}
            className="self-center flex items-center gap-1.5 text-sm text-slate-500 py-2">
            <RotateCcw className="h-4 w-4" /> Clear draft
          </button>
        )}

        {/* Recent */}
        {history.recent.length > 0 && (
          <section>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 px-1 flex items-center gap-1.5"><History className="h-3.5 w-3.5" /> Recent sessions</p>
            <div className="flex flex-col divide-y divide-white/5 bg-white/3 border border-white/8 rounded-2xl">
              {history.recent.map((r, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-200 truncate">{r.routine || '—'}</span>
                    <span className="text-xs text-slate-500 shrink-0">{daysAgo(r.iso)}</span>
                  </div>
                  {r.allExercises?.filter((e) => !e.isCardio).length > 0 && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.allExercises.filter((e) => !e.isCardio).map((e) => e.name).join(' · ')}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Save bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-white/5 backdrop-blur-xl" style={{ background: 'rgba(5,6,11,0.9)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <button onClick={() => submit()} disabled={!canSubmit}
            className="w-full h-14 rounded-2xl font-black text-black bg-gradient-to-r from-emerald-400 to-sky-400 disabled:opacity-30 flex items-center justify-center gap-2 text-[15px]">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            {!session.split ? 'Pick a split to save' : isRest ? 'Save rest day' : `Save session${session.exercises.length ? ` · ${session.exercises.length} exercises` : ''}`}
          </button>
        </div>
      </div>

      <ExercisePicker open={picker} onClose={() => setPicker(false)} onPick={pick} history={history}
        split={session.split} taken={taken} customs={customs} />
      {editing && (
        <SetEditor entry={editing} history={history} onClose={() => setEditing(null)} onSave={saveEntry}
          onDelete={isNew ? null : () => deleteEntry(editing.id)} />
      )}
      <ImportSheet open={importOpen} onClose={() => setImportOpen(false)} history={history} post={post}
        getPin={() => store.get(KEY.pin, '')}
        askPin={(wrong) => { if (wrong) store.del(KEY.pin); setPinError(wrong ? 'That PIN was not accepted.' : ''); setSubmitAfterPin(false); setPinOpen(true); }}
        onSaved={(n) => { setStatus({ kind: 'ok', text: `Imported ${n} session(s) into your sheet` }); history.reload(); }} />
      <PinSheet open={pinOpen} onClose={() => setPinOpen(false)} error={pinError}
        onSave={(pin) => { store.set(KEY.pin, pin); unlockPhotos(pin); setPinOpen(false); setPinError(''); if (submitAfterPin && canSubmit) submit(pin); }} />
    </div>
  );
}
