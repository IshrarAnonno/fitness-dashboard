import { findExercise, canonicalName, formatSets } from '../../lib/exercises';

// Receives a session from the /log app and forwards it to the Apps Script
// attached to the Google Sheet. Exercises that have their own sheet column go
// there; everything else goes into the notes as "Name - weight/r1/r2/...",
// the same format the dashboard already parses.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { LOG_PIN, APPS_SCRIPT_URL, APPS_SCRIPT_SECRET } = process.env;
  if (!APPS_SCRIPT_URL || !APPS_SCRIPT_SECRET || !LOG_PIN) {
    return res.status(503).json({ error: 'Logging is not configured on the server yet (see apps-script/SETUP.md).' });
  }

  const s = req.body || {};
  if (String(s.pin || '') !== LOG_PIN) return res.status(401).json({ error: 'Wrong PIN' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date || '')) return res.status(400).json({ error: 'Missing date' });

  const values = {
    'day of the week': s.day || '',
    "today's workout split": s.split || '',
    'pre-workout weight': s.preWeight === '' || s.preWeight == null ? '' : Number(s.preWeight),
    'post-workout weight': s.postWeight === '' || s.postWeight == null ? '' : Number(s.postWeight),
    'sleep duration': s.sleep || '',
  };

  const noteParts = [];
  for (const e of Array.isArray(s.exercises) ? s.exercises : []) {
    const reps = (e.reps || []).map((r) => parseInt(r, 10)).filter((r) => r > 0);
    if (!e.name || !reps.length) continue;
    const ex = findExercise(e.name);
    const raw = formatSets({ weight: e.weight, reps });
    // A column only holds one entry per day; a repeat of the same exercise goes to notes
    if (ex?.column && !values[ex.column]) values[ex.column] = raw;
    else noteParts.push(`${canonicalName(e.name)} - ${raw}`);
  }

  const cardio = [s.cardioDistance && `${s.cardioDistance}km`, s.cardioCalories && `${s.cardioCalories} cal`].filter(Boolean).join('/');
  if (cardio) values['cardio finisher'] = cardio;

  const comment = String(s.notes || '').trim();
  if (noteParts.length || comment) values['session notes'] = [noteParts.join(', '), comment].filter(Boolean).join(', ');

  try {
    const r = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: APPS_SCRIPT_SECRET, date: s.date, values }),
      redirect: 'follow',
    });
    const text = await r.text();
    let out;
    try { out = JSON.parse(text); } catch { throw new Error('Apps Script did not return JSON — check the deployment access is "Anyone".'); }
    if (!out.ok) throw new Error(out.error || 'Apps Script rejected the entry');
    return res.status(200).json({ ok: true, row: out.row });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
