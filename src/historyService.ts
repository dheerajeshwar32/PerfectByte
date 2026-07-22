export interface HistoryEntry {
  id: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  timestamp: number;
}

const HISTORY_KEY = 'perfectbyte:history';
const MAX_ENTRIES = 50;

/** Reads all saved history entries, most recent first. Never throws. */
export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

/** Records a completed compression. Fails silently if storage is unavailable. */
export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
  try {
    const entryWithId: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };
    const updated = [entryWithId, ...getHistory()].slice(0, MAX_ENTRIES);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // localStorage can throw in private browsing or when full - safe to ignore
  }
}

/** Aggregate stats across all saved history, for a "total saved" display. */
export function getHistoryStats(): { totalOriginal: number; totalCompressed: number; count: number } {
  return getHistory().reduce(
    (acc, entry) => ({
      totalOriginal: acc.totalOriginal + entry.originalSize,
      totalCompressed: acc.totalCompressed + entry.compressedSize,
      count: acc.count + 1,
    }),
    { totalOriginal: 0, totalCompressed: 0, count: 0 }
  );
}

/** Clears all saved history. */
export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
