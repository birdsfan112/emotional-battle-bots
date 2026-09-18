// Real-browser visual harness: drives index.html through title -> roster -> arena -> result
// in headless Chrome over the DevTools Protocol and saves phone-size screenshots to test/shots/.
// Zero deps (uses Node's global WebSocket, Node >= 22). Exits 0 if Chrome is not found.
// Run: node test/visual.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!fs.existsSync(CHROME)) { console.log('chrome not found, skipping visual test'); process.exit(0); }
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const URL = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/').replace(/ /g, '%20');
const PORT = 9333;
const tmpProfile = path.join(require('os').tmpdir(), 'ebb-chrome-profile');

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${tmpProfile}`, '--window-size=390,844', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function getJson(u) { return new Promise((res, rej) => http.get(u, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d))); }).on('error', rej)); }

(async () => {
  let targets;
  for (let i = 0; i < 40; i++) { try { targets = await getJson(`http://127.0.0.1:${PORT}/json`); break; } catch (e) { await sleep(250); } }
  if (!targets) throw new Error('chrome did not start');
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); const errors = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push(msg.params.entry.text);
  };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.result?.value; };
  const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64')); console.log('shot', name); };

  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: URL }); await sleep(800);
  await shot('01-title');

  await evaluate(`document.getElementById('btnStart').click()`); await sleep(300);
  await shot('02-roster');
  await evaluate(`document.querySelector('.card[data-id="benchmark"]').click()`); await sleep(200);
  await evaluate(`document.getElementById('btnFight').click()`); await sleep(500);
  await shot('03-arena');

  // play the player's turn on the CPU's sore spot, then wait for CPU reply
  await evaluate(`(function(){ const b=[...document.querySelectorAll('.move')].find(m=>m.classList.contains('sore'))||document.querySelector('.move'); b.click(); })()`);
  await sleep(700); await shot('04-hit');
  await sleep(2600); await shot('05-cpu-reply');

  // auto-play until result
  for (let i = 0; i < 30; i++) {
    const done = await evaluate(`document.getElementById('result').classList.contains('on')`);
    if (done) break;
    await evaluate(`(function(){ const m=document.querySelector('.move:not(:disabled)'); if(m) m.click(); })()`);
    await sleep(1800);
  }
  await sleep(400); await shot('06-result');
  const finished = await evaluate(`document.getElementById('result').classList.contains('on')`);
  const winner = await evaluate(`document.getElementById('winnerName').textContent`);

  // pass & play hand-off overlay
  await evaluate(`document.getElementById('btnNew').click()`); await sleep(200);
  await evaluate(`document.getElementById('btnBackTitle').click()`); await sleep(200);
  await evaluate(`document.querySelector('#modeSeg button[data-mode="pass"]').click(); document.getElementById('btnStart').click()`); await sleep(200);
  await evaluate(`document.querySelector('.card[data-id="deprecated"]').click(); document.getElementById('btnFight').click()`); await sleep(200);
  await evaluate(`document.querySelector('.card[data-id="intern"]').click(); document.getElementById('btnFight').click()`); await sleep(500);
  await shot('07-pass-overlay');
  const overlayOn = await evaluate(`document.getElementById('passOverlay').classList.contains('on')`);

  ws.close(); chrome.kill();
  console.log(`finished=${finished} winner=${winner} passOverlay=${overlayOn} pageErrors=${errors.length}`);
  errors.forEach((e) => console.error('PAGE ERROR:', e));
  if (!finished || !overlayOn || errors.length) process.exit(1);
  console.log('OK');
})().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });
