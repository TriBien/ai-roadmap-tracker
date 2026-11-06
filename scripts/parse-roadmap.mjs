import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const projectRoot = resolve(process.cwd());
const roadmapPath =
  process.env.ROADMAP_PATH ?? resolve(projectRoot, "ai-engineer-roadmap-28-weeks.md");
const outputPath = resolve(projectRoot, "src/data/roadmap.json");

const content = (await import("node:fs")).readFileSync(roadmapPath, "utf8");
const lines = content.split(/\r?\n/);

const slug = (label) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

let docTitle = "";
let phases = [];
let currentPhase = null;
let currentWeek = null;
let currentSectionKey = null;
let currentSectionLabel = null;

const startPhase = (name) => {
  const phaseNumber = (name.match(/PHASE\s+(\d+)/i)?.[1] ?? phases.length + 1).replace(
    /[^0-9]/g,
    ""
  );
  const phase = {
    id: `p${phaseNumber}`,
    number: Number(phaseNumber),
    name: name.replace(/^PHASE\s+\d+:\s*/i, "").trim(),
    weeks: [],
  };
  phases.push(phase);
  currentPhase = phase;
  return phase;
};

for (const rawLine of lines) {
  const line = rawLine.trimEnd();
  const heading = line.match(/^(#{1,6})\s+(.*)$/);
  if (heading) {
    const level = heading[1].length;
    const text = heading[2].trim();
    if (level === 1 && /PHASE\s+\d+/i.test(text)) {
      startPhase(text);
      currentWeek = null;
      currentSectionKey = null;
      continue;
    }
    if (level === 1) {
      docTitle = text;
      currentWeek = null;
      currentSectionKey = null;
      continue;
    }
    if (level === 2) {
      const weekMatch = text.match(/^Week\s+(\d+):\s*(.*)$/);
      if (weekMatch) {
        currentWeek = {
          id: `p${currentPhase.number}w${weekMatch[1]}`,
          number: Number(weekMatch[1]),
          title: weekMatch[2].trim(),
          sections: [],
        };
        currentPhase.weeks.push(currentWeek);
        currentSectionKey = null;
      } else {
        currentWeek = null;
      }
      continue;
    }
    if (level > 2) {
      currentWeek = null;
      currentSectionKey = null;
      continue;
    }
  }
  const bold = line.match(/^\*\*(.+?)\*\*\s*$/);
  if (bold) {
    currentSectionKey = slug(bold[1]);
    currentSectionLabel = bold[1].trim();
    continue;
  }
  const bullet = line.match(/^\s*[-*]\s+(.+)$/);
  if (bullet && currentWeek) {
    const itemText = bullet[1].trim();
    if (!currentSectionKey) {
      currentWeek.sections.push({ key: "_overview", label: "", items: [itemText] });
      continue;
    }
    const section =
      currentWeek.sections.find((s) => s.key === currentSectionKey) ??
      currentWeek.sections.find((s) => s.label === currentSectionLabel);
    if (section) {
      section.items.push(itemText);
    } else {
      currentWeek.sections.push({ key: currentSectionKey, label: currentSectionLabel, items: [itemText] });
    }
  }
}

const roadmap = { title: docTitle, phases };
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(roadmap, null, 2) + "\n", "utf8");

console.log(`Parsed ${roadmap.phases.length} phases from ${roadmapPath}`);
