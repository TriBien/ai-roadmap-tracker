import { roadmap } from "../lib/roadmap";
import { ProgressMap, weekKey } from "../lib/progress";

export function SummaryBar({ progress }: { progress: ProgressMap }) {
  const weeks = roadmap.phases.flatMap((phase) =>
    phase.weeks.map((week) => ({ phase, week }))
  );
  const totalWeeks = weeks.length;
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  let checkedItems = 0;
  let totalItems = 0;

  for (const { phase, week } of weeks) {
    const state = progress[weekKey(phase.id, week.number)];
    const status = state?.status ?? "not-started";
    if (status === "completed") {
      completed += 1;
    } else if (status === "in-progress") {
      inProgress += 1;
    } else {
      notStarted += 1;
    }
    for (const section of week.sections) {
      for (let i = 0; i < section.items.length; i += 1) {
        totalItems += 1;
        const key = `${phase.id}|${week.number}|${section.key}|${i}`;
        if (state?.checkedItems.includes(key)) {
          checkedItems += 1;
        }
      }
    }
  }

  const pct = totalWeeks > 0 ? Math.round((completed / totalWeeks) * 100) : 0;

  const stats = [
    { label: "Weeks completed", value: `${completed}/${totalWeeks}` },
    { label: "In progress", value: String(inProgress) },
    { label: "Not started", value: String(notStarted) },
    { label: "Items checked", value: `${checkedItems}/${totalItems}` },
    { label: "Roadmap completion", value: `${pct}%` },
  ];

  return (
    <div className="summary-bar">
      {stats.map((s) => (
        <div className="stat-card" key={s.label}>
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
