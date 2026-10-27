import { configured, NOT_CONFIGURED, pinOk, PHOTO_COOKIE, photoToken, hasPhotoAccess } from '../../lib/appsScript';

// GET  → { unlocked } for this browser
// POST { pin } → remembers this browser for a year so it can view progress photos
export default function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ unlocked: hasPhotoAccess(req), configured: configured() });
  if (req.method !== 'POST') return res.status(405).json({ error: 'GET or POST' });
  if (!configured()) return res.status(503).json({ error: NOT_CONFIGURED });
  if (!pinOk(req.body?.pin)) return res.status(401).json({ error: 'Wrong PIN' });
  res.setHeader('Set-Cookie', `${PHOTO_COOKIE}=${photoToken()}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`);
  return res.status(200).json({ unlocked: true });
}
