// ── Exercise catalog ─────────────────────────────────────────────────────────
// Every exercise logged so far (form columns + the ones typed in the notes box),
// with the spelling variants used in the notes mapped onto one canonical name.
//
// equipment: 'db' = pair of dumbbells, weight is logged as the TOTAL of both hands
//            'machine' | 'cable' | 'bodyweight' = weight logged as-is
// unit:      'reps' (default) or 'sec' for timed holds
// column:    keyword of the Google Sheet column this exercise has its own field in

export const EXERCISES = [
  // Back
  { name: 'Assisted Pull-ups',            category: 'back',      equipment: 'machine',    column: 'assisted pull-ups' },
  { name: 'Seated Machine Rows',          category: 'back',      equipment: 'machine',    column: 'seated machine rows' },
  { name: 'Seated Pulldown',              category: 'back',      equipment: 'machine',    aliases: ['Seated Pulldowns', 'Pulldown', 'Lat Pulldown'] },
  { name: 'Pulling Cable Row',            category: 'back',      equipment: 'cable',      aliases: ['Pulling Rows', 'Pulling Cable Rows', 'Cable Row', 'Cable Rows'] },
  { name: 'Seated Rope Pull',             category: 'back',      equipment: 'cable',      aliases: ['Sitting Rope Pull', 'Pulling Ropes'] },
  { name: 'Hyperextension',               category: 'back',      equipment: 'bodyweight', aliases: ['Hyper Extension', 'Hyper-extension'] },
  // Chest
  { name: 'Dumbbell Bench Press',         category: 'chest',     equipment: 'db',         column: 'dumbbell bench press' },
  { name: 'Incline Dumbbell Bench Press', category: 'chest',     equipment: 'db',         aliases: ['Inclined Dumbbell Bench Press', 'Inclined Dumbbell Benchpress', 'Inclined Dumbbell Press', 'Incline Dumbbell Press', 'Inclined Bench Press', 'Incline Bench Press'] },
  { name: 'Dumbbell Chest Flyes',         category: 'chest',     equipment: 'db',         aliases: ['Chest Flyes', 'Dumbbell Chest Flies', 'Chest Flies', 'Chest Fly'] },
  { name: 'Assisted Push-ups',            category: 'chest',     equipment: 'bodyweight', column: 'assisted push-ups' },
  // Shoulders
  { name: 'Dumbbell Shoulder Press',      category: 'shoulders', equipment: 'db',         column: 'dumbbell shoulder press' },
  { name: 'Dumbbell Lateral Raises',      category: 'shoulders', equipment: 'db',         column: 'lateral raises', aliases: ['Lateral Raise', 'Lateral Raises'] },
  { name: 'Dumbbell Shrug',               category: 'shoulders', equipment: 'db',         aliases: ['Dumbbell Shoulder Shrug', 'Shrug', 'Shrugs'] },
  { name: 'Dumbbell Face Pulls',          category: 'shoulders', equipment: 'db',         aliases: ['Face Pulls', 'Face Pull'] },
  // Arms
  { name: 'Dumbbell Bicep Curls',         category: 'arms',      equipment: 'db',         column: 'bicep curls' },
  { name: 'Hammer Curl',                  category: 'arms',      equipment: 'db',         aliases: ['Dumbbell Hammer Curl', 'Dumbbell Bicep Hammer Curl', 'Hammer Curls'] },
  { name: 'Overhead DB Tricep Extension', category: 'arms',      equipment: 'db',         column: 'overhead db tricep', aliases: ['Overhead DB Tricep Ext'] },
  { name: 'Tricep Rope Pushdown',         category: 'arms',      equipment: 'cable',      aliases: ['Rope Pushdown'] },
  { name: 'Wrist Curls + Reverse Curls',  category: 'arms',      equipment: 'db',         column: 'wrist curls' },
  // Legs
  { name: 'Weighted Squats',              category: 'legs',      equipment: 'db',         column: 'weighted squats' },
  { name: 'Walking Lunges',               category: 'legs',      equipment: 'db',         column: 'walking lunges' },
  { name: 'Dumbbell Romanian Deadlifts',  category: 'legs',      equipment: 'db',         column: 'romanian deadlifts', aliases: ['RDL', 'RDLs', 'Romanian Deadlift'] },
  { name: 'Standing Calf Raises',         category: 'legs',      equipment: 'db',         column: 'calf raises' },
  { name: 'Leg Press',                    category: 'legs',      equipment: 'machine' },
  { name: 'Leg Extension',                category: 'legs',      equipment: 'machine',    aliases: ['Leg Extensions'] },
  { name: 'Leg Curl',                     category: 'legs',      equipment: 'machine',    aliases: ['Leg Curls'] },
  // Core
  { name: 'Belly Crunch',                 category: 'core',      equipment: 'bodyweight', aliases: ['Crunch', 'Crunches'] },
  { name: 'Lying Leg Raises',             category: 'core',      equipment: 'bodyweight', column: 'lying leg raises' },
  { name: 'Core Planks & Cobra Stretch',  category: 'core',      equipment: 'bodyweight', column: 'core planks', unit: 'sec' },
];

export const CATEGORIES = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'other'];

export const SPLITS = [
  'Upper Body Power (A)',
  'Upper Body Volume (B)',
  'Lower Body Power (A)',
  'Lower Body Density (B)',
  'Rest / Active Recovery Day',
];

export const SLEEP_OPTIONS = ['Less than 5 hours', '5.5 hours', '6 hours', '7 hours', '8 hours', '9+ hours'];

// "Inclined Dumbbell Bench-Press" → "inclined dumbbell bench press"
const keyOf = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/[^a-z0-9+& ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w))
    .join(' ');

const LOOKUP = new Map();
for (const ex of EXERCISES) {
  for (const n of [ex.name, ...(ex.aliases || [])]) LOOKUP.set(keyOf(n), ex);
}

export const findExercise = (name) => LOOKUP.get(keyOf(name)) || null;

// Canonical name for anything typed; unknown exercises are title-cased as typed.
export const canonicalName = (name) => {
  const ex = findExercise(name);
  if (ex) return ex.name;
  return String(name || '').trim().replace(/\s+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const guessCategory = (name) => {
  const n = name.toLowerCase();
  if (/leg|squat|lunge|deadlift|calf|glute|hamstring|quad/.test(n)) return 'legs';
  if (/curl|tricep|bicep|pushdown|wrist|forearm/.test(n)) return 'arms';
  if (/lateral|shoulder|shrug|delt|face pull|military|ohp/.test(n)) return 'shoulders';
  if (/bench|chest|fly|flye|cross|pec|push ?up|dip/.test(n)) return 'chest';
  if (/pull|row|lat |back|extension/.test(n)) return 'back';
  if (/crunch|plank|sit ?up|abs|core|raise/.test(n)) return 'core';
  if (/cardio|cycl|run|treadmill|bike|walk|football/.test(n)) return 'cardio';
  return 'other';
};

export const categoryOf = (name) => findExercise(name)?.category || guessCategory(name);

// "30/16/16/16" → { weight: 30, reps: [16, 16, 16] }
export const parseSets = (raw) => {
  const parts = String(raw || '').split(/[\/|]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const weight = parseFloat(parts[0]);
  const reps = parts.slice(1).map((p) => parseInt(p, 10)).filter((n) => !isNaN(n));
  if (isNaN(weight) || !reps.length) return null;
  return { weight, reps };
};

// { weight: 30, reps: [16, 16, 16] } → "30/16/16/16"
export const formatSets = ({ weight, reps }) => [Number(weight) || 0, ...reps].join('/');
