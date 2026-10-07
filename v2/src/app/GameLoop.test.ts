import { describe, expect, it } from 'vitest';
import { FIXED_STEP, GameLoop } from './GameLoop.js';

function makeLoop() {
  let steps = 0;
  let lastAlpha = -1;
  const loop = new GameLoop(
    () => { steps++; },
    (alpha) => { lastAlpha = alpha; },
  );
  return { loop, steps: () => steps, alpha: () => lastAlpha };
}

describe('GameLoop fixed-step', () => {
  it('1/60s chạy đúng 1 step', () => {
    const t = makeLoop();
    expect(t.loop.pump(FIXED_STEP)).toBe(1);
    expect(t.steps()).toBe(1);
  });

  it('dt lẻ cộng dồn rồi xả đúng (không phụ thuộc FPS)', () => {
    const t = makeLoop();
    t.loop.pump(0.005);
    t.loop.pump(0.005);
    expect(t.steps()).toBe(0); // 0.01 < 1/60 ≈ 0.0167
    t.loop.pump(0.01);
    expect(t.steps()).toBe(1); // 0.02 / (1/60) = 1.2 → đúng 1 step, dư alpha
  });

  it('lag nặng kẹp đúng MAX_STEPS (3), không xoáy chết', () => {
    const t = makeLoop();
    expect(t.loop.pump(10)).toBe(3);
    expect(t.steps()).toBe(3);
  });

  it('nợ âm hoặc 0 không chạy step', () => {
    const t = makeLoop();
    expect(t.loop.pump(0)).toBe(0);
    expect(t.loop.pump(-1)).toBe(0);
  });

  it('alpha render nằm trong [0,1)', () => {
    const t = makeLoop();
    t.loop.pump(0.01);
    const a = t.alpha();
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThan(1);
  });
});
