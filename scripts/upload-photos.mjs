#!/usr/bin/env node
// Attaches a folder of progress photos to the sessions already in the sheet.
// Each file is named after its session date, e.g. "21 Sep, 2026.jpeg" or "2026-09-21.jpg".
//
//   node scripts/upload-photos.mjs "/path/to/folder" [--replace] [--url https://…]
//
// Asks for your LOG_PIN. Dates that already have a photo are skipped unless --replace.

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
const replace = args.includes('--replace');
const urlArg = args.indexOf('--url');
const site = (urlArg !== -1 ? args[urlArg + 1] : 'https://fitness-dashboard-beta.vercel.app').replace(/\/$/, '');
if (!dir) { console.error('Usage: node scripts/upload-photos.mjs "<folder>" [--replace]'); process.exit(1); }

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const pad = (n) => String(n).padStart(2, '0');
const dateOf = (file) => {
  const name = path.parse(file).name.trim();
  let m = name.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m = name.match(/^(\d{1,2})\s+([a-z]+)\.?,?\s*(\d{4})$/i);
  if (m) {
    const mo = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
    if (mo) return `${m[3]}-${pad(mo)}-${pad(m[1])}`;
  }
  return null;
};
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const askHidden = (q) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
  rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); };
  rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); resolve(a.trim()); });
});

const files = fs.readdirSync(dir)
  .filter((f) => MIME[path.extname(f).toLowerCase()])
  .map((f) => ({ f, date: dateOf(f) }))
  .sort((a, b) => String(a.date).localeCompare(String(b.date)));
if (!files.length) { console.error('No .jpg/.jpeg/.png/.webp files in', dir); process.exit(1); }

const pin = await askHidden('LOG_PIN: ');
let ok = 0;
for (const { f, date } of files) {
  if (!date) { console.log(`✗ ${f}: can't read a date from the file name`); continue; }
  const buf = fs.readFileSync(path.join(dir, f));
  if (buf.length > 3 * 1024 * 1024) { console.log(`✗ ${f}: larger than 3 MB, shrink it first`); continue; }
  const r = await fetch(`${site}/api/photo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin, date, replace, photo: { mimeType: MIME[path.extname(f).toLowerCase()], data: buf.toString('base64') } }),
  });
  const body = await r.json().catch(() => ({}));
  if (r.status === 401) { console.log('✗ Wrong PIN'); process.exit(1); }
  if (r.ok) { ok++; console.log(`✓ ${date}  ${f}${body.skipped ? `  (skipped: ${body.skipped})` : `  → row ${body.row}`}`); }
  else console.log(`✗ ${date}  ${f}: ${body.error || r.status}`);
}
console.log(`\n${ok}/${files.length} done`);
