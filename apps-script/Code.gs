/**
 * Fitness Tracker — sheet writer
 *
 * Called only by the website's server (/api/log, /api/photo), never by browsers.
 *   action 'log'    (default) append a logged session as a new row; an optional
 *                   photo is saved to Drive and linked in the photo column
 *   action 'photo'  save a progress photo for a date that already has a row
 *   action 'image'  return a progress photo's bytes so the site can show it
 *                   without the Drive file being public
 *
 * Setup: see apps-script/SETUP.md
 */

// Must match APPS_SCRIPT_SECRET in Vercel. Change this to your own random string.
const SECRET = 'CHANGE-ME-to-a-long-random-string';

const PHOTO_FOLDER = 'Fitness Tracker Photos';
const PHOTO_COLUMN = 'physique progress photo';
const DATE_COLUMN = 'daily biometrics - date';

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    // Photo requests send the secret as `key`, so an older copy of this script
    // rejects them instead of appending an empty row
    if ((body.key || body.secret) !== SECRET) return json_({ ok: false, error: 'unauthorized' });
    if (body.action === 'photo') return json_(savePhotoForDate_(body));
    if (body.action === 'image') return json_(readImage_(body.id));
    return json_(appendSession_(body));
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function appendSession_(body) {
  const sheet = findResponsesSheet_();
  const headers = headers_(sheet);
  const row = new Array(headers.length).fill('');
  const put = function (keyword, value) {
    const i = col_(headers, keyword);
    if (i !== -1 && value !== undefined && value !== null) row[i] = value;
  };

  put('timestamp', new Date());
  if (body.date) put(DATE_COLUMN, toDate_(body.date));
  Object.keys(body.values || {}).forEach(function (k) { put(k, body.values[k]); });
  if (body.photo && body.photo.data) put(PHOTO_COLUMN, savePhoto_(body.date, body.photo));

  sheet.appendRow(row);
  return { ok: true, row: sheet.getLastRow() };
}

// Puts the photo on the first row with that date (a day can have more than one row)
function savePhotoForDate_(body) {
  const sheet = findResponsesSheet_();
  const headers = headers_(sheet);
  const dateCol = col_(headers, DATE_COLUMN);
  const photoCol = col_(headers, PHOTO_COLUMN);
  if (dateCol === -1 || photoCol === -1) return { ok: false, error: 'date or photo column not found' };

  const want = toDate_(body.date).toDateString();
  const dates = sheet.getRange(2, dateCol + 1, Math.max(1, sheet.getLastRow() - 1), 1).getValues();
  for (var r = 0; r < dates.length; r++) {
    const d = dates[r][0];
    if (d instanceof Date && d.toDateString() === want) {
      const cell = sheet.getRange(r + 2, photoCol + 1);
      if (cell.getValue() && !body.replace) return { ok: true, row: r + 2, skipped: 'already has a photo' };
      cell.setValue(savePhoto_(body.date, body.photo));
      return { ok: true, row: r + 2 };
    }
  }
  return { ok: false, error: 'no row for ' + body.date + ' yet — import that session first' };
}

function savePhoto_(date, photo) {
  const it = DriveApp.getFoldersByName(PHOTO_FOLDER);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER);
  const blob = Utilities.newBlob(Utilities.base64Decode(photo.data), photo.mimeType || 'image/jpeg', date + '.jpg');
  return 'https://drive.google.com/open?id=' + folder.createFile(blob).getId();
}

// Only files linked in the photo column can be read, nothing else in your Drive
function readImage_(id) {
  if (!/^[\w-]{10,}$/.test(String(id || ''))) return { ok: false, error: 'bad id' };
  const sheet = findResponsesSheet_();
  const photoCol = col_(headers_(sheet), PHOTO_COLUMN);
  if (photoCol === -1) return { ok: false, error: 'photo column not found' };
  const linked = sheet.getRange(2, photoCol + 1, Math.max(1, sheet.getLastRow() - 1), 1).getValues()
    .some(function (v) { return String(v[0]).indexOf(id) !== -1; });
  if (!linked) return { ok: false, error: 'not found' };
  const blob = DriveApp.getFileById(id).getBlob();
  return { ok: true, mimeType: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

function findResponsesSheet_() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var s = 0; s < sheets.length; s++) {
    const first = sheets[s].getRange(1, 1, 1, Math.max(1, sheets[s].getLastColumn())).getValues()[0].join('|').toLowerCase();
    if (first.indexOf(DATE_COLUMN) !== -1) return sheets[s];
  }
  return sheets[0];
}

function headers_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h).toLowerCase(); });
}

function col_(headers, keyword) {
  return headers.findIndex(function (h) { return h.indexOf(keyword) !== -1; });
}

function toDate_(iso) {
  const p = String(iso).split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
