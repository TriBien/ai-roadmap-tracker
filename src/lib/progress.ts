import { roadmap } from "./roadmap";

export type WeekStatus = "not-started" | "in-progress" | "completed";

export const WEEK_STATUSES: readonly WeekStatus[] = [
  "not-started",
  "in-progress",
  "completed",
];

export interface WeekState {
  status: WeekStatus;
  notes: string;
  checkedItems: string[];
}

export type ProgressMap = Record<string, WeekState>;

export const weekKey = (phaseId: string, weekNumber: number): string =>
  `${phaseId}:${weekNumber}`;

const STORAGE_KEY = "ai-roadmap-tracker.progress.v1";

export function defaultWeekState(): WeekState {
  return { status: "not-started", notes: "", checkedItems: [] };
}

export function loadProgress(): ProgressMap {
  const progress: ProgressMap = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return progress;
    }
    const parsed = JSON.parse(raw) as ProgressMap;
    for (const phase of roadmap.phases) {
      for (const week of phase.weeks) {
        const key = weekKey(phase.id, week.number);
        progress[key] = parsed[key] ?? defaultWeekState();
      }
    }
  } catch {
    return {};
  }
  return progress;
}

export function saveProgressToStorage(progress: ProgressMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // local storage unavailable; progress simply will not persist
  }
}

export function getWeekState(
  progress: ProgressMap,
  phaseId: string,
  weekNumber: number
): WeekState {
  return progress[weekKey(phaseId, weekNumber)] ?? defaultWeekState();
}

export function setWeekStatus(
  progress: ProgressMap,
  phaseId: string,
  weekNumber: number,
  status: WeekStatus
): ProgressMap {
  const key = weekKey(phaseId, weekNumber);
  const state = progress[key] ?? defaultWeekState();
  return { ...progress, [key]: { ...state, status } };
}

export function setWeekNotes(
  progress: ProgressMap,
  phaseId: string,
  weekNumber: number,
  notes: string
): ProgressMap {
  const key = weekKey(phaseId, weekNumber);
  const state = progress[key] ?? defaultWeekState();
  return { ...progress, [key]: { ...state, notes } };
}

export function itemKey(
  phaseId: string,
  weekNumber: number,
  sectionKey: string,
  itemIndex: number
): string {
  return `${phaseId}|${weekNumber}|${sectionKey}|${itemIndex}`;
}

export function toggleItem(
  progress: ProgressMap,
  phaseId: string,
  weekNumber: number,
  sectionKey: string,
  itemIndex: number
): ProgressMap {
  const key = weekKey(phaseId, weekNumber);
  const item = itemKey(phaseId, weekNumber, sectionKey, itemIndex);
  const state = progress[key] ?? defaultWeekState();
  const checkedItems = state.checkedItems.includes(item)
    ? state.checkedItems.filter((k) => k !== item)
    : [...state.checkedItems, item];
  return { ...progress, [key]: { ...state, checkedItems } };
}

export function isItemChecked(
  progress: ProgressMap,
  phaseId: string,
  weekNumber: number,
  sectionKey: string,
  itemIndex: number
): boolean {
  const state = progress[weekKey(phaseId, weekNumber)];
  if (!state) {
    return false;
  }
  return state.checkedItems.includes(
    itemKey(phaseId, weekNumber, sectionKey, itemIndex)
  );
}

function normalizeStatus(value: string): WeekStatus {
  const v = value.trim().toLowerCase();
  if (v === "in-progress" || v === "inprogress") {
    return "in-progress";
  }
  if (v === "completed" || v === "complete" || v === "done") {
    return "completed";
  }
  return "not-started";
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function serializeProgressMarkdown(progress: ProgressMap): string {
  const blocks: string[] = ["# AI Engineer Roadmap Progress", ""];
  for (const phase of roadmap.phases) {
    blocks.push(`## Phase ${phase.number}: ${phase.name}`, "");
    for (const week of phase.weeks) {
      const state = progress[weekKey(phase.id, week.number)] ?? defaultWeekState();
      blocks.push(`### Week ${week.number}: ${week.title}`, "");
      blocks.push(`- status: ${state.status}`);
      if (state.notes.trim().length > 0) {
        blocks.push(`- note: ${state.notes.trim()}`);
      }
      for (const section of week.sections) {
        for (let i = 0; i < section.items.length; i++) {
          if (state.checkedItems.includes(itemKey(phase.id, week.number, section.key, i))) {
            blocks.push(`- [x] ${section.items[i]}`);
          }
        }
      }
      blocks.push("");
    }
  }
  return blocks.join("\n");
}

export function parseProgressMarkdown(text: string): ProgressMap {
  const progress: ProgressMap = {};
  let phaseNumber: number | null = null;
  let weekNumber: number | null = null;
  let status: WeekStatus = "not-started";
  let notes = "";
  let checkedItems: string[] = [];

  const flush = () => {
    if (phaseNumber === null || weekNumber === null) {
      return;
    }
    const phase = roadmap.phases.find((p) => p.number === phaseNumber);
    const week = phase?.weeks.find((w) => w.number === weekNumber);
    if (!phase || !week) {
      return;
    }
    progress[weekKey(phase.id, week.number)] = {
      status,
      notes,
      checkedItems,
    };
  };

  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    const phaseMatch = line.match(/^##\s+Phase\s+(\d+)\s*:\s*(.*)$/);
    if (phaseMatch) {
      flush();
      phaseNumber = Number(phaseMatch[1]);
      weekNumber = null;
      status = "not-started";
      notes = "";
      checkedItems = [];
      continue;
    }
    const weekMatch = line.match(/^###\s+Week\s+(\d+)\s*:\s*(.*)$/);
    if (weekMatch) {
      flush();
      weekNumber = Number(weekMatch[1]);
      status = "not-started";
      notes = "";
      checkedItems = [];
      continue;
    }
    const statusMatch = line.match(/^-\s*status:\s*(.+)$/);
    if (statusMatch) {
      status = normalizeStatus(statusMatch[1]);
      continue;
    }
    const noteMatch = line.match(/^-\s*note:\s*(.*)$/);
    if (noteMatch) {
      notes = noteMatch[1].trim();
      continue;
    }
    const checkMatch = line.match(/^-\s\[([ xX])\]\s+(.+)$/);
    if (checkMatch) {
      const phase = roadmap.phases.find((p) => p.number === phaseNumber);
      const week = phase?.weeks.find((w) => w.number === weekNumber);
      if (phase && week) {
        for (const section of week.sections) {
          const itemIndex = section.items.findIndex(
            (item) => normalizeText(item) === normalizeText(checkMatch[2])
          );
          if (itemIndex >= 0) {
            checkedItems.push(
              itemKey(phase.id, week.number, section.key, itemIndex)
            );
          }
        }
      }
      continue;
    }
  }
  flush();
  return progress;
}
