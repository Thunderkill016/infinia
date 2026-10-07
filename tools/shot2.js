// shot2.js — chụp screenshot qua CDP đang chạy sẵn ở cổng cho trước.
// Dùng: node shot2.js <port> <url> <outfile> [waitMs]
const PORT = parseInt(process.argv[2], 10);
const url = process.argv[3];
const outfile = process.argv[4];
const waitMs = parseInt(process.argv[5] || '30000', 10);

function httpGetJson(path) {
  return new Promise((resolve, reject) => {
    require('http').get({ host: '127.0.0.1', port: PORT, path }, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

(async () => {
  let page = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));
    try {
      const targets = await httpGetJson('/json/list');
      page = targets.find(t => t.type === 'page');
      if (page) break;
    } catch (e) { /* chờ */ }
  }
  if (!page) throw new Error('không thấy page target');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws fail')); });
  let msgId = 0;
  const pending = {};
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { pending[m.id](m); delete pending[m.id]; }
  };
  const send = (method, params) => new Promise((res) => {
    const id = ++msgId;
    pending[id] = res;
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await send('Page.navigate', { url });
  console.log('đang chờ render ' + waitMs + 'ms...');
  await new Promise(r => setTimeout(r, waitMs));
  const title = await send('Runtime.evaluate', { expression: 'document.title' });
  console.log('title:', title.result.result.value);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(shot.result.data, 'base64');
  require('fs').writeFileSync(outfile, buf);
  console.log('đã ghi', outfile, buf.length, 'bytes');
  ws.close();
  process.exit(0);
})().catch(e => { console.error('LỖI:', e.message); process.exit(1); });
