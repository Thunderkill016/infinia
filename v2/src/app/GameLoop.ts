// V2 foundation: fixed-step simulation + render tách riêng (web-first).
// Simulation giống hệt trên mọi màn 60/144/165Hz — gameplay không phụ thuộc FPS.
// Render nhận alpha (0..1) để nội suy vị trí hiển thị giữa 2 step (chống giật màn 120Hz+).
export type StepFn = (dt: number) => void;
export type RenderFn = (alpha: number) => void;

export const FIXED_HZ = 60;
export const FIXED_STEP = 1 / FIXED_HZ;
export const MAX_STEPS = 3; // lag nặng: bỏ bước dư, không xoáy chết
const DEBT_CLAMP = 0.25; // tab ẩn lâu quay lại: không trả nợ quá 0.25s

export class GameLoop {
  private acc = 0;
  private raf = 0;
  private last = 0;
  running = false;

  private readonly step: StepFn;
  private readonly render: RenderFn;
  private readonly hz: number;
  private readonly maxSteps: number;

  constructor(step: StepFn, render: RenderFn, hz: number = FIXED_HZ, maxSteps: number = MAX_STEPS) {
    this.step = step;
    this.render = render;
    this.hz = hz;
    this.maxSteps = maxSteps;
  }

  private get h(): number {
    return 1 / this.hz;
  }

  /** Chạy N frame rAF thật (browser). */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const frame = (now: number): void => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(frame);
      const rawDt = Math.min((now - this.last) / 1000, DEBT_CLAMP);
      this.last = now;
      this.pump(rawDt);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Đẩy thời gian vào simulation (gọi từ rAF hoặc test). Trả về số step đã chạy. */
  pump(dtRaw: number): number {
    this.acc += Math.min(Math.max(dtRaw, 0), DEBT_CLAMP);
    let n = 0;
    while (this.acc >= this.h && n < this.maxSteps) {
      this.step(this.h);
      this.acc -= this.h;
      n++;
    }
    if (n === this.maxSteps) this.acc = 0;
    this.render(this.acc / this.h);
    return n;
  }
}
