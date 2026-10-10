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
const html = await readFile(path.join(root,"pve/courses/index.html"),"utf8");
const lectureHTML = await readFile(path.join(root,"pve/courses/lectures/index.html"),"utf8");
const problems = [];
const groups = [...html.matchAll(/<section class="group role-([\w-]+)"[^>]*>([\s\S]*?)<\/section>/g)];
const expects = ["tank","melee","healer","ranged","caster"];
if (groups.length !== 5 || groups.map(m => m[1]).join(",") !== expects.join(",")) problems.push("Wrong group count/order");
const entries = [];
for (const group of groups) {
  const rows = [...group[2].matchAll(/<a class="job open" href="([^"]+)" target="_blank" rel="noopener noreferrer" aria-label="([^"]+)"><span class="job-name"><img class="job-icon" src="([^"]+)" alt="" aria-hidden="true" width="27" height="27" decoding="async"><span class="job-label">([^<]+)<\/span><\/span><\/a>/g)];
  for (const row of rows) entries.push({role:group[1],href:row[1],aria:row[2],src:row[3],name:row[4]});
}
if (entries.length !== 21) problems.push("Expected 21 job entries, found "+entries.length);
if (!html.includes("<h1>職業養成學院</h1>")) problems.push("Academy H1 is missing");
if (html.includes('class="job-picker"')) problems.push("Academy job choices must not be collapsed");
if (!html.includes('id="job-learning"') || !html.includes('href="lectures/"') ||
    html.includes('id="lecture-index"') || !lectureHTML.includes('id="lecture-index"'))
  problems.push("Lecture index must be separate from the job academy and linked from its hall");
if (!lectureHTML.includes('id="job-course-filter"') || !lectureHTML.includes('id="job-course-rows"') ||
    !lectureHTML.includes('href="../r005/"') || !lectureHTML.includes('href="../r022/"'))
  problems.push("Separate lecture index lost its existing filter or course links");
if (!html.includes('class="academy-toolbar"') || !html.includes('class="job-grid"') ||
    html.indexOf('class="job-grid"') < html.indexOf('id="job-learning"'))
  problems.push("Academy must show the real career-selection grid beneath its compact navigation");
const academyCSS = await readFile(path.join(root,"pve/courses/courses.css"),"utf8");
const readerCSS = await readFile(path.join(root,"pve/reader.css"),"utf8");
if (/\.academy-hall\s+\.(?:job|jobs|group|job-grid|group-stack)/.test(academyCSS) ||
    !readerCSS.includes(".page-atlas .jobs{column-gap:16px;row-gap:15px}") ||
    !readerCSS.includes(".page-atlas .job{min-height:48px;padding:8px 11px}"))
  problems.push("Approved job atlas button spacing or geometry was overridden/lost");
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
  if (entry.href !== "lectures/?job="+encodeURIComponent(j.name) ||
      !entry.aria.includes("依此職業篩選"))
    problems.push(j.code+": direct lecture-index route missing or wrong");
  if (!lectureHTML.includes('<option value="'+j.name+'">'+j.name+'</option>'))
    problems.push(j.code+": lecture filter is missing this job");
  const asset = path.join(root,"assets","job-"+j.slug+".svg");
  try {
    await access(asset);
    const content = await readFile(asset,"utf8");
    if (!content.includes('viewBox="0 0 100 100"') || !content.includes(j.code+" "+j.iconId)) problems.push(j.code+": source code/id mismatch");
    if (!content.includes('fill="'+j.color+'"')) problems.push(j.code+": wrong role color");
    if ((content.match(/<path\s/g)||[]).length !== 1 || !content.includes('fill-rule="evenodd"')) problems.push(j.code+": not one solid emblem");
    if (/<(?:rect|image|foreignObject|text|canvas)\b/i.test(content)) problems.push(j.code+": icon has non-transparent backing or foreign object");
    if (!content.includes("FINAL FANTASY XIV © SQUARE ENIX")) problems.push(j.code+": copyright credit missing");
    // Source-specific geometry matters: Scholar uses 1000-unit path coords
    // and needs its original 0.1 scale when displayed in a 100-unit viewBox.
    // Check out-of-range opening coordinates for future imports as well.
    const pathTag = content.match(/<path\b[^>]*\/>/s)?.[0] ?? "";
    const opening = pathTag.match(/\bd="\s*[mM]\s*([-+]?\d+(?:\.\d+)?)[,\s]+([-+]?\d+(?:\.\d+)?)/);
    const tr = pathTag.match(/\btransform="([^"]+)"/)?.[1] ?? "";
    if (!opening) problems.push(j.code+": SVG initial path coordinates missing");
    else if ((Math.abs(Number(opening[1])) > 125 || Math.abs(Number(opening[2])) > 125) &&
              !/^scale\(0\.1\)$/.test(tr) && !/^matrix\(0\.099/.test(tr)) {
      problems.push(j.code+": path starts outside viewBox without source scale transform");
    }
    if (j.code === "SCH" && tr !== "scale(0.1)") {
      problems.push("SCH: required source scale(0.1) lost (invisible icon regression)");
    }
  } catch(e) { problems.push(j.code+": missing/unreadable SVG "+String(e)); }
}
if (used.size !== 21) problems.push("SVG filenames aren't all distinct");
if (/<small>\d+ 職<\/small>/.test(html)) problems.push("Role counts must remain hidden");
if (/<small>(?:籌備中|閱讀 →)<\/small>/.test(html)) problems.push("Job status labels must remain hidden");
if (!html.includes("<h2>➕ 治療</h2>")) problems.push("Healer must use medical-cross emoji");
if (html.includes('href="../jobs/ninja/"')) problems.push("Academy must not route through retired Ninja map");
const libraryJS = await readFile(path.join(root,"pve/courses/library.js"),"utf8");
if (!libraryJS.includes("new URLSearchParams(location.search).get('job')") ||
    !libraryJS.includes("history.replaceState"))
  problems.push("Job filter must honor query defaults and shareable URLs");
const retiredNinja = await readFile(path.join(root,"pve/jobs/ninja/index.html"),"utf8");
if (!retiredNinja.includes('http-equiv="refresh"') ||
    !retiredNinja.includes("courses/lectures/?job="+encodeURIComponent("忍者")))
  problems.push("Retired Ninja route must redirect into filtered lectures");
if (problems.length) {
  console.error("FAIL job atlas icons:");
  for (const problem of problems) console.error(" - "+problem);
  process.exitCode = 1;
} else {
  console.log("PASS: 21 visible-geometry job SVGs, correct unlock states, and clean atlas labels.");
}
