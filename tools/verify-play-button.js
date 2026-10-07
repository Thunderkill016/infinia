#!/usr/bin/env node
// Verify P0: nút "Chơi ngay" (#btn-play) trên màn hình title có thật sự mở gameplay sau 1 chạm không.
// Chạy: node tools/verify-play-button.js [--file=game.html]
const { spawn, execSync } = require('child_process');
const path = require('path'); // Node 22+: dùng WebSocket global, không cần gói ws
const HOME = process.env.HOME || '/home/hatch';
const args = process.argv.slice(2);
const fileArg = args.find(a => a.startsWith('--file='));
const GAME = fileArg ? fileArg.slice(7) : path.join(HOME, 'workspace/infinia-standalone-v2/index.html');
const PORT = 19334;
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
  try { execSync(`pkill -f "remote-debugging-port=${PORT}[ ]"`); } catch (e) {}
  await new Promise(r => setTimeout(r, 1500));
  const chrome = spawn('xvfb-run', ['-a', CHROME,
    '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu-sandbox',
    '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--no-first-run', '--no-default-browser-check',
    '--user-data-dir=/tmp/cdp-verify-play', '--window-size=1280,800',
    `--remote-debugging-port=${PORT}`, 'about:blank'],
    { stdio: 'ignore', detached: true });
  chrome.unref();
  let page = null;
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try { const ts = await httpGetJson('/json/list'); page = ts.find(t => t.type === 'page'); if (page) break; } catch (e) {}
  }
  if (!page) throw new Error('Chrome không mở được cổng CDP');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws fail')); });
  let msgId = 0; const pending = {};
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; } };
  const send = (m, p) => new Promise((res) => { const id = ++msgId; pending[id] = res; ws.send(JSON.stringify({ id, method: m, params: p })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true }); return r.result.result.value; };
  await send('Page.enable');
  await send('Page.navigate', { url: 'file://' + GAME }); // KHÔNG ?shot= → title screen hiện như người chơi thật
  await new Promise(r => setTimeout(r, 8000)); // chờ game load
  const hasBtn = await ev(`!!document.getElementById('btn-play')`);
  const btnText = await ev(`(document.getElementById('btn-play')||{}).textContent || ''`);
  const titleVisible = await ev(`(function(){const s=document.getElementById('title-screen');return s && getComputedStyle(s).display!=='none';})()`);
  // Mô phỏng 1 chạm: click nút Chơi ngay
  await ev(`document.getElementById('btn-play').click()`);
  await new Promise(r => setTimeout(r, 800));
  const afterClick = await ev(`(function(){const s=document.getElementById('title-screen');return getComputedStyle(s).display;})()`);
  const canvasOk = await ev(`!!document.querySelector('canvas')`);
  console.log('có nút #btn-play:', hasBtn, '| text:', JSON.stringify(btnText.trim()));
  console.log('title hiện trước click:', titleVisible);
  console.log('title display sau 1 click:', afterClick, '| canvas game có:', canvasOk);
  const ok = hasBtn && titleVisible && afterClick === 'none' && canvasOk;
  console.log(ok ? 'PASS: Chơi ngay mở gameplay sau 1 chạm' : 'FAIL: nút Chơi ngay không mở gameplay');
  ws.close();
  try { process.kill(-chrome.pid); } catch (e) {}
  try { execSync(`pkill -f "remote-debugging-port=${PORT}[ ]"`); } catch (e) {}
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error('LỖI:', e.message); process.exit(1); });
