import { ChangeEvent, useEffect, useRef, useState } from "react";
import { roadmap } from "./lib/roadmap";
import {
  ProgressMap,
  WeekStatus,
  loadProgress,
  saveProgressToStorage,
  serializeProgressMarkdown,
  parseProgressMarkdown,
  setWeekNotes,
  setWeekStatus,
  toggleItem,
} from "./lib/progress";
import { PhaseSection } from "./components/PhaseSection";
import { SummaryBar } from "./components/SummaryBar";

const PROGRESS_FILENAME = "ai-engineer-roadmap-progress.md";

interface FileSystemWritable {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
}

interface FileSystemFileHandle {
  name?: string;
  createWritable: () => Promise<FileSystemWritable>;
  getFile: () => Promise<File>;
}

const asFileSystemFileHandle = (value: unknown): FileSystemFileHandle | null =>
  value && typeof value === "object"
    ? (value as FileSystemFileHandle)
    : null;

export default function App() {
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [syncedFileName, setSyncedFileName] = useState<string | null>(null);

  useEffect(() => {
    saveProgressToStorage(progress);
  }, [progress]);

  useEffect(() => {
    const handle = fileHandleRef.current;
    if (!handle) {
      return;
    }
    let cancelled = false;
    const run = async () => {
      const writable = await handle.createWritable();
      if (cancelled) {
        try {
          await writable.close();
        } catch {
          // ignore close errors after cancel
        }
        return;
      }
      await writable.write(serializeProgressMarkdown(progress));
      await writable.close();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [progress]);

  const handleStatusChange = (phaseId: string, weekNumber: number, status: WeekStatus) => {
    setProgress((prev) => setWeekStatus(prev, phaseId, weekNumber, status));
  };

  const handleNotesChange = (phaseId: string, weekNumber: number, notes: string) => {
    setProgress((prev) => setWeekNotes(prev, phaseId, weekNumber, notes));
  };

  const handleToggleItem = (
    phaseId: string,
    weekNumber: number,
    sectionKey: string,
    itemIndex: number
  ) => {
    setProgress((prev) =>
      toggleItem(prev, phaseId, weekNumber, sectionKey, itemIndex)
    );
  };

  const handleExport = () => {
    const text = serializeProgressMarkdown(progress);
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = PROGRESS_FILENAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    setProgress(parseProgressMarkdown(text));
    event.currentTarget.value = "";
  };

  const handleOpenLocalFile = async () => {
    const w = window as unknown as {
      showOpenFilePicker?: (options: unknown) => Promise<unknown[]>;
    };
    const picker = w.showOpenFilePicker;
    if (typeof picker !== "function") {
      window.alert(
        "The File System Access API is not supported in this browser. Use Export / Import instead."
      );
      return;
    }
    const handles = (await picker({
      types: [
        {
          description: "AI roadmap progress file",
          accept: { "text/markdown": [".md"], "text/plain": [".txt"] },
        },
      ],
    })) as unknown[];
    const handle = asFileSystemFileHandle(handles[0]);
    if (!handle) {
      return;
    }
    fileHandleRef.current = handle;
    const file = await handle.getFile();
    const text = await file.text();
    setProgress(parseProgressMarkdown(text));
    setSyncedFileName(handle.name ?? PROGRESS_FILENAME);
  };

  const handleSaveLocalFile = async () => {
    const w = window as unknown as {
      showSaveFilePicker?: (options: unknown) => Promise<unknown[]>;
    };
    const picker = w.showSaveFilePicker;
    if (typeof picker !== "function") {
      window.alert(
        "The File System Access API is not supported in this browser. Use Export / Import instead."
      );
      return;
    }
    let handle = fileHandleRef.current;
    if (!handle) {
      const handles = (await picker({
        types: [
          {
            description: "AI roadmap progress file",
            accept: { "text/markdown": [".md"], "text/plain": [".txt"] },
          },
        ],
      })) as unknown[];
      handle = asFileSystemFileHandle(handles[0]);
      if (!handle) {
        return;
      }
      fileHandleRef.current = handle;
    }
    const writable = await handle.createWritable();
    await writable.write(serializeProgressMarkdown(progress));
    await writable.close();
    setSyncedFileName(handle.name ?? PROGRESS_FILENAME);
  };

  const handleReset = () => {
    setProgress({});
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Engineer Roadmap Tracker</h1>
        <p>{roadmap.title}</p>
        <div className="actions">
          <button type="button" onClick={handleExport}>
            Export progress (.md)
          </button>
          <button type="button" onClick={() => importInputRef.current?.click()}>
            Import progress
          </button>
          <button type="button" onClick={() => void handleOpenLocalFile()}>
            Open local file
          </button>
          <button type="button" onClick={() => void handleSaveLocalFile()}>
            Save local file
          </button>
          <button type="button" onClick={handleReset}>
            Reset
          </button>
          <input
            ref={importInputRef}
            type="file"
            hidden
            accept=".md,.markdown,.txt,.json,text/markdown,text/plain,application/json"
            onChange={handleImportChange}
          />
        </div>
        <p className="sync-status">
          {syncedFileName
            ? `Synced with local file: ${syncedFileName}`
            : "No local progress file open. Progress is stored in browser storage only — use Export / Open to sync."}
        </p>
      </header>
      <SummaryBar progress={progress} />
      {roadmap.phases.map((phase) => (
        <PhaseSection
          key={phase.id}
          phase={phase}
          progress={progress}
          onStatusChange={handleStatusChange}
          onNotesChange={handleNotesChange}
          onToggleItem={handleToggleItem}
        />
      ))}
      <footer className="app-footer">
        <p>
          Progress source: <code>ai-engineer-roadmap-28-weeks.md</code>. Local text file
          format: markdown with <code>- status:</code>, <code>- note:</code> and{" "}
          <code>- [x] ...</code> entries.
        </p>
      </footer>
    </div>
  );
}
