// Audio harness: proves the sound paths actually produce signal. Swaps AudioContext for an
// OfflineAudioContext inside headless Chrome, triggers each sound in a fresh page, renders 2.5s,
// and reports RMS per time window. Zero deps, Node >= 22.  Run: node test/audio.js
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
if (!fs.existsSync(CHROME)) { console.log('chrome not found, skipping audio test'); process.exit(0); }
const URL = 'file:///' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/').replace(/ /g, '%20');
const PORT = 9334;
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${path.join(require('os').tmpdir(), 'ebb-chrome-audio')}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJson = (u) => new Promise((res, rej) => http.get(u, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d))); }).on('error', rej));

const SHIM = `
  window.AudioContext = class extends OfflineAudioContext {
    constructor() { super(1, 44100 * 2.5, 44100); window.__ctx = this; }
    resume() { return Promise.resolve(); }
    get state() { return 'running'; }
  };
  window.__render = async function () {
    const buf = await window.__ctx.startRendering();
    const d = buf.getChannelData(0); const sr = buf.sampleRate;
    const rms = (a, b) => { let s = 0, n = 0; for (let i = Math.floor(a * sr); i < Math.min(d.length, Math.floor(b * sr)); i++) { s += d[i] * d[i]; n++; } return n ? +Math.sqrt(s / n).toFixed(4) : 0; };
    let peak = 0; for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
    // spectral flatness of a 2048-sample slice at 0.8s: ~1.0 = white noise, small = tonal/voiced. Naive DFT, fine for a test.
    const N = 2048, off = Math.floor(0.8 * sr); const mags = [];
    for (let k = 1; k < 512; k++) { let re = 0, im = 0; for (let n = 0; n < N; n++) { const x = d[off + n] * (0.5 - 0.5 * Math.cos(2 * Math.PI * n / N)); const a = 2 * Math.PI * k * n / N; re += x * Math.cos(a); im -= x * Math.sin(a); } mags.push(re * re + im * im + 1e-12); }
    const geo = Math.exp(mags.reduce((s, m) => s + Math.log(m), 0) / mags.length), ari = mags.reduce((s, m) => s + m, 0) / mags.length;
    return { w0: rms(0, 0.3), w1: rms(0.3, 0.7), w2: rms(0.7, 1.2), w3: rms(1.2, 1.8), w4: rms(1.8, 2.5), peak: +peak.toFixed(3), flat: +(geo / ari).toFixed(3) };
  };
`;

// each case: label, trigger expression, and the check on the rendered windows
const CASES = [
  ['hit(crit)',      `EBB_SND.hit(true)`,                              (r) => r.w0 > 0.03],
  ['crowd low',      `EBB_SND.crowd('low')`,                           (r) => r.w1 > 0.01],
  ['crowd mid',      `EBB_SND.crowd('mid')`,                           (r) => r.w1 > 0.03 && r.flat < 0.2],
  ['crowd high',     `EBB_SND.crowd('high')`,                          (r) => r.w1 > 0.05 && r.w2 > 0.03 && r.flat < 0.2],
  ['crowd crit',     `EBB_SND.crowd('crit')`,                          (r) => r.w1 > 0.06 && r.w2 > 0.05 && r.w3 > 0.02],
  ['crowd resist',   `EBB_SND.crowd('resist')`,                        (r) => r.w1 > 0.03 && r.flat < 0.2],
  ['white noise ref', `(function(){ EBB_SND.probe(); const c=window.__ctx; const b=c.createBufferSource(); const buf=c.createBuffer(1,c.sampleRate*2.5,c.sampleRate); const d=buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.3; b.buffer=buf; b.connect(c.destination); b.start(0); })()`, (r) => r.flat > 0.5],
  ['voices ooh',     `EBB_SND._parts.voices({n:20,dur:1.3,pitch:[120,300],vowels:['oo','oh','oo'],contour:'ooh',peak:0.5})`, (r) => r.w1 > 0.03 && r.w2 > 0.02],
  ['voices boo',     `EBB_SND._parts.voices({n:20,dur:1.3,pitch:[90,210],vowels:['oo','oo','oo'],contour:'boo',peak:0.6,plosive:true})`, (r) => r.w1 > 0.03],
  ['applause',       `EBB_SND._parts.applause(2.0, 140, 0.35)`,        (r) => r.w1 > 0.02 && r.w3 > 0.01],
  ['whoops',         `EBB_SND._parts.whoops(1.5, 6, 0.12)`,            (r) => r.w1 + r.w2 > 0.01],
  ['swell only',     `EBB_SND._parts.swell(1.3, 600, 1400, 1, 0.9)`,   (r) => r.w1 > 0.02],
  ['boo only',       `EBB_SND._parts.boo(1.0)`,                        (r) => r.w1 > 0.01],
  ['music (first 150ms; offline clock never advances)', `EBB_SND.start()`, (r) => r.w0 > 0.02],
];

(async () => {
  let targets; for (let i = 0; i < 40; i++) { try { targets = await getJson(`http://127.0.0.1:${PORT}/json`); break; } catch (e) { await sleep(250); } }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); let errors = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.description || a.value).join(' '));
  };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) errors.push(r.result.exceptionDetails.exception?.description || 'eval error'); return r.result?.result?.value; };
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: SHIM });

  let fails = 0;
  for (const [label, trigger, ok] of CASES) {
    errors = [];
    await send('Page.navigate', { url: URL }); await sleep(500);
    await evaluate(trigger); await sleep(150);
    const r = await evaluate(`window.__render()`);
    const pass = r && ok(r) && r.peak <= 1.0 && errors.length === 0;
    if (!pass) fails++;
    console.log(`${pass ? 'ok  ' : 'FAIL'} ${label.padEnd(16)} ${JSON.stringify(r)}${errors.length ? ' ERRORS: ' + errors.join(' | ') : ''}`);
  }
  ws.close(); chrome.kill();
  if (fails) { console.error(`${fails} audio case(s) failed`); process.exit(1); }
  console.log('OK');
})().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });
