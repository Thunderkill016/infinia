#!/usr/bin/env node
// Đo FPS thực tế INFINIA qua CDP (pattern theo tools/screenshot.js).
// 1 trang duy nhất, Page.navigate từng mode, chờ SHOT_READY, đo 12s thực.
const { spawn, execSync } = require('child_process');
const path = require('path');
const HOME = process.env.HOME || '/home/hatch';
const PORT = 19335;
const CHROME = '/opt/meta-chromium/chrome';
const GAME = path.join(HOME, 'workspace/infinia-standalone-v2/index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));

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
  const modes = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const list = modes.length ? modes : ['day', 'night', 'combat'];
  try { execSync('pkill -f "remote-debugging-port=1933[5]"'); } catch (e) {}
  await sleep(1200);
  const chrome = spawn('xvfb-run', ['-a', CHROME,
    '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu-sandbox',
    '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--no-first-run', '--no-default-browser-check',
    '--user-data-dir=/tmp/cdp-fps2-profile',
    '--window-size=1280,800', `--remote-debugging-port=${PORT}`, 'about:blank'],
    { stdio: 'ignore', detached: true });
  chrome.unref();

  let page = null;
  for (let i = 0; i < 60; i++) {
    await sleep(1000);
    try {
      const targets = await httpGetJson('/json/list');
      page = targets.find(t => t.type === 'page');
      if (page) break;
    } catch (e) {}
  }
  if (!page) throw new Error('no page');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws fail')); setTimeout(() => rej(new Error('ws timeout')), 15000); });
  let msgId = 0; const pending = {};
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++msgId; pending[id] = res;
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    return r.result && r.result.result ? r.result.result.value : null;
  };

  await send('Page.enable');
  for (const mode of list) {
    await send('Page.navigate', { url: 'file://' + GAME + '?shot=' + mode });
    let ready = false;
    for (let i = 0; i < 45; i++) {
      await sleep(1000);
      try { const t = await evaluate('document.title'); if (t && t.indexOf('SHOT_READY') === 0) { ready = true; break; } } catch (e) {}
    }
    await sleep(12000); // đo 12s thực sau khi ổn định
    const fps = await evaluate(`document.getElementById('fps').textContent`);
    const draws = await evaluate(`document.getElementById('dbg-draw').textContent`);
    const tris = await evaluate(`(function(){try{return document.getElementById('dbg-tri')?document.getElementById('dbg-tri').textContent:'n/a'}catch(e){return 'n/a'}})()`);
    console.log(JSON.stringify({ mode, fps, draws, tris, ready }));
  }
  ws.close();
  try { process.kill(-chrome.pid); } catch (e) {}
  try { execSync('pkill -f "remote-debugging-port=1933[5]"'); } catch (e) {}
  console.log('DONE');
  process.exit(0);
})().catch(e => { console.error('ERR:', e.message); process.exit(1); });
