// ── Paste & import ───────────────────────────────────────────────────────────
// Turns a hand-written log into sessions the /api/log route accepts:
//
//   21 Sep, 2026            ← date starts a new session
//   76.3                    ← first bare number = pre-workout weight
//   Pulling cable rows - 36.3 15-4      weight, 15 reps × 4 sets
//   Assisted pullup - 22.7 10-10-8      weight, one number per set
//   Dumbbell bench press - 30/16/16/14  the sheet format also works
//   74.7                    ← last bare number = post-workout weight
//
// Optional lines: a split name ("Upper Body Power (A)", "push", "pull", "legs",
// "rest"), "Sleep 7h", "Cardio 1.5km 110 cal", "Note: …".

import { SPLITS, SLEEP_OPTIONS, canonicalName, categoryOf, findExercise } from './exercises.js';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (n) => String(n).padStart(2, '0');

const parseDate = (line, thisYear) => {
  const m = line.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\.?,?\s*(\d{2,4})?$/i)
    || line.match(/^([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{2,4})?$/i);
  const n = line.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
  let d, mo, y;
  if (m) {
    const [a, b] = /^\d/.test(m[1]) ? [m[1], m[2]] : [m[2], m[1]];
    mo = MONTHS.indexOf(b.slice(0, 3).toLowerCase()) + 1;
    if (!mo) return null;
    d = +a; y = m[3] ? +m[3] : thisYear;
  } else if (n) {
    d = +n[1]; mo = +n[2]; y = +n[3];
  } else return null;
  if (y < 100) y += 2000;
  const warn = y !== thisYear && y !== thisYear - 1 ? `Year ${y} read as ${thisYear}` : '';
  if (warn) y = thisYear;
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
  return { iso: `${y}-${pad(mo)}-${pad(d)}`, warn };
};

// "15-4" → 4 sets of 15 · "10-10-8" → 10, 10, 8 · "16/16/14" → 16, 16, 14
const parseSpec = (spec) => {
  const parts = spec.split(/\s*[-\/x×]\s*/).map((p) => parseInt(p, 10));
  if (!parts.length || parts.some((p) => isNaN(p) || p <= 0)) return null;
  if (parts.length === 1) return [parts[0]];
  if (parts.length === 2 && /-|x|×/i.test(spec) && !spec.includes('/')) return Array(parts[1]).fill(parts[0]);
  return parts;
};

const inferSplit = (exercises) => {
  const n = { legs: 0, back: 0, push: 0 };
  for (const e of exercises) {
    const c = categoryOf(e.name);
    if (c === 'legs') n.legs++;
    else if (c === 'back') n.back++;
    else if (c === 'chest' || /tricep|overhead/i.test(e.name)) n.push++;
  }
  if (!exercises.length) return SPLITS[4];
  if (n.legs >= 3 && n.legs >= n.back + n.push) return 'Lower Body Power (A)';
  if (n.back > n.push) return 'Upper Body Volume (B)';
  return 'Upper Body Power (A)';
};

const splitFromLine = (line) => {
  const l = line.toLowerCase().replace(/[:\-–]/g, ' ').trim();
  const exact = SPLITS.find((s) => s.toLowerCase() === l || s.toLowerCase().startsWith(l + ' '));
  if (exact) return exact;
  if (/^(split\s+)?(push|chest)( day)?$/.test(l)) return 'Upper Body Power (A)';
  if (/^(split\s+)?(pull|back)( day)?$/.test(l)) return 'Upper Body Volume (B)';
  if (/^(split\s+)?(legs?|lower)( day)?$/.test(l)) return 'Lower Body Power (A)';
  if (/^(rest|recovery)( day)?$/.test(l)) return SPLITS[4];
  return null;
};

const sleepFromLine = (line) => {
  const m = line.match(/^sleep\s*[:\-]?\s*(<\s*5|less than 5|[\d.]+\+?)\s*h?/i);
  if (!m) return null;
  const v = m[1].toLowerCase();
  if (v.includes('<') || v.includes('less')) return SLEEP_OPTIONS[0];
  const h = parseFloat(v);
  if (h < 5.25) return SLEEP_OPTIONS[0];
  if (h < 5.75) return '5.5 hours';
  if (h < 6.5) return '6 hours';
  if (h < 7.5) return '7 hours';
  if (h < 8.5) return '8 hours';
  return '9+ hours';
};

export function parseLog(text, thisYear = new Date().getFullYear()) {
  const sessions = [];
  let cur = null;
  const finish = () => {
    if (!cur) return;
    const w = cur.weights;
    cur.preWeight = w.length ? w[0] : '';
    cur.postWeight = w.length > 1 ? w[w.length - 1] : '';
    cur.splitGuessed = !cur.split;
    if (!cur.split) cur.split = inferSplit(cur.exercises);
    delete cur.weights;
    sessions.push(cur);
    cur = null;
  };

  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim().replace(/\s+/g, ' ');
    if (!line) continue;

    const date = parseDate(line, thisYear);
    if (date) {
      finish();
      cur = { date: date.iso, split: '', weights: [], exercises: [], sleep: '', cardioDistance: '', cardioCalories: '', notes: '', warnings: date.warn ? [date.warn] : [] };
      continue;
    }
    if (!cur) continue;

    if (/^(weight\s*)?[\d.]+\s*(kg)?$/i.test(line)) { cur.weights.push(parseFloat(line.replace(/[^\d.]/g, ''))); continue; }
    const split = splitFromLine(line);
    if (split) { cur.split = split; continue; }
    const sleep = sleepFromLine(line);
    if (sleep) { cur.sleep = sleep; continue; }
    const cardio = line.match(/^cardio\b(.*)$/i);
    if (cardio) {
      const km = cardio[1].match(/([\d.]+)\s*km/i);
      const cal = cardio[1].match(/([\d.]+)\s*(k?cal)/i);
      cur.cardioDistance = km ? km[1] : '';
      cur.cardioCalories = cal ? cal[1] : '';
      continue;
    }
    const note = line.match(/^notes?\s*[:\-]\s*(.+)$/i);
    if (note) { cur.notes = [cur.notes, note[1]].filter(Boolean).join(', '); continue; }

    // "Name - weight reps-sets" (the dash after the name is optional)
    const ex = line.match(/^(.+?)\s*[-–:]?\s+([\d.]+)\s*(?:kg)?\s*[\/ ]\s*(\d+(?:\s*[-\/x×]\s*\d+)*)$/i);
    const reps = ex && parseSpec(ex[3]);
    if (ex && reps) {
      const typed = ex[1].replace(/\s*[-–:]\s*$/, '').trim();
      const name = canonicalName(typed);
      cur.exercises.push({ name, typed, known: !!findExercise(typed), weight: parseFloat(ex[2]), reps });
      continue;
    }
    cur.warnings.push(`Couldn't read: "${line}"`);
  }
  finish();
  return sessions.sort((a, b) => a.date.localeCompare(b.date));
}
