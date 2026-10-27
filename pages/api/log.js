import { findExercise, canonicalName, formatSets } from '../../lib/exercises';
import { configured, NOT_CONFIGURED, callScript, pinOk } from '../../lib/appsScript';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

// Receives a session from the /log app and forwards it to the Apps Script
// attached to the Google Sheet. Exercises that have their own sheet column go
// there; everything else goes into the notes as "Name - weight/r1/r2/...",
// the same format the dashboard already parses.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!configured()) return res.status(503).json({ error: NOT_CONFIGURED });

  const s = req.body || {};
  if (!pinOk(s.pin)) return res.status(401).json({ error: 'Wrong PIN' });
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
    const photo = s.photo?.data ? { data: s.photo.data, mimeType: s.photo.mimeType || 'image/jpeg' } : null;
    const out = await callScript({ date: s.date, values, ...(photo && { photo }) }, { photo: !!photo });
    return res.status(200).json({ ok: true, row: out.row });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
