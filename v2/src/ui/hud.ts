// V2 foundation: HUD tối thiểu (version + trạng thái). HUD đầy đủ ở vertical slice.
export class Hud {
  private readonly el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.style.cssText =
      'position:fixed;top:10px;left:10px;z-index:10;pointer-events:none;' +
      'font:600 13px system-ui,sans-serif;color:#ffe9a8;' +
      'background:rgba(0,0,0,.5);padding:6px 12px;border-radius:8px;';
    document.body.appendChild(this.el);
  }

  set(text: string): void {
    this.el.textContent = text;
  }
}
