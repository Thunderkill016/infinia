#!/usr/bin/env node
// tools/screenshot.js — tự chụp ảnh game INFINIA để đánh giá visual / so sánh / check regression.
//
// Cách dùng:
//   node tools/screenshot.js [day|night|combat]... [--out=dir] [--file=game.html]
//
// Mặc định chụp cả 3 cảnh, lưu vào review/auto-<timestamp>/.
// Dùng file game standalone (file://) vì Chrome 152 chặn localhost.
//
// Yêu cầu: Xvfb + /opt/meta-chromium/chrome (có sẵn trong VM).
// Hook ?shot=day|night|combat nằm trong app.js — giữ lại, đừng xóa.

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const HOME = process.env.HOME || '/home/hatch';
const args = process.argv.slice(2);
const modes = args.filter(a => !a.startsWith('--'));
const outArg = args.find(a => a.startsWith('--out='));
const fileArg = args.find(a => a.startsWith('--file='));
const GAME = fileArg ? fileArg.slice(7) : path.join(HOME, 'workspace/infinia-standalone-v2/index.html');
const OUT = outArg ? outArg.slice(6) : path.join(HOME, 'workspace/infinia/review',
  'auto-' + new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'));
const SHOT_MODES = modes.length ? modes : ['day', 'night', 'combat'];
const PORT = 19333;
const CHROME = '/opt/meta-chromium/chrome';

function httpGetJson(p) {
  return new Promise((resolve, reject) => {
    require('http').get({ host: '127.0.0.1', port: PORT, path: p }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // Dọn chrome cũ (nếu còn) rồi khởi động mới
  try { execSync(`pkill -f "remote-debugging-port=${PORT}[ ]"`); } catch (e) {}
  await new Promise(r => setTimeout(r, 1500));
  const chrome = spawn('xvfb-run', ['-a', CHROME,
    '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu-sandbox',
    '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--no-first-run', '--no-default-browser-check',
    '--user-data-dir=/tmp/cdp-shot-profile',
    '--window-size=1280,800', `--remote-debugging-port=${PORT}`, 'about:blank'],
    { stdio: 'ignore', detached: true });
  chrome.unref();

  let page = null;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const targets = await httpGetJson('/json/list');
      page = targets.find(t => t.type === 'page');
      if (page) break;
    } catch (e) {}
  }
  if (!page) throw new Error('Chrome không mở được cổng CDP');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws fail')); });
  let msgId = 0; const pending = {};
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++msgId; pending[id] = res;
    ws.send(JSON.stringify({ id, method, params }));
  });
  const title = async () => {
    const r = await send('Runtime.evaluate', { expression: 'document.title' });
    return r.result.result.value;
  };

  await send('Page.enable');
  for (const mode of SHOT_MODES) {
    const url = 'file://' + GAME + '?shot=' + mode;
    await send('Page.navigate', { url });
    // chờ tới khi game báo SHOT_READY (tối đa 60s)
    let ready = false;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 1000));
      try { if ((await title()).indexOf('SHOT_READY') === 0) { ready = true; break; } } catch (e) {}
    }
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const fp = path.join(OUT, `shot-${mode}.png`);
    fs.writeFileSync(fp, Buffer.from(shot.result.data, 'base64'));
    console.log((ready ? 'OK  ' : 'WARN(chưa SHOT_READY) ') + fp);
  }
  ws.close();
  try { process.kill(-chrome.pid); } catch (e) {}
  try { execSync(`pkill -f "remote-debugging-port=${PORT}[ ]"`); } catch (e) {}
  console.log('xong → ' + OUT);
  process.exit(0);
})().catch(e => { console.error('LỖI:', e.message); process.exit(1); });
