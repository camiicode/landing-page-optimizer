import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Mock localStorage ──────────────────────────────────────────────
const store: Record<string, string> = {};
let quotaExceeded = false;

const mockStorage: Storage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    if (quotaExceeded) {
      const err = new Error('QuotaExceededError');
      err.name = 'QuotaExceededError';
      throw err;
    }
    store[key] = value;
  }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { for (const k in store) delete store[k]; }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
};

// ── Módulo bajo test ───────────────────────────────────────────────
// Las importaciones dinámicas son necesarias porque localStorage se
// configura antes de importar el módulo
async function getModule() {
  vi.stubGlobal('localStorage', mockStorage);
  return await import('../history');
}

beforeEach(() => {
  for (const k in store) delete store[k];
  quotaExceeded = false;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function makeData(overrides: Record<string, unknown> = {}) {
  return {
    url: 'https://example.com',
    title: 'Test Page',
    description: 'A test page description',
    language: 'en',
    charset: 'utf-8',
    html: '<html><body>raw html content</body></html>',
    text: 'raw text content',
    screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    sectionScreenshots: {
      hero: 'data:image/png;base64,cHJldGVuZGVk',
      ctas: ['data:image/png;base64,Y3Rh'],
    },
    headings: [{ level: 1, text: 'Hi' }],
    images: [],
    links: [],
    forms: [],
    ctas: [],
    meta: {},
    statusCode: 200,
    timestamp: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeScore(overrides: Record<string, unknown> = {}) {
  return {
    overall: 75,
    sections: { hero: 80, ctas: 60, forms: 40, seo: 90, accessibility: 70, socialProof: 50 },
    details: {},
    sectionMessages: {},
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────

describe('getHistory', () => {
  it('returns empty array when nothing stored', async () => {
    const { getHistory } = await getModule();
    expect(getHistory()).toEqual([]);
  });

  it('returns stored entries', async () => {
    const { getHistory, addEntry } = await getModule();
    addEntry('https://a.com', 'A', 50, { hero: 50, ctas: 50, forms: 50, seo: 50, accessibility: 50, socialProof: 50 }, {}, {});
    expect(getHistory()).toHaveLength(1);
    expect(getHistory()[0].url).toBe('https://a.com');
  });

  it('handles corrupted JSON gracefully', async () => {
    const { getHistory } = await getModule();
    store['analysisHistory'] = '{broken json;;;}';
    expect(getHistory()).toEqual([]);
  });
});

describe('addEntry', () => {
  it('adds entry at the front', async () => {
    const { addEntry, getHistory } = await getModule();
    addEntry('https://a.com', 'A', 50, { hero: 50, ctas: 50, forms: 50, seo: 50, accessibility: 50, socialProof: 50 }, {}, {});
    addEntry('https://b.com', 'B', 80, { hero: 80, ctas: 80, forms: 80, seo: 80, accessibility: 80, socialProof: 80 }, {}, {});
    expect(getHistory()[0].url).toBe('https://b.com');
    expect(getHistory()[1].url).toBe('https://a.com');
  });

  it('deduplicates entries with the same URL', async () => {
    const { addEntry, getHistory } = await getModule();
    addEntry('https://a.com', 'A', 50, { hero: 50, ctas: 50, forms: 50, seo: 50, accessibility: 50, socialProof: 50 }, {}, {});
    addEntry('https://a.com', 'A v2', 90, { hero: 90, ctas: 90, forms: 90, seo: 90, accessibility: 90, socialProof: 90 }, {}, {});
    expect(getHistory()).toHaveLength(1);
    expect(getHistory()[0].overall).toBe(90);
  });

  it('evicts oldest entry when exceeding 20', async () => {
    const { addEntry, getHistory } = await getModule();
    for (let i = 0; i < 21; i++) {
      addEntry(`https://site${i}.com`, `Site ${i}`, 50, { hero: 50, ctas: 50, forms: 50, seo: 50, accessibility: 50, socialProof: 50 }, {}, {});
    }
    expect(getHistory()).toHaveLength(20);
    // The first one added (site0) should be evicted
    expect(getHistory().find(e => e.url === 'https://site0.com')).toBeUndefined();
  });

  it('returns evicted=true when entry is evicted', async () => {
    const { addEntry } = await getModule();
    let result;
    for (let i = 0; i < 20; i++) {
      addEntry(`https://site${i}.com`, `Site ${i}`, 50, { hero: 50, ctas: 50, forms: 50, seo: 50, accessibility: 50, socialProof: 50 }, {}, {});
    }
    result = addEntry('https://new.com', 'New', 50, { hero: 50, ctas: 50, forms: 50, seo: 50, accessibility: 50, socialProof: 50 }, {}, {});
    expect(result.evicted).toBe(true);
  });

  it('returns nearLimit=true when count >= 15', async () => {
    const { addEntry } = await getModule();
    let result;
    for (let i = 0; i < 14; i++) {
      addEntry(`https://site${i}.com`, `Site ${i}`, 50, { hero: 50, ctas: 50, forms: 50, seo: 50, accessibility: 50, socialProof: 50 }, {}, {});
    }
    result = addEntry('https://site14.com', 'Site 14', 50, { hero: 50, ctas: 50, forms: 50, seo: 50, accessibility: 50, socialProof: 50 }, {}, {});
    expect(result.nearLimit).toBe(true);
    expect(result.count).toBe(15);
  });

  it('does not store heavy base64 fields in data', async () => {
    const { addEntry, getHistory } = await getModule();
    const data = makeData();
    addEntry('https://example.com', 'Test', 75, { hero: 80, ctas: 60, forms: 40, seo: 90, accessibility: 70, socialProof: 50 }, data, {});
    const stored = getHistory()[0].data as Record<string, unknown>;
    expect(stored).not.toHaveProperty('screenshot');
    expect(stored).not.toHaveProperty('sectionScreenshots');
    expect(stored).not.toHaveProperty('html');
    // Other fields should be preserved
    expect(stored).toHaveProperty('title');
    expect(stored).toHaveProperty('description');
    expect(stored).toHaveProperty('text');
  });

  it('returns saved=false when localStorage is full', async () => {
    quotaExceeded = true;
    const { addEntry } = await getModule();
    const result = addEntry('https://example.com', 'Test', 50, { hero: 50, ctas: 50, forms: 50, seo: 50, accessibility: 50, socialProof: 50 }, {}, {});
    expect(result.saved).toBe(false);
  });
});

describe('removeEntry', () => {
  it('removes entry by id', async () => {
    const { addEntry, getHistory, removeEntry } = await getModule();
    addEntry('https://a.com', 'A', 50, { hero: 50, ctas: 50, forms: 50, seo: 50, accessibility: 50, socialProof: 50 }, {}, {});
    const id = getHistory()[0].id;
    removeEntry(id);
    expect(getHistory()).toHaveLength(0);
  });
});

describe('clearAll', () => {
  it('clears all entries', async () => {
    const { addEntry, getHistory, clearAll } = await getModule();
    addEntry('https://a.com', 'A', 50, { hero: 50, ctas: 50, forms: 50, seo: 50, accessibility: 50, socialProof: 50 }, {}, {});
    clearAll();
    expect(getHistory()).toEqual([]);
  });
});

describe('updateEntry', () => {
  it('updates specific fields on an entry', async () => {
    const { addEntry, getHistory, updateEntry } = await getModule();
    addEntry('https://a.com', 'A', 50, { hero: 50, ctas: 50, forms: 50, seo: 50, accessibility: 50, socialProof: 50 }, {}, {});
    const id = getHistory()[0].id;
    updateEntry(id, { overall: 99 });
    expect(getHistory()[0].overall).toBe(99);
  });
});
