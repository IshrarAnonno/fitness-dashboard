import crypto from 'crypto';

// Server-side calls to the Apps Script attached to the sheet (see apps-script/Code.gs).

export const configured = () => {
  const { LOG_PIN, APPS_SCRIPT_URL, APPS_SCRIPT_SECRET } = process.env;
  return !!(LOG_PIN && APPS_SCRIPT_URL && APPS_SCRIPT_SECRET);
};

export const NOT_CONFIGURED = 'Logging is not configured on the server yet (see apps-script/SETUP.md).';
export const OLD_SCRIPT = 'Your Apps Script is out of date: paste the new apps-script/Code.gs and deploy it as a New version.';

// Photo actions send the secret as `key`; an older script answers 'unauthorized'
export async function callScript(payload, { photo = false } = {}) {
  const { APPS_SCRIPT_URL, APPS_SCRIPT_SECRET } = process.env;
  const auth = photo ? { key: APPS_SCRIPT_SECRET } : { secret: APPS_SCRIPT_SECRET };
  const r = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...auth, ...payload }),
    redirect: 'follow',
  });
  const text = await r.text();
  let out;
  try { out = JSON.parse(text); } catch { throw new Error('Apps Script did not return JSON — check the deployment access is "Anyone".'); }
  if (!out.ok) throw new Error(photo && out.error === 'unauthorized' ? OLD_SCRIPT : out.error || 'Apps Script rejected the request');
  return out;
}

// Cookie that lets a browser view progress photos after entering the PIN once
export const PHOTO_COOKIE = 'ft_photos';
export const photoToken = () =>
  crypto.createHmac('sha256', process.env.APPS_SCRIPT_SECRET || '').update(`photos:${process.env.LOG_PIN || ''}`).digest('hex');
export const hasPhotoAccess = (req) => configured() && req.cookies?.[PHOTO_COOKIE] === photoToken();

export const pinOk = (pin) => configured() && String(pin || '') === process.env.LOG_PIN;
