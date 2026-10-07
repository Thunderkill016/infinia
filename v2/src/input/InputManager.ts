// V2 foundation: input thống nhất MOVE / ACTION / DODGE / MENU (web-first).
// Core game chỉ đọc InputState — Keyboard/Touch/Gamepad là adapter thay được.
// V2.0: Keyboard + Touch (Pointer Events, joystick trái + nút ACTION/DODGE).
// V2.1: Gamepad (chưa làm — xem KE_HOACH_AZ §11).
export interface MoveVec {
  x: number;
  z: number;
}

export class InputManager {
  move: MoveVec = { x: 0, z: 0 };
  private actionQueued = false;
  private dodgeQueued = false;
  private menuQueued = false;
  private keys = new Set<string>();
  private joyId: number | null = null;
  private joyCx = 0;
  private joyCy = 0;
  private ui: {
    root: HTMLElement;
    joyBase: HTMLElement;
    joyKnob: HTMLElement;
    btnAction: HTMLElement;
    btnDodge: HTMLElement;
  } | null = null;

  readonly isTouch: boolean =
    typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  private readonly host: HTMLElement;

  constructor(host: HTMLElement) {
    this.host = host;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'KeyE') this.actionQueued = true;
      if (e.code === 'Space') this.dodgeQueued = true;
      if (e.code === 'Escape') this.menuQueued = true;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    if (this.isTouch) this.buildTouchUI();
  }

  private buildTouchUI(): void {
    const css = (el: HTMLElement, s: string): void => { el.style.cssText = s; };
    const root = document.createElement('div');
    const joyBase = document.createElement('div');
    const joyKnob = document.createElement('div');
    const btnAction = document.createElement('button');
    const btnDodge = document.createElement('button');
    btnAction.textContent = 'ACTION';
    btnDodge.textContent = 'NÉ';
    css(root, 'position:fixed;inset:0;z-index:20;pointer-events:none;');
    css(joyBase, 'position:absolute;left:24px;bottom:24px;width:120px;height:120px;border-radius:50%;display:none;' +
      'background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.25);pointer-events:none;');
    css(joyKnob, 'position:absolute;left:35px;top:35px;width:50px;height:50px;border-radius:50%;' +
      'background:rgba(255,255,255,.35);pointer-events:none;');
    const btn = 'position:absolute;min-width:76px;min-height:76px;border-radius:50%;font-weight:800;' +
      'font-size:17px;border:3px solid #fff3b0;pointer-events:auto;';
    css(btnAction, btn + 'right:24px;bottom:120px;background:rgba(255,211,77,.95);color:#3a2c00;');
    css(btnDodge, btn + 'right:116px;bottom:40px;background:rgba(47,111,237,.92);color:#fff;');
    btnAction.onclick = () => { this.actionQueued = true; };
    btnDodge.onclick = () => { this.dodgeQueued = true; };
    joyBase.appendChild(joyKnob);
    root.append(joyBase, btnAction, btnDodge);
    document.body.appendChild(root);
    this.ui = { root, joyBase, joyKnob, btnAction, btnDodge };
    this.host.style.touchAction = 'none';
    this.host.addEventListener('pointerdown', (e) => this.onPointer(e, true));
    this.host.addEventListener('pointermove', (e) => this.onPointer(e, false));
    const up = (e: PointerEvent): void => {
      if (e.pointerId === this.joyId) {
        this.joyId = null;
        this.move = { x: 0, z: 0 };
        if (this.ui) this.ui.joyBase.style.display = 'none';
      }
    };
    this.host.addEventListener('pointerup', up);
    this.host.addEventListener('pointercancel', up);
  }

  private onPointer(e: PointerEvent, down: boolean): void {
    if (e.pointerType === 'mouse') return;
    const w = window.innerWidth;
    if (e.clientX > w * 0.45) return; // nửa phải: dành cho swipe camera (V2.1)
    if (down && this.joyId === null) {
      this.joyId = e.pointerId;
      this.joyCx = e.clientX;
      this.joyCy = e.clientY;
      if (this.ui) {
        this.ui.joyBase.style.display = 'block';
        this.ui.joyBase.style.left = `${e.clientX - 60}px`;
        this.ui.joyBase.style.top = `${e.clientY - 60}px`;
      }
    }
    if (e.pointerId === this.joyId && this.ui) {
      const dx = (e.clientX - this.joyCx) / 48;
      const dy = (e.clientY - this.joyCy) / 48;
      const len = Math.hypot(dx, dy) || 1;
      const k = Math.min(len, 1);
      this.move = { x: (dx / len) * k, z: (dy / len) * k };
      this.ui.joyKnob.style.left = `${35 + (dx / len) * k * 32}px`;
      this.ui.joyKnob.style.top = `${35 + (dy / len) * k * 32}px`;
    }
  }

  /** Đọc phím di chuyển mỗi step (WASD/mũi tên). */
  pollKeys(): void {
    const k = this.keys;
    let x = 0;
    let z = 0;
    if (k.has('KeyW') || k.has('ArrowUp')) z += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) z -= 1;
    if (k.has('KeyA') || k.has('ArrowLeft')) x -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) x += 1;
    if (x !== 0 || z !== 0) {
      const l = Math.hypot(x, z);
      this.move = { x: x / l, z: z / l };
    } else if (this.joyId === null) {
      this.move = { x: 0, z: 0 };
    }
  }

  consumeAction(): boolean {
    const v = this.actionQueued;
    this.actionQueued = false;
    return v;
  }

  consumeDodge(): boolean {
    const v = this.dodgeQueued;
    this.dodgeQueued = false;
    return v;
  }

  consumeMenu(): boolean {
    const v = this.menuQueued;
    this.menuQueued = false;
    return v;
  }
}
