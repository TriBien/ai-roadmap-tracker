import { useEffect, useRef, useState } from "react";
import { RoadmapPhase, RoadmapWeek } from "../lib/roadmap";
import {
  ProgressMap,
  WeekState,
  WeekStatus,
  WEEK_STATUSES,
  getWeekState,
  isItemChecked,
  itemKey,
} from "../lib/progress";

interface WeekCardProps {
  phase: RoadmapPhase;
  week: RoadmapWeek;
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

export function WeekCard({
  phase,
  week,
  progress,
  onStatusChange,
  onNotesChange,
  onToggleItem,
}: WeekCardProps) {
  const state: WeekState = getWeekState(progress, phase.id, week.number);
  const [expanded, setExpanded] = useState(false);
  const previousStatus = useRef(state.status);

  useEffect(() => {
    if (previousStatus.current !== "completed" && state.status === "completed") {
      setExpanded(false);
    }
    previousStatus.current = state.status;
  }, [state.status]);

  return (
    <div className="week-card">
      <button
        className="week-header"
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span className="week-title">
          Week {week.number}: {week.title}
        </span>
        <span className={`status-pill status-${state.status}`}>{state.status}</span>
        <span className="week-chevron">{expanded ? "▾" : "▸"}</span>
      </button>
      {expanded && (
        <div className="week-body">
          <div className="week-controls">
            <label htmlFor={`status-${week.id}`}>Status</label>
            <select
              id={`status-${week.id}`}
              value={state.status}
              onChange={(e) =>
                onStatusChange(phase.id, week.number, e.target.value as WeekStatus)
              }
            >
              {WEEK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {week.sections.map((section) => (
            <div className="week-section" key={section.key}>
              <h4>{section.label}</h4>
              <ul className="item-list">
                {section.items.map((item, itemIndex) => {
                  const checked = isItemChecked(
                    progress,
                    phase.id,
                    week.number,
                    section.key,
                    itemIndex
                  );
                  const key = itemKey(phase.id, week.number, section.key, itemIndex);
                  return (
                    <li key={key} className={checked ? "item checked" : "item"}>
                      <label>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            onToggleItem(phase.id, week.number, section.key, itemIndex)
                          }
                        />
                        <span>{item}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div className="week-notes">
            <label htmlFor={`notes-${week.id}`}>Notes</label>
            <textarea
              id={`notes-${week.id}`}
              rows={3}
              value={state.notes}
              placeholder="Decisions, links, blockers, next steps..."
              onChange={(e) => onNotesChange(phase.id, week.number, e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
