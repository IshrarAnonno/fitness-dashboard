/**
 * Fitness Tracker — sheet writer
 *
 * Receives a logged session from the app (/api/log) and appends it as a new row
 * in the form-responses sheet, so the dashboard picks it up like a form entry.
 *
 * Setup: see apps-script/SETUP.md
 */

// Must match APPS_SCRIPT_SECRET in Vercel. Change this to your own random string.
const SECRET = 'CHANGE-ME-to-a-long-random-string';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) return json_({ ok: false, error: 'unauthorized' });

    const sheet = findResponsesSheet_();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
      .map(function (h) { return String(h).toLowerCase(); });

    const row = new Array(headers.length).fill('');
    const put = function (keyword, value) {
      const i = headers.findIndex(function (h) { return h.indexOf(keyword) !== -1; });
      if (i !== -1 && value !== undefined && value !== null) row[i] = value;
    };

    put('timestamp', new Date());
    if (body.date) {
      const p = body.date.split('-').map(Number);
      put('daily biometrics - date', new Date(p[0], p[1] - 1, p[2]));
    }
    Object.keys(body.values || {}).forEach(function (k) { put(k, body.values[k]); });

    sheet.appendRow(row);
    return json_({ ok: true, row: sheet.getLastRow() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function findResponsesSheet_() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var s = 0; s < sheets.length; s++) {
    const first = sheets[s].getRange(1, 1, 1, Math.max(1, sheets[s].getLastColumn())).getValues()[0].join('|').toLowerCase();
    if (first.indexOf('daily biometrics - date') !== -1) return sheets[s];
  }
  return sheets[0];
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
