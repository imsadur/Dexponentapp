"use client";
/**
 * Keeps uploaded DTF documents in this browser (IndexedDB), so LPs can open them from the DTF
 * page. There is no backend yet: files live only on the device that uploaded them.
 * TODO(backend): replace with real document storage and signed download URLs.
 */
const DB = "fm-documents";
const STORE = "files";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export const docKey = (farmId: string, docId: string) => `${farmId}:${docId}`;
export const saveDocFile = (key: string, file: Blob) => run("readwrite", (s) => s.put(file, key));
export const loadDocFile = (key: string) => run<Blob | undefined>("readonly", (s) => s.get(key));
export const deleteDocFile = (key: string) => run("readwrite", (s) => s.delete(key));

/** Types a browser can show in a tab; everything else is downloaded. */
export const isPreviewable = (type: string) => ["PDF", "PNG", "JPG", "JPEG", "GIF", "WEBP", "SVG", "TXT", "CSV"].includes(type.toUpperCase());

/**
 * Opens a stored document in a new tab, or downloads it when the browser can't display it.
 * The tab is opened before the async read so popup blockers treat it as a user action.
 */
export async function openDocFile(key: string, name: string, type: string): Promise<boolean> {
  const preview = isPreviewable(type);
  const tab = preview ? window.open("", "_blank") : null;
  const file = await loadDocFile(key).catch(() => undefined);
  if (!file) {
    tab?.close();
    return false;
  }
  const url = URL.createObjectURL(file);
  if (preview && tab) {
    tab.location.href = url;
  } else {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
