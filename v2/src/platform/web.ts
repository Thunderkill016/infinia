// V2 foundation: adapter nền tảng WEB (canonical platform).
// Ẩn tab → save ngay (mobile chuyển app là chuyện thường); rAF dừng theo tab.
// Capacitor (mobile store) / Tauri (desktop) dùng sau — game không đổi.
export function installWebLifecycle(onHidden: () => void): () => void {
  const onVis = (): void => {
    if (document.hidden) onHidden();
  };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('beforeunload', onHidden);
  return () => {
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('beforeunload', onHidden);
  };
}
