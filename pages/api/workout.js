import { es } from 'es-toolkit'; // Just in case, but standard JS fetch is fine

export default async function handler(req, res) {
  try {
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/1Crarq7CMIQMjzwA3fTsSDiCVTSP-5JbF3qWNlxpfuxY/gviz/tq?tqx=out:json';
    
    const response = await fetch(sheetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet data: ${response.statusText}`);
    }

    const text = await response.text();
    
    // Strip google.visualization.Query.setResponse( ... );
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('Invalid Google Sheet JSON format');
    }
    
    const jsonString = text.substring(jsonStart, jsonEnd);
    const data = JSON.parse(jsonString);

    if (!data.table || !data.table.rows) {
      return res.status(200).json([]);
    }

    const cols = data.table.cols || [];
    const rows = data.table.rows;

    // Define column indices by matching labels in the sheet
    // We try to find the columns dynamically. If they are not found, we use the user's literal indices:
    // User Literal indices:
    // c[0]: Execution Date
    // c[2]: Target Split Variant
    // c[3]: Pre weight
    // c[4]: Post weight
    // c[6]: PullUps string
    // c[8]: Bench string
    // c[11]: Lateral Raises string
    // c[15]: Squats string
    let dateIdx = 0;
    let splitIdx = 2;
    let preWeightIdx = 3;
    let postWeightIdx = 4;
    let pullUpsIdx = 6;
    let benchIdx = 8;
    let lateralIdx = 11;
    let squatsIdx = 15;
    let notesIdx = 23;
    let photoIdx = 24;

    // Perform dynamic header check to adjust indices based on actual spreadsheet column order
    if (cols.length > 0) {
      const findColIdx = (substrings) => {
        return cols.findIndex(col => 
          col && col.label && 
          substrings.some(sub => col.label.toLowerCase().includes(sub.toLowerCase()))
        );
      };

      const foundDate = findColIdx(['daily biometrics - date', 'timestamp']);
      const foundSplit = findColIdx(["today's workout split", 'workout split', 'select today\'s']);
      const foundPre = findColIdx(['pre-workout weight', 'pre weight', 'pre-workout body mass']);
      const foundPost = findColIdx(['post-workout weight', 'post weight', 'post-workout body mass']);
      const foundPullUps = findColIdx(['assisted pull-ups', 'pull-ups', 'pullups', 'pull ups']);
      const foundBench = findColIdx(['dumbbell bench press', 'bench press', 'chest press']);
      const foundLateral = findColIdx(['dumbbell lateral raises', 'lateral raises', 'lateral raise']);
      const foundSquats = findColIdx(['weighted squats', 'squats', 'squat']);
      const foundNotes = findColIdx(['session notes', 'notes', 'notes / rpe', 'submission notes']);
      const foundPhoto = findColIdx(['physique progress photo', 'progress photo', 'physique photo', 'daily physique progress photo', 'photo']);

      // Only re-map if we successfully find key headers (avoids false overrides on mock tests)
      if (foundPre !== -1 && foundPost !== -1) {
        if (foundDate !== -1) dateIdx = foundDate;
        if (foundSplit !== -1) splitIdx = foundSplit;
        preWeightIdx = foundPre;
        postWeightIdx = foundPost;
        if (foundPullUps !== -1) pullUpsIdx = foundPullUps;
        if (foundBench !== -1) benchIdx = foundBench;
        if (foundLateral !== -1) lateralIdx = foundLateral;
        if (foundSquats !== -1) squatsIdx = foundSquats;
        if (foundNotes !== -1) notesIdx = foundNotes;
        if (foundPhoto !== -1) photoIdx = foundPhoto;
      }
    }

    const parseDate = (cell) => {
      if (!cell) return '';
      let valStr = '';
      if (cell.f) {
        valStr = cell.f;
      } else if (cell.v) {
        valStr = String(cell.v);
      } else {
        return '';
      }

      if (valStr.includes('Date(')) {
        const matches = valStr.match(/Date\((\d+),\s*(\d+),\s*(\d+)/);
        if (matches) {
          const year = parseInt(matches[1], 10);
          const month = parseInt(matches[2], 10) + 1; // Google 0-indexed month
          const day = parseInt(matches[3], 10);
          const dd = String(day).padStart(2, '0');
          const mm = String(month).padStart(2, '0');
          return `${dd}/${mm}/${year}`;
        }
      }

      try {
        const date = new Date(valStr);
        if (!isNaN(date.getTime())) {
          const dd = String(date.getDate()).padStart(2, '0');
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const yyyy = date.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        }
      } catch (e) {}

      return valStr;
    };

    const parseWeight = (cell) => {
      if (!cell) return 0;
      const val = (typeof cell === 'object' && cell !== null) ? cell.v : cell;
      if (val === null || val === undefined || val === '') return 0;
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    };

    const parseVolume = (cell) => {
      if (!cell) return 0;
      const val = (typeof cell === 'object' && cell !== null) ? cell.v : cell;
      if (val === null || val === undefined || val === '') return 0;

      const str = String(val).trim();
      if (!str) return 0;

      // Handle simple numbers if string has no slash, e.g. "80"
      if (!str.includes('/')) {
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
      }

      const parts = str.split('/').map(p => p.trim());
      if (parts.length === 0 || parts[0] === '') return 0;

      const weight = parseFloat(parts[0]);
      if (isNaN(weight)) return 0;

      let totalReps = 0;
      for (let i = 1; i < parts.length; i++) {
        const reps = parseInt(parts[i], 10);
        if (!isNaN(reps)) {
          totalReps += reps;
        }
      }

      return weight * totalReps;
    };

    const parseStringVal = (cell) => {
      if (!cell) return '';
      const val = (typeof cell === 'object' && cell !== null) ? cell.v : cell;
      return val === null || val === undefined ? '' : String(val);
    };

    const formattedRecords = rows.map((row) => {
      if (!row || !row.c) return null;
      
      const cells = row.c;
      const date = parseDate(cells[dateIdx]);
      
      // Skip empty date rows
      if (!date) return null;

      const routine = parseStringVal(cells[splitIdx]);
      const preWeight = parseWeight(cells[preWeightIdx]);
      const postWeight = parseWeight(cells[postWeightIdx]);
      const pullUpVolume = parseVolume(cells[pullUpsIdx]);
      const benchVolume = parseVolume(cells[benchIdx]);
      const lateralVolume = parseVolume(cells[lateralIdx]);
      const squatVolume = parseVolume(cells[squatsIdx]);
      const photoUrl = parseStringVal(cells[photoIdx]);
      const notes = parseStringVal(cells[notesIdx]);

      // Parse accessories from notes
      let accessoryVolume = 0;
      const accessories = [];
      const keywords = [];

      const getCategory = (exName) => {
        const n = exName.toLowerCase();
        
        // 1. Legs (check legs before general terms like "press" or "extension")
        if (n.includes('leg press') || n.includes('squat') || n.includes('leg extension') || 
            n.includes('leg curl') || n.includes('calf') || n.includes('rdl') || 
            n.includes('lunge') || n.includes('quad') || n.includes('hamstring') || n.includes('calf') || n.includes('calves')) {
          return 'legs';
        }
        
        // 2. Arms (check arm curls and pushdowns before other categories)
        if (n.includes('bicep') || n.includes('tricep') || n.includes('curl') || 
            n.includes('hammer') || n.includes('pushdown') || n.includes('kickback') || 
            n.includes('wrist') || n.includes('forearm') || n.includes('arm')) {
          return 'arms';
        }
        
        // 3. Shoulders
        if (n.includes('lateral') || n.includes('delt') || n.includes('face pull') || 
            n.includes('face-pull') || n.includes('shoulder') || n.includes('overhead press') || 
            n.includes('ohp') || n.includes('military press') || n.includes('shrug')) {
          return 'shoulders';
        }
        
        // 4. Chest
        if (n.includes('bench') || n.includes('chest') || n.includes('flye') || 
            n.includes('flys') || n.includes('flyes') || n.includes('push-up') || n.includes('pushup') || 
            (n.includes('press') && !n.includes('leg') && !n.includes('shoulder') && !n.includes('overhead'))) {
          return 'chest';
        }
        
        // 5. Back
        if (n.includes('pull-up') || n.includes('pullup') || n.includes('pulldown') || 
            n.includes('row') || n.includes('chin-up') || n.includes('chinup') || 
            n.includes('deadlift') || n.includes('lat') || n.includes('back')) {
          return 'back';
        }
        
        // 6. Core
        if (n.includes('belly') || n.includes('crunch') || n.includes('plank') || 
            n.includes('sit-up') || n.includes('situp') || n.includes('abs') || 
            n.includes('core') || (n.includes('raise') && !n.includes('lateral'))) {
          return 'core';
        }
        
        return 'other';
      };

      // Match any exercise name followed by - or : and sets/reps (e.g. Leg Press - 100/15/15/15)
      const exerciseRegex = /([a-zA-Z0-9\s&()'+/\\]+?)\s*[:\-]\s*([\d.]+(?:\s*[\/|\\]\s*[\d.]+)+)/gi;
      let match;
      const parsedMatches = [];
      while ((match = exerciseRegex.exec(notes)) !== null) {
        let name = match[1].trim();
        // Strip leading comma, dot or spaces from name
        name = name.replace(/^[^a-zA-Z0-9]+/, '').trim();
        const rawValues = match[2].trim();
        const volume = parseVolume(rawValues);
        const category = getCategory(name);
        
        accessoryVolume += volume;
        accessories.push({ name, volume, raw: rawValues, category });
        parsedMatches.push(match[0]);
      }

      // Remove all matched exercise log patterns from notes to isolate pure personal journal entries
      let comment = notes;
      parsedMatches.forEach(m => {
        comment = comment.replace(m, '');
      });
      // Clean up punctuation leftovers
      comment = comment
        .replace(/^[,\s\-:.]+/, '') 
        .replace(/[,\s\-:.]+$/, '') 
        .replace(/\s*,\s*,/g, ',')
        .replace(/\s+/g, ' ')
        .trim();

      // Check for recovery keywords
      const KEYWORDS = ['Steam Bath', 'Trainer Swaps', 'Sauna', 'Spa', 'Pool', 'Stretch', 'Cardio Extra'];
      KEYWORDS.forEach(kw => {
        if (notes.toLowerCase().includes(kw.toLowerCase())) {
          keywords.push(kw);
        }
      });

      return {
        date,
        routine,
        preWeight,
        postWeight,
        pullUpVolume,
        benchVolume,
        lateralVolume,
        squatVolume,
        photoUrl,
        notes,
        comment,
        accessoryVolume,
        accessories,
        keywords
      };
    }).filter(Boolean);

    res.status(200).json(formattedRecords);
  } catch (error) {
    console.error('Error fetching/parsing workout data:', error);
    res.status(500).json({ error: 'Failed to aggregate workout data pipeline' });
  }
}
