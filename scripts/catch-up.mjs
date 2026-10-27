#!/usr/bin/env node
// Catch up in one go: import hand-written sessions, then attach dated photos.
//
//   node scripts/catch-up.mjs "<workouts.txt>" ["<photo folder>"]
//
// The text file uses the same format as the logger's Paste & import screen.
// Asks for your LOG_PIN once. Dates already in the sheet are skipped.

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { parseLog } from '../lib/importText.js';

const SITE = process.env.SITE_URL || 'https://fitness-dashboard-beta.vercel.app';
const [textFile, photoDir] = process.argv.slice(2);
if (!textFile) { console.error('Usage: node scripts/catch-up.mjs "<workouts.txt>" ["<photo folder>"]'); process.exit(1); }

const askHidden = (q) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
  rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); };
  rl.question(q, (a) => { rl.close(); process.stdout.write('\n'); resolve(a.trim()); });
});
const post = async (route, body) => {
  const r = await fetch(`${SITE}${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayOf = (iso) => { const [y, m, d] = iso.split('-').map(Number); return DAYS[new Date(y, m - 1, d).getDay()]; };
const toISO = (s) => { const m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; };

const sessions = parseLog(fs.readFileSync(textFile, 'utf8'));
const existing = new Set((await (await fetch(`${SITE}/api/workout`)).json()).map((r) => toISO(r.date)));
const todo = sessions.filter((s) => !existing.has(s.date));
console.log(`${sessions.length} sessions in the file, ${sessions.length - todo.length} already in the sheet, ${todo.length} to import\n`);
for (const s of sessions) for (const w of s.warnings) console.log(`  ! ${s.date}: ${w}`);

const pin = await askHidden('LOG_PIN: ');
let ok = 0;
for (const s of todo) {
  const { status, body } = await post('/api/log', { ...s, day: dayOf(s.date), pin });
  if (status === 401) { console.log('✗ Wrong PIN'); process.exit(1); }
  if (status === 200) { ok++; console.log(`✓ ${s.date}  ${s.split}  ${s.exercises.length} exercises → row ${body.row}`); }
  else { console.log(`✗ ${s.date}: ${body.error || status}`); process.exit(1); }
}
console.log(`\nSessions: ${ok}/${todo.length} imported`);

if (photoDir) {
  console.log('\nPhotos:');
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'upload-photos.mjs');
  spawnSync(process.execPath, [script, photoDir, '--url', SITE], { input: pin + '\n', stdio: ['pipe', 'inherit', 'inherit'] });
}
