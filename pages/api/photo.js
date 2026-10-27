import { configured, NOT_CONFIGURED, callScript, pinOk, hasPhotoAccess } from '../../lib/appsScript';

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

// GET  ?id=<drive file id> → the photo, for browsers unlocked with the PIN (/api/unlock).
//      The Drive files stay private; only files linked in the sheet can be read.
// POST { pin, date, photo: { data (base64), mimeType }, replace? } → attaches a
//      photo to the row that already exists for that date.
export default async function handler(req, res) {
  if (!configured()) return res.status(503).json({ error: NOT_CONFIGURED });

  if (req.method === 'GET') {
    if (!hasPhotoAccess(req)) return res.status(401).json({ error: 'Locked' });
    const id = String(req.query.id || '');
    if (!/^[\w-]{10,}$/.test(id)) return res.status(400).json({ error: 'Bad id' });
    try {
      const out = await callScript({ action: 'image', id }, { photo: true });
      res.setHeader('Content-Type', out.mimeType || 'image/jpeg');
      res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
      return res.status(200).send(Buffer.from(out.data, 'base64'));
    } catch (err) {
      return res.status(502).json({ error: err.message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });
  const { pin, date, photo, replace } = req.body || {};
  if (!pinOk(pin)) return res.status(401).json({ error: 'Wrong PIN' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ error: 'Missing date' });
  if (!photo?.data) return res.status(400).json({ error: 'Missing photo' });
  try {
    const out = await callScript({ action: 'photo', date, photo, replace: !!replace }, { photo: true });
    return res.status(200).json({ ok: true, row: out.row, skipped: out.skipped });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
