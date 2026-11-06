interface ProgressFileWritable {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
}

export interface ProgressFileHandle {
  name?: string;
  createWritable: () => Promise<ProgressFileWritable>;
  getFile: () => Promise<File>;
  queryPermission?: (descriptor: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
  requestPermission?: (descriptor: { mode: "read" | "readwrite" }) => Promise<PermissionState>;
}

interface FilePickerOptions {
  suggestedName?: string;
  startIn?: string;
  types?: Array<{ description?: string; accept: Record<string, string[]> }>;
  excludeAcceptAllOption?: boolean;
}

interface PickerWindow extends Window {
  showSaveFilePicker?: (options?: FilePickerOptions) => Promise<ProgressFileHandle>;
  showOpenFilePicker?: (options?: FilePickerOptions) => Promise<ProgressFileHandle[]>;
}

const DB_NAME = "ai-roadmap-tracker";
const STORE_NAME = "handles";
const HANDLE_KEY = "progress-file";

const pickerWindow = (): PickerWindow => window as PickerWindow;

export function isFileSystemAccessSupported(): boolean {
  return typeof pickerWindow().showSaveFilePicker === "function";
}

export async function pickProgressFile(
  suggestedName: string
): Promise<ProgressFileHandle | null> {
  const picker = pickerWindow().showSaveFilePicker;
  if (!picker) {
    return null;
  }
  try {
    return await picker({
      suggestedName,
      startIn: "documents",
      types: [
        {
          description: "AI roadmap tracker progress",
          accept: { "application/json": [".json"] },
        },
      ],
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return null;
    }
    throw error;
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeHandle(handle: ProgressFileHandle): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(handle, HANDLE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch {
    // persistence unavailable; user can reconnect manually
  }
}

export async function loadStoredHandle(): Promise<ProgressFileHandle | null> {
  try {
    const db = await openDatabase();
    const handle = await new Promise<ProgressFileHandle | null>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const request = transaction.objectStore(STORE_NAME).get(HANDLE_KEY);
      request.onsuccess = () =>
        resolve((request.result as ProgressFileHandle | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return handle;
  } catch {
    return null;
  }
}

export async function clearStoredHandle(): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(HANDLE_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

export async function checkPermission(
  handle: ProgressFileHandle
): Promise<PermissionState> {
  if (!handle.queryPermission) {
    return "granted";
  }
  return handle.queryPermission({ mode: "readwrite" });
}

export async function requestPermission(
  handle: ProgressFileHandle
): Promise<PermissionState> {
  if (!handle.requestPermission) {
    return "granted";
  }
  return handle.requestPermission({ mode: "readwrite" });
}

export async function readProgressFile(handle: ProgressFileHandle): Promise<string> {
  const file = await handle.getFile();
  return file.text();
}

export async function writeProgressFile(
  handle: ProgressFileHandle,
  text: string
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}
