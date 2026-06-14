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

      return {
        date,
        routine,
        preWeight,
        postWeight,
        pullUpVolume,
        benchVolume,
        lateralVolume,
        squatVolume
      };
    }).filter(Boolean);

    res.status(200).json(formattedRecords);
  } catch (error) {
    console.error('Error fetching/parsing workout data:', error);
    res.status(500).json({ error: 'Failed to aggregate workout data pipeline' });
  }
}
