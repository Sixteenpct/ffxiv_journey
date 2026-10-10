#!/usr/bin/env node
/** Validate common FF14 Journey footer markup and shared stylesheet usage. */
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ignored = new Set([".git", "node_modules", "dist", ".cache"]);
const pages = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const name = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(name);
    else if (entry.isFile() && entry.name.endsWith(".html")) pages.push(name);
  }
}
const failures = [];
await walk(root);
if (!pages.length) failures.push("No HTML files found");
for (const file of pages) {
  const rel = path.relative(root, file).replaceAll(path.sep, "/");
  const html = await readFile(file, "utf8");
  const footers = [...html.matchAll(/<footer\b([^>]*)>([\s\S]*?)<\/footer>/gi)];
  if (footers.length !== 1) { failures.push(rel + ": expected exactly one footer"); continue; }
  const footer = footers[0][0];
  const slots = ["footer-credit", "footer-brand", "footer-rights"];
  const offsets = slots.map(slot => footer.indexOf('class="' + slot + '"'));
  if (offsets.some(pos => pos < 0) || offsets.some((pos, idx) => idx > 0 && pos <= offsets[idx - 1])) {
    failures.push(rel + ": footer must contain ordered credit / brand / rights classes");
  }
  if (!footer.includes("© sixteenpct · FF14 JOURNEY") || !footer.includes("FINAL FANTASY XIV © SQUARE ENIX")) {
    failures.push(rel + ": missing approved credit or rights text");
  }
  // Two approved legacy pages have equivalent inline footer CSS.
  const legacy = rel === "index.html" || rel === "collection/workbench/index.html";
  if (legacy) continue;
  if (!footers[0][1] || !footers[0][1].includes("site-footer")) {
    failures.push(rel + ": footer must use shared site-footer class");
  }
  const tag = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(x => x[0]).find(x => /site-footer\.css/.test(x));
  const href = tag?.match(/href=["']([^"']+)["']/i)?.[1];
  if (!href || !href.endsWith("assets/site-footer.css")) {
    failures.push(rel + ": missing common assets/site-footer.css stylesheet reference");
    continue;
  }
  const target = path.resolve(path.dirname(file), href);
  if (path.relative(root, target).startsWith("..")) {
    failures.push(rel + ": footer CSS path exits repository");
    continue;
  }
  try { await access(target); } catch { failures.push(rel + ": footer CSS does not exist at " + href); }
}
if (failures.length) {
  console.error("FAIL footer consistency (" + failures.length + "):");
  for (const issue of failures) console.error(" - " + issue);
  process.exitCode = 1;
} else {
  console.log("PASS footer consistency: " + pages.length + " page(s), approved three-line shell.");
}
