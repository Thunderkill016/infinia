// V2 foundation: save tương thích V1 (đọc được file infinia_save_v1 cũ).
// Strangler migration: giữ nguyên schema + key, migrate dần dần, không crash với save lạ.
export const SAVE_KEY = 'infinia_save_v1';
export const SAVE_VERSION = 1;

export interface VillageProgress {
  gieng: boolean;
  cau: boolean;
  den: boolean;
}

export interface RecordStats {
  fish: number;
  boss: number;
}

/** Schema save V1 — cho phép field quest thừa (q2..q5...) để tương thích xuôi. */
export interface V1Save {
  v: number;
  x: number;
  z: number;
  inf: number;
  lv: number;
  xp: number;
  talked: number[];
  questDone: boolean;
  hp: number;
  shop: { shoes: boolean; charm: boolean };
  vil: VillageProgress;
  stats: RecordStats;
  [key: string]: unknown;
}

export function defaultSave(): V1Save {
  return {
    v: SAVE_VERSION,
    x: 0,
    z: 34,
    inf: 0,
    lv: 1,
    xp: 0,
    talked: [],
    questDone: false,
    hp: 100,
    shop: { shoes: false, charm: false },
    vil: { gieng: false, cau: false, den: false },
    stats: { fish: 0, boss: 0 },
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

/** Chuẩn hoá save lạ/cũ về schema hợp lệ — không bao giờ throw. */
export function migrate(raw: unknown): V1Save {
  const d = defaultSave();
  if (!isRecord(raw) || raw['v'] !== SAVE_VERSION) return d;
  const shop = isRecord(raw['shop']) ? raw['shop'] : {};
  const vil = isRecord(raw['vil']) ? raw['vil'] : {};
  const stats = isRecord(raw['stats']) ? raw['stats'] : {};
  return {
    ...d,
    x: num(raw['x'], d.x),
    z: num(raw['z'], d.z),
    inf: Math.max(0, num(raw['inf'], 0)),
    lv: Math.max(1, num(raw['lv'], 1)),
    xp: Math.max(0, num(raw['xp'], 0)),
    talked: Array.isArray(raw['talked']) ? raw['talked'].filter((n) => Number.isInteger(n)) : [],
    questDone: raw['questDone'] === true,
    hp: num(raw['hp'], 100),
    shop: { shoes: shop['shoes'] === true, charm: shop['charm'] === true },
    vil: { gieng: vil['gieng'] === true, cau: vil['cau'] === true, den: vil['den'] === true },
    stats: {
      fish: Math.max(0, Math.trunc(num(stats['fish'], 0))),
      boss: Math.max(0, Math.trunc(num(stats['boss'], 0))),
    },
  };
}

export interface Store {
  get(key: string): string | null;
  set(key: string, value: string): void;
  del(key: string): void;
}

function browserStore(): Store | null {
  try {
    localStorage.setItem('__infinia_probe', '1');
    localStorage.removeItem('__infinia_probe');
    return {
      get: (k) => localStorage.getItem(k),
      set: (k, v) => { localStorage.setItem(k, v); },
      del: (k) => { localStorage.removeItem(k); },
    };
  } catch {
    return null; // môi trường chặn storage → rơi về bộ nhớ phiên
  }
}

/** Store dùng được cả khi browser chặn storage (giống V1 core.js). */
export function createStore(): Store {
  const mem: Record<string, string> = {};
  const browser = browserStore();
  if (browser) return browser;
  return {
    get: (k) => (k in mem ? mem[k] : null),
    set: (k, v) => { mem[k] = v; },
    del: (k) => { delete mem[k]; },
  };
}

export function loadSave(store: Store): V1Save {
  try {
    const raw = store.get(SAVE_KEY);
    if (!raw) return defaultSave();
    return migrate(JSON.parse(raw) as unknown);
  } catch {
    return defaultSave(); // save hỏng: chơi mới, không crash
  }
}

export function writeSave(store: Store, save: V1Save): void {
  try {
    store.set(SAVE_KEY, JSON.stringify({ ...save, v: SAVE_VERSION }));
  } catch {
    /* bỏ qua: chơi tiếp, chỉ mất phiên */
  }
}
