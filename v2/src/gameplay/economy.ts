// V2 foundation: kinh tế ∞/XP chống lạm phát (port luật từ KE_HOACH_AZ §3).
// Faucet có trần/ngày, sink bắt buộc, soft-cap 5000 — thuần túy, test được.
export const INF_SOFT_CAP = 5000; // trên mốc này, thưởng cá thường giảm một nửa
export const BOSS_REWARD = { xp: 100, inf: 80 } as const;
export const FISH_REWARD = { xp: 15, inf: 10 } as const;

/** Thưởng đã qua soft-cap: ∞ > cap thì phần thưởng ∞ chỉ còn một nửa. */
export function applySoftCap(currentInf: number, gainInf: number): number {
  if (currentInf > INF_SOFT_CAP) return Math.floor(gainInf / 2);
  return gainInf;
}

/** Đủ tiền mua công trình/giá shop không? */
export function canAfford(inf: number, price: number): boolean {
  return Number.isFinite(inf) && Number.isFinite(price) && price >= 0 && inf >= price;
}

/** Trừ tiền mua đồ — không đủ thì giữ nguyên (không âm, không fail). */
export function spend(inf: number, price: number): { inf: number; ok: boolean } {
  if (!canAfford(inf, price)) return { inf, ok: false };
  return { inf: inf - price, ok: true };
}
