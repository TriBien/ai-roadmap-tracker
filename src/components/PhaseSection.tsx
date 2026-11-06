import { RoadmapPhase } from "../lib/roadmap";
import { ProgressMap, WeekStatus, weekKey } from "../lib/progress";
import { WeekCard } from "./WeekCard";

interface PhaseSectionProps {
  phase: RoadmapPhase;
  progress: ProgressMap;
  onStatusChange: (phaseId: string, weekNumber: number, status: WeekStatus) => void;
  onNotesChange: (phaseId: string, weekNumber: number, notes: string) => void;
  onToggleItem: (
    phaseId: string,
    weekNumber: number,
    sectionKey: string,
    itemIndex: number
  ) => void;
}

export function PhaseSection({
  phase,
  progress,
  onStatusChange,
  onNotesChange,
  onToggleItem,
}: PhaseSectionProps) {
  const completedCount = phase.weeks.filter(
    (w) => progress[weekKey(phase.id, w.number)]?.status === "completed"
  ).length;
  const pct =
    phase.weeks.length > 0
      ? Math.round((completedCount / phase.weeks.length) * 100)
      : 0;

  return (
    <section className="phase-card">
      <div className="phase-header">
        <div>
          <h2>
            Phase {phase.number}: {phase.name}
          </h2>
          <p>
            {phase.weeks.length} weeks · {completedCount} completed
          </p>
        </div>
        <div
          className="phase-progress"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Phase ${phase.number} completion`}
        >
          <div className="phase-progress-bar" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {phase.weeks.map((week) => (
        <WeekCard
          key={week.id}
          phase={phase}
          week={week}
          progress={progress}
          onStatusChange={onStatusChange}
          onNotesChange={onNotesChange}
          onToggleItem={onToggleItem}
        />
      ))}
    </section>
  );
}
