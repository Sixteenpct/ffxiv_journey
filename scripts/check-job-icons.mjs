#!/usr/bin/env node
/**
 * Ensure all 21 job names use distinct, correctly identified NIN/PLD/etc
 * self-hosted transparent SVGs. No external modules.
 * Run: node scripts/check-job-icons.mjs
 */
import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jobs = [
  { role:"tank", name:"騎士", code:"PLD", iconId:"062401", slug:"paladin", color:"#2686b5" },
  { role:"tank", name:"戰士", code:"WAR", iconId:"062403", slug:"warrior", color:"#2686b5" },
  { role:"tank", name:"暗黑騎士", code:"DRK", iconId:"062412", slug:"dark-knight", color:"#2686b5" },
  { role:"tank", name:"絕槍戰士", code:"GNB", iconId:"062417", slug:"gunbreaker", color:"#2686b5" },
  { role:"melee", name:"武僧", code:"MNK", iconId:"062402", slug:"monk", color:"#b8554b" },
  { role:"melee", name:"龍騎士", code:"DRG", iconId:"062404", slug:"dragoon", color:"#b8554b" },
  { role:"melee", name:"忍者", code:"NIN", iconId:"062410", slug:"ninja", color:"#b8554b" },
  { role:"melee", name:"武士", code:"SAM", iconId:"062414", slug:"samurai", color:"#b8554b" },
  { role:"melee", name:"奪魂者", code:"RPR", iconId:"062419", slug:"reaper", color:"#b8554b" },
  { role:"melee", name:"毒蛇劍士", code:"VPR", iconId:"062421", slug:"viper", color:"#b8554b" },
  { role:"healer", name:"白魔道士", code:"WHM", iconId:"062406", slug:"white-mage", color:"#258c71" },
  { role:"healer", name:"學者", code:"SCH", iconId:"062409", slug:"scholar", color:"#258c71" },
  { role:"healer", name:"占星術師", code:"AST", iconId:"062413", slug:"astrologian", color:"#258c71" },
  { role:"healer", name:"賢者", code:"SGE", iconId:"062420", slug:"sage", color:"#258c71" },
  { role:"ranged", name:"吟遊詩人", code:"BRD", iconId:"062405", slug:"bard", color:"#ac7c2e" },
  { role:"ranged", name:"機工士", code:"MCH", iconId:"062411", slug:"machinist", color:"#ac7c2e" },
  { role:"ranged", name:"舞者", code:"DNC", iconId:"062418", slug:"dancer", color:"#ac7c2e" },
  { role:"caster", name:"黑魔道士", code:"BLM", iconId:"062407", slug:"black-mage", color:"#c77c56" },
  { role:"caster", name:"召喚士", code:"SMN", iconId:"062408", slug:"summoner", color:"#c77c56" },
  { role:"caster", name:"赤魔道士", code:"RDM", iconId:"062415", slug:"red-mage", color:"#c77c56" },
  { role:"caster", name:"繪靈法師", code:"PCT", iconId:"062422", slug:"pictomancer", color:"#c77c56" }
];
const html = await readFile(path.join(root,"pve/jobs/index.html"),"utf8");
const problems = [];
const groups = [...html.matchAll(/<section class="group role-([\w-]+)"[^>]*>([\s\S]*?)<\/section>/g)];
const expects = ["tank","melee","healer","ranged","caster"];
if (groups.length !== 5 || groups.map(m => m[1]).join(",") !== expects.join(",")) problems.push("Wrong group count/order");
const entries = [];
for (const group of groups) {
  const rows = [...group[2].matchAll(/<(span|a) class="job(?: open)?"[^>]*><span class="job-name"><img class="job-icon" src="([^"]+)" alt="" aria-hidden="true" width="27" height="27" decoding="async"><span class="job-label">([^<]+)<\/span><\/span><small>([^<]+)<\/small><\/\1>/g)];
  for (const row of rows) entries.push({role:group[1],src:row[2],name:row[3],status:row[4],tag:row[1]});
}
if (entries.length !== 21) problems.push("Expected 21 job entries, found "+entries.length);
if ([...html.matchAll(/class="job-icon"/g)].length !== 21) problems.push("Wrong total icon count");
const used = new Set();
for (const j of jobs) {
  const exact = entries.filter(e => e.name === j.name);
  if (exact.length !== 1) { problems.push(j.code+": missing/duplicate job entry"); continue; }
  const entry = exact[0];
  const expectedSrc = "../../assets/job-"+j.slug+".svg";
  if (entry.role !== j.role || entry.src !== expectedSrc) problems.push(j.code+": role/icon route mismatch");
  if (used.has(entry.src)) problems.push(j.code+": duplicate icon source");
  used.add(entry.src);
  if ((j.code === "NIN" && (entry.tag !== "a" || entry.status !== "閱讀 →")) ||
      (j.code !== "NIN" && (entry.tag !== "span" || entry.status !== "籌備中"))) {
    problems.push(j.code+": job availability altered");
  }
  const asset = path.join(root,"assets","job-"+j.slug+".svg");
  try {
    await access(asset);
    const content = await readFile(asset,"utf8");
    if (!content.includes('viewBox="0 0 100 100"') || !content.includes(j.code+" "+j.iconId)) problems.push(j.code+": source code/id mismatch");
    if (!content.includes('fill="'+j.color+'"')) problems.push(j.code+": wrong role color");
    if ((content.match(/<path\s/g)||[]).length !== 1 || !content.includes('fill-rule="evenodd"')) problems.push(j.code+": not one solid emblem");
    if (/<(?:rect|image|foreignObject|text|canvas)\b/i.test(content)) problems.push(j.code+": icon has non-transparent backing or foreign object");
    if (!content.includes("FINAL FANTASY XIV © SQUARE ENIX")) problems.push(j.code+": copyright credit missing");
  } catch(e) { problems.push(j.code+": missing/unreadable SVG "+String(e)); }
}
if (used.size !== 21) problems.push("SVG filenames aren't all distinct");
if (!html.includes('href="ninja/" target="_blank" rel="noopener noreferrer"')) problems.push("Ninja must open new tab");
if (/<a class="job open"[^>]*href="(?!ninja\/)/.test(html)) problems.push("Unexpected newly enabled job link");
if (problems.length) {
  console.error("FAIL job atlas icons:");
  for (const problem of problems) console.error(" - "+problem);
  process.exitCode = 1;
} else {
  console.log("PASS: 21 unique, transparent, role-colored job SVGs and correct unlock states.");
}
