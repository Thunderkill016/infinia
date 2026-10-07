import { describe, expect, it } from 'vitest';
import { applySoftCap, canAfford, spend } from './economy.js';

describe('kinh tế ∞', () => {
  it('dưới cap giữ nguyên thưởng', () => {
    expect(applySoftCap(100, 10)).toBe(10);
  });

  it('trên cap 5000 giảm một nửa', () => {
    expect(applySoftCap(6000, 10)).toBe(5);
  });

  it('mua bán không âm tiền', () => {
    expect(spend(100, 120)).toEqual({ inf: 100, ok: false });
    expect(spend(200, 120)).toEqual({ inf: 80, ok: true });
  });

  it('giá lạ không mua được', () => {
    expect(canAfford(9999, -5)).toBe(false);
    expect(canAfford(9999, Number.NaN)).toBe(false);
  });
});
