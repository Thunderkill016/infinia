import { describe, expect, it } from 'vitest';
import { createStore, defaultSave, loadSave, migrate, writeSave } from './save.js';

function memStore() {
  const mem: Record<string, string> = {};
  return {
    get: (k: string) => (k in mem ? mem[k] : null),
    set: (k: string, v: string) => { mem[k] = v; },
    del: (k: string) => { delete mem[k]; },
  };
}

describe('save tương thích V1', () => {
  it('save lạ → default, không throw', () => {
    expect(migrate(null)).toEqual(defaultSave());
    expect(migrate('chuoi-rac')).toEqual(defaultSave());
    expect(migrate({ v: 999 })).toEqual(defaultSave());
  });

  it('save V1 đầy đủ giữ nguyên giá trị', () => {
    const s = migrate({ ...defaultSave(), inf: 500, lv: 3, vil: { gieng: true, cau: false, den: true } });
    expect(s.inf).toBe(500);
    expect(s.lv).toBe(3);
    expect(s.vil).toEqual({ gieng: true, cau: false, den: true });
  });

  it('số âm/hỏng bị kẹp về an toàn', () => {
    const s = migrate({ ...defaultSave(), inf: -50, lv: 0, hp: Number.NaN });
    expect(s.inf).toBe(0);
    expect(s.lv).toBe(1);
    expect(s.hp).toBe(100);
  });

  it('vòng tròn ghi → đọc giữ nguyên', () => {
    const store = memStore();
    const s = { ...defaultSave(), inf: 123, x: 5 };
    writeSave(store, s);
    expect(loadSave(store)).toMatchObject({ inf: 123, x: 5 });
  });

  it('store hỏng (set throw) không crash game', () => {
    const bad = { get: () => null, set: () => { throw new Error('deny'); }, del: () => {} };
    expect(() => writeSave(bad, defaultSave())).not.toThrow();
    expect(createStore().get('x')).toBeNull();
  });
});
