export default async function handler(req, res) {
  try {
    const sheetUrl =
      'https://docs.google.com/spreadsheets/d/1Crarq7CMIQMjzwA3fTsSDiCVTSP-5JbF3qWNlxpfuxY/gviz/tq?tqx=out:json';

    const response = await fetch(sheetUrl);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

    const text = await response.text();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    if (jsonStart === -1) throw new Error('Invalid sheet format');

    const data = JSON.parse(text.substring(jsonStart, jsonEnd));
    if (!data.table || !data.table.rows) return res.status(200).json([]);

    const cols = data.table.cols || [];
    const rows = data.table.rows;

    // ─── Dynamic column finder ────────────────────────────────────────────────
    const findCol = (keywords) =>
      cols.findIndex(
        (c) => c && c.label && keywords.some((k) => c.label.toLowerCase().includes(k.toLowerCase()))
      );

    const idx = {
      date:           findCol(['daily biometrics - date']),
      day:            findCol(['day of the week']),
      split:          findCol(["today's workout split"]),
      preWeight:      findCol(['pre-workout weight']),
      postWeight:     findCol(['post-workout weight']),
      sleep:          findCol(['sleep duration']),
      pullUps:        findCol(['assisted pull-ups', 'pull-ups']),
      rows:           findCol(['seated machine rows']),
      benchPress:     findCol(['dumbbell bench press']),
      pushUps:        findCol(['assisted push-ups']),
      shoulderPress:  findCol(['dumbbell shoulder press']),
      lateralRaises:  findCol(['lateral raises']),
      bicepCurls:     findCol(['bicep curls']),
      tricepExt:      findCol(['overhead db tricep', 'tricep extension']),
      wristCurls:     findCol(['wrist curls']),
      squats:         findCol(['weighted squats']),
      lunges:         findCol(['walking lunges']),
      rdls:           findCol(['romanian deadlifts', 'rdls']),
      calfRaises:     findCol(['calf raises']),
      legRaises:      findCol(['lying leg raises']),
      planks:         findCol(['core planks', 'planks & cobra']),
      cardio:         findCol(['cardio finisher']),
      notes:          findCol(['session notes', 'notes / rpe']),
      photo:          findCol(['physique progress photo']),
    };

    // ─── Parsers ──────────────────────────────────────────────────────────────
    const getStr = (cells, i) => {
      if (i < 0 || !cells[i]) return '';
      const v = cells[i].v;
      return v === null || v === undefined ? '' : String(v);
    };

    const getNum = (cells, i) => {
      if (i < 0 || !cells[i]) return 0;
      const n = parseFloat(cells[i].v);
      return isNaN(n) ? 0 : n;
    };

    const parseDate = (cells, i) => {
      if (i < 0 || !cells[i]) return '';
      const cell = cells[i];
      const src = cell.f || String(cell.v || '');
      const m = src.match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) {
        const y = parseInt(m[1]);
        const mo = parseInt(m[2]) + 1;
        const d = parseInt(m[3]);
        return `${String(d).padStart(2,'0')}/${String(mo).padStart(2,'0')}/${y}`;
      }
      try {
        const d = new Date(src);
        if (!isNaN(d.getTime())) {
          return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
        }
      } catch(e) {}
      return src;
    };

    const parseExerciseStr = (cells, i) => {
      const raw = getStr(cells, i);
      if (!raw || raw === 'N/A' || raw === '0') return { weight: 0, totalReps: 0, volume: 0, raw: '' };
      const parts = raw.split('/').map(p => p.trim());
      const weight = parseFloat(parts[0]) || 0;
      let totalReps = 0;
      for (let j = 1; j < parts.length; j++) {
        const r = parseInt(parts[j]);
        if (!isNaN(r)) totalReps += r;
      }
      return { weight, totalReps, volume: weight * totalReps, raw };
    };

    const parseVolume = (cells, i) => parseExerciseStr(cells, i).volume;

    // ─── Category classifier ──────────────────────────────────────────────────
    const getCategory = (name) => {
      const n = name.toLowerCase();
      if (n.includes('leg press') || n.includes('leg extension') || n.includes('leg curl') ||
          n.includes('squat') || n.includes('lunge') || n.includes('rdl') || n.includes('deadlift') ||
          n.includes('calf') || n.includes('hyper extension') || n.includes('hyperextension') ||
          n.includes('quad') || n.includes('hamstring') || n.includes('glute')) return 'legs';
      if (n.includes('bicep') || n.includes('tricep') || n.includes('curl') || n.includes('hammer') ||
          n.includes('pushdown') || n.includes('wrist') || n.includes('forearm')) return 'arms';
      if (n.includes('lateral') || n.includes('face pull') || n.includes('shoulder') || n.includes('shrug') ||
          n.includes('delt') || n.includes('ohp') || n.includes('military')) return 'shoulders';
      if (n.includes('bench') || n.includes('chest') || n.includes('fly') || n.includes('flye') ||
          n.includes('push-up') || n.includes('pushup') || n.includes('incline') ||
          (n.includes('press') && !n.includes('leg') && !n.includes('shoulder') && !n.includes('overhead')))
        return 'chest';
      if (n.includes('pull-up') || n.includes('pullup') || n.includes('pulldown') || n.includes('row') ||
          n.includes('lat ') || n.includes('back') || n.includes('cable row') || n.includes('seated pull'))
        return 'back';
      if (n.includes('belly') || n.includes('crunch') || n.includes('plank') || n.includes('sit-up') ||
          n.includes('abs') || n.includes('core') ||
          (n.includes('raise') && !n.includes('lateral') && !n.includes('calf'))) return 'core';
      if (n.includes('cardio') || n.includes('cycling') || n.includes('run') || n.includes('treadmill') ||
          n.includes('bike') || n.includes('walk') || n.includes('football')) return 'cardio';
      return 'other';
    };

    // ─── Parse accessories from comment box ───────────────────────────────────
    const parseAccessories = (notes) => {
      const accessories = [];
      if (!notes) return accessories;
      const seen = new Set();
      // Match "Exercise Name - weight/r1/r2/r3" patterns
      const exerciseRegex = /([A-Za-z][A-Za-z0-9\s&()'\-+]*?)\s*[-:]\s*([\d.]+(?:\s*[\/|]\s*[\d.]+)+)/g;
      let match;
      while ((match = exerciseRegex.exec(notes)) !== null) {
        let name = match[1].trim().replace(/^[,.\s]+|[,.\s]+$/g, '').trim();
        if (!name || name.length < 3 || /^\d+$/.test(name)) continue;
        if (seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        const rawValues = match[2].trim();
        const parts = rawValues.split(/[\/|]/).map(p => p.trim());
        const weight = parseFloat(parts[0]) || 0;
        let totalReps = 0;
        for (let j = 1; j < parts.length; j++) {
          const r = parseInt(parts[j]);
          if (!isNaN(r)) totalReps += r;
        }
        const volume = weight * totalReps;
        accessories.push({ name, weight, totalReps, volume, raw: rawValues, category: getCategory(name), source: 'comment' });
      }
      return accessories;
    };

    const extractComment = (notes, accessories) => {
      if (!notes) return '';
      let comment = notes;
      accessories.forEach(a => {
        const escapedName = a.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(escapedName + '\\s*[-:]\\s*' + a.raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        comment = comment.replace(pattern, '');
      });
      return comment
        .replace(/^[,\s\-.:()\n]+/, '')
        .replace(/[,\s\-.:()\n]+$/, '')
        .replace(/\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
    };

    // ─── Build form exercises from structured columns ──────────────────────────
    const buildFormExercises = (cells) => {
      const result = [];
      const addEx = (name, colIdx, category) => {
        const d = parseExerciseStr(cells, colIdx);
        if (d.raw) result.push({ name, weight: d.weight, totalReps: d.totalReps, volume: d.volume, raw: d.raw, category, source: 'form' });
      };
      addEx('Assisted Pull-ups',            idx.pullUps,      'back');
      addEx('Seated Machine Rows',          idx.rows,         'back');
      addEx('Dumbbell Bench Press',         idx.benchPress,   'chest');
      addEx('Assisted Push-ups',            idx.pushUps,      'chest');
      addEx('Dumbbell Shoulder Press',      idx.shoulderPress,'shoulders');
      addEx('Dumbbell Lateral Raises',      idx.lateralRaises,'shoulders');
      addEx('Dumbbell Bicep Curls',         idx.bicepCurls,   'arms');
      addEx('Overhead DB Tricep Ext',       idx.tricepExt,    'arms');
      addEx('Wrist Curls + Reverse Curls',  idx.wristCurls,   'arms');
      addEx('Weighted Squats',              idx.squats,       'legs');
      addEx('Walking Lunges',              idx.lunges,       'legs');
      addEx('Dumbbell Romanian Deadlifts',  idx.rdls,         'legs');
      addEx('Standing Calf Raises',         idx.calfRaises,   'legs');
      addEx('Lying Leg Raises',             idx.legRaises,    'core');
      addEx('Core Planks & Cobra Stretch',  idx.planks,       'core');
      const cardioRaw = getStr(cells, idx.cardio);
      if (cardioRaw && cardioRaw !== '0')
        result.push({ name: 'Cardio Finisher', weight: 0, totalReps: 0, volume: 0, raw: cardioRaw, category: 'cardio', source: 'form', isCardio: true });
      return result;
    };

    // ─── Process all rows ─────────────────────────────────────────────────────
    const records = rows.map((row) => {
      if (!row || !row.c) return null;
      const cells = row.c;
      const date = parseDate(cells, idx.date);
      if (!date) return null;

      const routine     = getStr(cells, idx.split);
      const preWeight   = getNum(cells, idx.preWeight);
      const postWeight  = getNum(cells, idx.postWeight);
      const sleep       = getStr(cells, idx.sleep);
      const notes       = getStr(cells, idx.notes);
      const photoUrl    = getStr(cells, idx.photo);
      const dayOfWeek   = getStr(cells, idx.day);

      // Legacy volume fields (keep for existing charts)
      const pullUpVolume  = parseVolume(cells, idx.pullUps);
      const benchVolume   = parseVolume(cells, idx.benchPress);
      const lateralVolume = parseVolume(cells, idx.lateralRaises);
      const squatVolume   = parseVolume(cells, idx.squats);

      const formExercises  = buildFormExercises(cells);
      const accessories    = parseAccessories(notes);

      // Merge: avoid duplicating exercises already in form
      const formNames = new Set(formExercises.map(e => e.name.toLowerCase()));
      const uniqueAcc = accessories.filter(a => !formNames.has(a.name.toLowerCase()));
      const allExercises = [...formExercises, ...uniqueAcc];

      const accessoryVolume    = accessories.reduce((s, a) => s + a.volume, 0);
      const totalSessionVolume = formExercises.reduce((s, e) => s + e.volume, 0) + accessoryVolume;

      const comment = extractComment(notes, accessories);

      const sleepScore = sleep.includes('9+') ? 10 : sleep.includes('8') ? 8 :
                         sleep.includes('7') ? 7 : sleep.includes('6') ? 6 :
                         sleep.includes('5.5') ? 5 : sleep.includes('less') ? 3 : 5;

      return {
        date, dayOfWeek, routine, preWeight, postWeight, sleep, sleepScore,
        pullUpVolume, benchVolume, lateralVolume, squatVolume,
        accessoryVolume, totalSessionVolume,
        photoUrl, notes, comment,
        accessories, formExercises, allExercises,
        keywords: []
      };
    }).filter(Boolean);

    res.status(200).json(records);
  } catch (error) {
    console.error('Workout API error:', error);
    res.status(500).json({ error: 'Failed to load workout data' });
  }
}
