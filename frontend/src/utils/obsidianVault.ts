// File System Access API helpers for Obsidian vault integration

const IDB_NAME = "studyai";
const IDB_STORE = "handles";
const IDB_KEY = "obsidian-vault";

export function isSupported(): boolean {
  return typeof (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker === "function";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(handle, IDB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readonly");
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function pickVaultFolder(): Promise<{ name: string }> {
  const picker = (window as unknown as { showDirectoryPicker: (opts: object) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker;
  const handle = await picker({ mode: "readwrite" });
  await saveHandle(handle);
  return { name: handle.name };
}

type PermissionHandle = {
  queryPermission(opts: { mode: string }): Promise<PermissionState>;
  requestPermission(opts: { mode: string }): Promise<PermissionState>;
};

export async function getSavedVault(): Promise<{ handle: FileSystemDirectoryHandle; name: string } | null> {
  try {
    const handle = await loadHandle();
    if (!handle) return null;
    const ph = handle as unknown as PermissionHandle;
    const perm = await ph.queryPermission({ mode: "readwrite" });
    if (perm === "granted") return { handle, name: handle.name };
    const granted = await ph.requestPermission({ mode: "readwrite" });
    if (granted === "granted") return { handle, name: handle.name };
    return null;
  } catch {
    return null;
  }
}

export async function writeNote(
  handle: FileSystemDirectoryHandle,
  filename: string,
  markdown: string
): Promise<void> {
  const dir = await handle.getDirectoryHandle("StudyAI", { create: true });
  const file = await dir.getFileHandle(filename, { create: true });
  const writable = await file.createWritable();
  await writable.write(markdown);
  await writable.close();
}

export function obsidianUri(vaultName: string, stem: string): string {
  return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent("StudyAI/" + stem)}`;
}

export function safeFilename(title: string | undefined): string {
  const clean = (title ?? "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
  return clean || "nota";
}
