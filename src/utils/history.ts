const STORAGE_KEY = 'analysisHistory';
const MAX_ENTRIES = 20;
const WARN_THRESHOLD = 15;

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  overall: number;
  sectionScores: {
    hero: number;
    ctas: number;
    forms: number;
    seo: number;
    accessibility: number;
    socialProof: number;
  };
  timestamp: number;
  data: unknown;
  score: unknown;
  analysis?: unknown;
}

function generateId(url: string): string {
  const ts = Date.now().toString(36);
  const hash = Array.from(url).reduce((acc, c) => acc + c.charCodeAt(0), 0).toString(36);
  return `${hash}-${ts}`;
}

function stripHeavyFields(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const d = { ...data } as Record<string, unknown>;
  delete d.screenshot;
  delete d.sectionScreenshots;
  delete d.html;
  return d;
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export function addEntry(
  url: string,
  title: string,
  overall: number,
  sectionScores: HistoryEntry['sectionScores'],
  data: unknown,
  score: unknown,
  analysis?: unknown,
): { evicted: boolean; nearLimit: boolean; count: number; saved: boolean } {
  const entries = getHistory();

  const existingIndex = entries.findIndex(e => e.url === url);
  if (existingIndex !== -1) {
    entries.splice(existingIndex, 1);
  }

  const entry: HistoryEntry = {
    id: generateId(url),
    url,
    title,
    overall,
    sectionScores,
    timestamp: Date.now(),
    data: stripHeavyFields(data),
    score,
    analysis,
  };

  entries.unshift(entry);

  let evicted = false;
  while (entries.length > MAX_ENTRIES) {
    entries.pop();
    evicted = true;
  }

  const saved = saveHistory(entries);

  return {
    evicted,
    nearLimit: entries.length >= WARN_THRESHOLD,
    count: entries.length,
    saved,
  };
}

export function removeEntry(id: string): boolean {
  const entries = getHistory().filter(e => e.id !== id);
  return saveHistory(entries);
}

export function clearAll(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function getEntry(id: string): HistoryEntry | undefined {
  return getHistory().find(e => e.id === id);
}

export function updateEntry(id: string, updates: Partial<HistoryEntry>): boolean {
  const entries = getHistory();
  const index = entries.findIndex(e => e.id === id);
  if (index === -1) return false;
  entries[index] = { ...entries[index], ...updates };
  return saveHistory(entries);
}
