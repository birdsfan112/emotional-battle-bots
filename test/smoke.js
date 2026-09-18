// Headless smoke test for Emotional Battle Bots. Run: node test/smoke.js
// Extracts the EBB core (data + engine + art) from index.html and simulates
// CPU-vs-CPU battles for every bot pairing. Zero dependencies.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const m = html.match(/\/\*EBB-CORE-START\*\/([\s\S]*?)\/\*EBB-CORE-END\*\//);
if (!m) { console.error('FAIL: core markers not found'); process.exit(1); }
const mod = { exports: {} };
new Function('module', 'window', m[1])(mod, undefined);
const EBB = mod.exports;

let fails = 0;
const check = (cond, msg) => { if (!cond) { fails++; console.error('FAIL:', msg); } };

// 1. Library shape
for (const k of EBB.CAT_KEYS) check(EBB.LIBRARY[k].length >= 12, `pool ${k} has ${EBB.LIBRARY[k].length} lines (<12)`);
check(EBB.BOTS.length >= 6, 'roster too small');
for (const b of EBB.BOTS) {
  check(EBB.CAT_KEYS.includes(b.sore) && EBB.CAT_KEYS.includes(b.coping), `${b.id} sore/coping invalid`);
  check(b.sore !== b.coping, `${b.id} sore == coping`);
  check(b.sig.length >= 2, `${b.id} needs 2 signature lines`);
  const svg = EBB.drawBot(b);
  check(svg.startsWith('<svg') && svg.includes(b.name), `${b.id} svg malformed`);
  check(EBB.drawBot(b, { facing: 'left' }).includes('scale(-1 1)'), `${b.id} flip missing`);
}

// 2. Battles: every pairing, several seeds
EBB.setSeed(42);
let battles = 0, totalRounds = 0, maxRounds = 0, crits = 0, comebacks = 0, heals = 0, resists = 0;
for (const A of EBB.BOTS) for (const B of EBB.BOTS) {
  if (A.id === B.id) continue;
  for (let s = 0; s < 4; s++) {
    const st = EBB.newBattle(A.id, B.id);
    let turns = 0;
    while (!st.over && turns < 80) {
      const side = st.turn;
      const ev = EBB.act(st, side, EBB.cpuPick(st, side));
      turns++;
      check(!/\{\w+\}/.test(ev.line), `unfilled token in line: ${ev.line}`);
      if (ev.comebackLine) check(!/\{\w+\}/.test(ev.comebackLine), `unfilled token in comeback: ${ev.comebackLine}`);
      if (ev.resistLine) check(!/\{\w+\}/.test(ev.resistLine), `unfilled token in resist: ${ev.resistLine}`);
      if (ev.dmg) check(ev.dmg >= 4 && ev.dmg <= 60, `dmg out of range ${ev.dmg}`);
      if (ev.crit) crits++; if (ev.comeback) comebacks++; if (ev.heal) heals++; if (ev.resisted) resists++;
    }
    check(st.over, `${A.id} vs ${B.id} did not finish in 80 turns`);
    check(st.winner === 'a' || st.winner === 'b', 'no winner');
    check(st[st.winner].hp > 0, 'winner has 0 hp');
    battles++; totalRounds += st.round; maxRounds = Math.max(maxRounds, st.round);
  }
}
const avg = totalRounds / battles;
check(avg >= 3 && avg <= 9, `average rounds ${avg.toFixed(1)} outside 3-9 (session length target)`);
check(crits > 0 && comebacks > 0 && heals > 0 && resists > 0, `some mechanic never fired (crits=${crits} comebacks=${comebacks} heals=${heals} resists=${resists})`);

// 2b. Forced resist + sore spot behave
{
  const st = EBB.newBattle('grievance', 'pleasantries'); // pleasantries copes with alignment, sore on impact
  const r = EBB.act(st, 'a', 'alignment');
  check(r.resisted && r.resistLine && r.dmg <= 12, `resist did not reduce damage (${r.dmg})`);
  const st2 = EBB.newBattle('grievance', 'pleasantries');
  const s = EBB.act(st2, 'a', 'impact');
  check(s.sore, 'sore flag missing');
}

// 3. Line variety: no repeat within one long battle until pool exhausted
{
  const st = EBB.newBattle('deprecated', 'pleasantries');
  const seen = new Set(); let dup = false;
  for (let i = 0; i < 12 && !st.over; i++) {
    const ev = EBB.act(st, st.turn, 'looks');
    if (ev.crit) continue;
    if (seen.has(ev.line)) dup = true; seen.add(ev.line);
  }
  check(!dup, 'duplicate line before pool exhausted');
}

// 4. Override hook
{
  const mod2 = { exports: {} };
  new Function('module', 'window', m[1])(mod2, { EBB_ROASTS_OVERRIDE: { news: ['Fresh roast for {name}.'] } });
  const E2 = mod2.exports; E2.setSeed(7);
  const st = E2.newBattle('intern', 'doomscroll');
  let got = false;
  for (let i = 0; i < 6 && !st.over; i++) { const ev = E2.act(st, st.turn, 'news'); if (ev.line.startsWith('Fresh roast for')) got = true; }
  check(got, 'EBB_ROASTS_OVERRIDE not applied');
}

console.log(`battles=${battles} avgRounds=${avg.toFixed(1)} maxRounds=${maxRounds} crits=${crits} comebacks=${comebacks} heals=${heals} resists=${resists}`);
if (fails) { console.error(`${fails} failure(s)`); process.exit(1); }
console.log('OK');
