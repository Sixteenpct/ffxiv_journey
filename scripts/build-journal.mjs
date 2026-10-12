#!/usr/bin/env node
/* Only owner-approved, explicitly public articles may enter the static index.
   Human approval is established privately; fingerprints bind its exact export. */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'pve/journal');
const hash = text => createHash('sha256').update(text).digest('hex');
const escape = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const manifest = JSON.parse(await readFile(path.join(dir, 'entries.json'), 'utf8'));
if (manifest.schemaVersion !== 1 || manifest.domain !== 'ff14' || !Array.isArray(manifest.entries)) throw Error('Invalid journal manifest');
if (Object.keys(manifest).some(key => !['schemaVersion','domain','entries'].includes(key))) throw Error('Unexpected manifest metadata');
const ids = new Set(), files = new Set();
for (const entry of manifest.entries) {
  const keys = ['id','date','track','course','title','href','approval'];
  if (keys.some(key => !(key in entry)) || Object.keys(entry).some(key => !keys.includes(key))) throw Error('Unexpected journal fields');
  if (!/^J\d{3,}$/.test(entry.id) || ids.has(entry.id)) throw Error('Invalid or duplicate journal ID');
  ids.add(entry.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || new Date(entry.date).toISOString().slice(0,10) !== entry.date) throw Error('Invalid date');
  if (!['職業養成','內容專修'].includes(entry.track) || !/^[RXDTNA]\d{3}$/.test(entry.course) || (entry.track === '職業養成') !== /^[RX]/.test(entry.course)) throw Error('Invalid learning track/course');
  if (typeof entry.title !== 'string' || !entry.title.trim() || entry.title.length > 100) throw Error('Invalid title');
  if (!/^articles\/[a-z0-9-]+\/index\.html$/.test(entry.href) || files.has(entry.href)) throw Error('Invalid or duplicate article path');
  files.add(entry.href);
  const a = entry.approval;
  if (!a || a.owner !== 'LiouLiou' || a.status !== 'approved' || a.publication !== 'public' || !/^\d{4}-\d{2}-\d{2}T/.test(a.approvedAt) || !Number.isFinite(Date.parse(a.approvedAt))) throw Error('Missing owner approval or explicit public consent');
  if (Object.keys(a).some(key => !['owner','status','publication','approvedAt','contentSha256','indexSha256'].includes(key))) throw Error('Do not export private approval notes');
  const metadata = Object.fromEntries(keys.filter(key => key !== 'approval').map(key => [key,entry[key]]));
  if (a.indexSha256 !== hash(JSON.stringify(metadata))) throw Error('Index metadata differs from approved snapshot');
  const content = await readFile(path.join(dir, entry.href), 'utf8');
  if (a.contentSha256 !== hash(content)) throw Error('Article differs from approved snapshot');
}
// Unindexed articles and drafts must never be left in the public journal directory.
async function walk(folder, prefix='') {
  for (const item of await readdir(folder,{withFileTypes:true})) {
    const name = prefix + item.name;
    if (item.isDirectory()) await walk(path.join(folder,item.name),name+'/');
    else if (name !== 'index.html' && name !== 'entries.json' && !files.has(name)) throw Error('Unapproved file in journal directory: '+name);
  }
}
await walk(dir);
const rows = [...manifest.entries].sort((a,b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)).map(e => `<tr data-track="${escape(e.track)}"><td>${escape(e.date)}</td><td>${escape(e.track)}</td><td>${escape(e.course)}</td><td><a href="${escape(e.href)}" target="_blank" rel="noopener noreferrer">${escape(e.title)} ↗</a></td></tr>`).join('');
const file = path.join(dir,'index.html');
const original = await readFile(file,'utf8');
if (!original.includes('<!-- APPROVED_ENTRIES_START -->') || !original.includes('<!-- APPROVED_ENTRIES_END -->')) throw Error('Journal export markers missing');
const expected = original.replace(/<!-- APPROVED_ENTRIES_START -->[\s\S]*?<!-- APPROVED_ENTRIES_END -->/,`<!-- APPROVED_ENTRIES_START -->${rows}<!-- APPROVED_ENTRIES_END -->`).replace(/<span class="track-count">\d+ 篇收錄<\/span>/,`<span class="track-count">${manifest.entries.length} 篇收錄</span>`).replace(/<tr id="journal-empty"(?: hidden)?>/,`<tr id="journal-empty"${rows ? ' hidden' : ''}>`);
if (process.argv.includes('--write')) await writeFile(file,expected);
else if (original !== expected) throw Error('Journal index is out of sync; generate only after approval');
console.log(`PASS journal publication gate: ${manifest.entries.length} approved public article(s), exact article and index fingerprints.`);
