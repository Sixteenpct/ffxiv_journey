#!/usr/bin/env node
/**
 * FF14 Journey: every public HTML document must carry a real browser favicon.
 * Run: node scripts/check-favicons.mjs
 * No third-party dependencies.
 */
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = [];
const ignored = new Set(["node_modules", ".git", ".cache", "dist"]);
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const location = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(location);
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) htmlFiles.push(location);
  }
}
function attr(tag, name) {
  const match = tag.match(new RegExp("\\b" + name + "\\s*=\\s*([\\\"'])" + "([\\s\\S]*?)\\1", "i"));
  return match ? match[2].trim() : "";
}
async function validFavicon(file, href) {
  if (/^data:image\/(?:svg\+xml|png|x-icon|vnd\.microsoft\.icon)[;,]/i.test(href)) return true;
  if (!href || /^(?:[a-z]+:|\/\/|\/)/i.test(href)) return false;
  const withoutQuery = href.split(/[?#]/, 1)[0];
  let decoded;
  try { decoded = decodeURIComponent(withoutQuery); }
  catch { return false; }
  const absolute = path.resolve(path.dirname(file), decoded);
  if (path.relative(root, absolute).startsWith("..")) return false;
  try { await access(absolute); return true; }
  catch { return false; }
}
await walk(root);
const failed = [];
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => match[0]);
  const iconTags = links.filter(tag => /^(?:shortcut\s+)?icon$/i.test(attr(tag, "rel")));
  let okay = false;
  for (const tag of iconTags) {
    if (await validFavicon(file, attr(tag, "href"))) { okay = true; break; }
  }
  if (!okay) failed.push(path.relative(root, file));
}
if (!htmlFiles.length) {
  console.error("FAIL: No HTML pages found.");
  process.exitCode = 1;
} else if (failed.length) {
  console.error("FAIL: Missing/broken browser favicons:");
  for (const file of failed) console.error("  - " + file);
  process.exitCode = 1;
} else {
  console.log("PASS: " + htmlFiles.length + " HTML page(s) contain resolvable favicons.");
}
