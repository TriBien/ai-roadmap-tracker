import { ChangeEvent, useEffect, useRef, useState } from "react";
import { roadmap } from "./lib/roadmap";
import {
  ProgressMap,
  WeekStatus,
  hasAnyProgress,
  loadProgress,
  parseProgressJson,
  saveProgressToStorage,
  serializeProgressJson,
  setWeekNotes,
  setWeekStatus,
  toggleItem,
} from "./lib/progress";
import {
  ProgressFileHandle,
  checkPermission,
  clearStoredHandle,
  isFileSystemAccessSupported,
  loadStoredHandle,
  pickProgressFile,
  readProgressFile,
  requestPermission,
  storeHandle,
  writeProgressFile,
} from "./lib/fileSync";
import { PhaseSection } from "./components/PhaseSection";
import { SummaryBar } from "./components/SummaryBar";

const PROGRESS_FILENAME = "ai-roadmap-tracker.json";
const DOCUMENTS_PATH = "Documents/ai-roadmap-tracker.json";

type SyncState =
  | { kind: "idle" }
  | { kind: "connected"; fileName: string }
  | { kind: "needs-permission"; fileName: string }
  | { kind: "error"; message: string };

export default function App() {
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());
  const [syncState, setSyncState] = useState<SyncState>({ kind: "idle" });
  const fileHandleRef = useRef<ProgressFileHandle | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveProgressToStorage(progress);
  }, [progress]);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      const handle = await loadStoredHandle();
      if (!handle || cancelled) {
        return;
      }
      fileHandleRef.current = handle;
      let permission = await checkPermission(handle);
      if (permission === "prompt") {
        try {
          permission = await requestPermission(handle);
        } catch {
          permission = "prompt";
        }
      }
      if (permission !== "granted") {
        setSyncState({
          kind: "needs-permission",
          fileName: handle.name ?? PROGRESS_FILENAME,
        });
        return;
      }
      try {
        const text = await readProgressFile(handle);
        if (cancelled) {
          return;
        }
        const parsed = text.trim().length > 0 ? parseProgressJson(text) : null;
        if (parsed && hasAnyProgress(parsed)) {
          setProgress(parsed);
        }
        setSyncState({
          kind: "connected",
          fileName: handle.name ?? PROGRESS_FILENAME,
        });
      } catch {
        if (!cancelled) {
          setSyncState({
            kind: "error",
            message: "Could not read the progress file.",
          });
        }
      }
    };
    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (syncState.kind !== "connected") {
      return;
    }
    const handle = fileHandleRef.current;
    if (!handle) {
      return;
    }
    const timer = window.setTimeout(() => {
      void writeProgressFile(handle, serializeProgressJson(progress)).catch(() => {
        setSyncState({
          kind: "error",
          message: "Could not save to the progress file.",
        });
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [progress, syncState]);

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

  const handleConnectFile = async () => {
    if (!isFileSystemAccessSupported()) {
      setSyncState({
        kind: "error",
        message:
          "Direct file access is not supported in this browser. Use Export / Import JSON instead.",
      });
      return;
    }
    try {
      const handle = await pickProgressFile(PROGRESS_FILENAME);
      if (!handle) {
        return;
      }
      await storeHandle(handle);
      fileHandleRef.current = handle;
      let text = "";
      try {
        text = await readProgressFile(handle);
      } catch {
        text = "";
      }
      const parsed = text.trim().length > 0 ? parseProgressJson(text) : null;
      if (parsed && hasAnyProgress(parsed)) {
        setProgress(parsed);
      } else {
        await writeProgressFile(handle, serializeProgressJson(progress));
      }
      setSyncState({
        kind: "connected",
        fileName: handle.name ?? PROGRESS_FILENAME,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setSyncState({
        kind: "error",
        message: "Could not open the progress file.",
      });
    }
  };

  const handleReconnect = async () => {
    const handle = fileHandleRef.current;
    if (!handle) {
      return;
    }
    try {
      const permission = await requestPermission(handle);
      if (permission !== "granted") {
        setSyncState({
          kind: "needs-permission",
          fileName: handle.name ?? PROGRESS_FILENAME,
        });
        return;
      }
      const text = await readProgressFile(handle);
      const parsed = text.trim().length > 0 ? parseProgressJson(text) : null;
      if (parsed && hasAnyProgress(parsed)) {
        setProgress(parsed);
      } else {
        await writeProgressFile(handle, serializeProgressJson(progress));
      }
      setSyncState({
        kind: "connected",
        fileName: handle.name ?? PROGRESS_FILENAME,
      });
    } catch {
      setSyncState({
        kind: "error",
        message: "Could not reconnect to the progress file.",
      });
    }
  };

  const handleDisconnect = async () => {
    fileHandleRef.current = null;
    await clearStoredHandle();
    setSyncState({ kind: "idle" });
  };

  const handleExport = () => {
    const blob = new Blob([serializeProgressJson(progress)], {
      type: "application/json;charset=utf-8",
    });
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
    try {
      const text = await file.text();
      setProgress(parseProgressJson(text));
    } catch {
      window.alert("Could not read that progress file.");
    } finally {
      event.currentTarget.value = "";
    }
  };

  const handleReset = () => {
    setProgress({});
  };

  const syncLabel =
    syncState.kind === "connected"
      ? `Auto-syncing with ${syncState.fileName}`
      : syncState.kind === "needs-permission"
        ? `One-time approval needed: click Reconnect and choose "Allow on every visit" (or install the app) to sync ${syncState.fileName} automatically from now on.`
        : syncState.kind === "error"
          ? syncState.message
          : isFileSystemAccessSupported()
            ? `Not connected. Connect ${DOCUMENTS_PATH} to auto load and save progress.`
            : "Direct file access is not supported in this browser. Use Export / Import JSON.";

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Engineer Roadmap Tracker</h1>
        <p>{roadmap.title}</p>
        <div className="actions">
          <button type="button" onClick={() => void handleConnectFile()}>
            Connect {PROGRESS_FILENAME}
          </button>
          {syncState.kind === "needs-permission" && (
            <button type="button" onClick={() => void handleReconnect()}>
              Reconnect
            </button>
          )}
          {(syncState.kind === "connected" || syncState.kind === "needs-permission") && (
            <button type="button" onClick={() => void handleDisconnect()}>
              Disconnect
            </button>
          )}
          
          <button type="button" onClick={handleReset}>
            Reset
          </button>
          <input
            ref={importInputRef}
            type="file"
            hidden
            accept=".json,application/json"
            onChange={handleImportChange}
          />
        </div>
        <p className={`sync-status sync-${syncState.kind}`}>{syncLabel}</p>
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
          Progress auto-loads and auto-saves to{" "}
          <code>{DOCUMENTS_PATH}</code> once connected and remembered by the
          browser. Install the app (browser menu → Install) to keep file access
          permanently without prompts. Browser storage keeps a fallback copy.
        </p>
      </footer>
    </div>
  );
}
