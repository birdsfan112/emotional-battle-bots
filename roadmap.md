## Status
| Field | Value |
|-------|-------|
| Priority | active |
| Phase | Iterate |
| Updated | 2026-09-18 |
| Summary | **Live at https://birdsfan112.github.io/emotional-battle-bots/ (build 1.4.0, 2026-09-18).** Built, shipped, and iterated in one day with Scott playtesting live: 8 bots, 5 roast categories (~80 lines) + signature burns, comebacks, hidden sore spots (reveal-then-patch), repeat-category penalty, self-care; vs. CPU and Pass & Play; tap-to-continue scrolling transcript; synthesized arena music + sfx; **recorded BBC crowd reactions** (gasp / boo / laugh / cheer, non-commercial licence) with synth fallback. Four test harnesses (engine, visual, synth audio, recorded audio over http) all green. Scott's verdict on the recorded crowd: "MUCH better." |
| Needs Scott | Share the URL with friends and collect reactions: which lines land, which fall flat, whether any crowd clip feels wrong for its moment. |
| Autonomous | Line-library punch-up pass (Backlog #2) once feedback arrives; swap any crowd clip Scott flags (BBC archive has hundreds); v2 news-refresh spec (Backlog #1). |
| Blockers | None. |

<!-- CHIEF OF STAFF NOTE: The Status block above is read by the daily review. Keep every field current.
     Format must stay as a table. Do not rename fields. "None" is a valid value for any field.
     Session log: docs/session-log-archive.md

     PRIORITY VALUES (v4):
       top-priority  — The current "one thing." Leverage-based, not activity-based. At most one project at a time holds this. Can be empty (no auto-promote).
       active        — Working toward a specific goal or deliverable.
       maintenance   — Stable and functional. Bug fixes and minor changes only.
       parked        — No additional work at this time. Phase is left blank.

     RULES:
       - A `parked` project cannot have open Current Sprint items. If sprint work exists, unpark to `active`.
       - A `maintenance` project can temporarily hold `top-priority` if a specific high-leverage move is underway.
       - When unparking, assign a new Phase — do not restore the prior value.
       - Claude may propose flips at session end or in the briefing; final decision rests with Scott. -->

# Emotional Battle Bots — Roadmap

**Play:** https://birdsfan112.github.io/emotional-battle-bots/ (GitHub Pages, deploys from `master` root on every push). Or open `index.html` in any browser. No install, no build, no network. **Test:** `node test/smoke.js` (engine) · `node test/visual.js` (headless Chrome screenshots) · `node test/audio.js` (renders each sound offline and asserts signal level per time window). **Remote:** `birdsfan112/emotional-battle-bots` (public).

## Current Sprint

<!-- Active work only. When everything is checked, this section should be empty — a signal to update the Status block. -->

- [x] v1 build: roster, roast library, engine, art, UI, share, smoke test (2026-09-18)
- [x] Phone playtest by Scott (2026-09-18) — drove the four same-day feedback passes below
- [ ] [NEXT:scott] Share the URL with friends; collect flat lines, layout issues, and any crowd clip that feels wrong
- [x] Share channel: public repo + GitHub Pages (2026-09-18). Also uploaded to Scott's Google Drive root as a fallback.
- [x] Scott's first-play notes (2026-09-18): lines and crowd commentary vanished too fast → tap-to-continue + persistent scrolling transcript; crowd text enlarged. Background music → Web Audio loop + sfx, mute button.
- [x] Second pass (2026-09-18): saw pivot bug + flipper redraw. **Hidden sore spots** (v1.1 engine): no sore/coping labels anywhere; a sore hit reveals "SORE SPOT FOUND!" and the defender patches it for the rest of the fight. **Repeat penalty**: each reuse of a category by the same attacker lands softer (×0.82 per use, floor ×0.6), shown as "used ×n" on the button. Base damage raised 12–22 → 16–28 to keep fights ~5 rounds. **Audible crowd**: synthesized oooh / roar / boo / murmur keyed to the hit tier. Scott heard only music at first: the crowd envelopes used exponential ramps to ~0, which collapse within ~300 ms, so every reaction was a blip under the beat. Fixed with linear decays + a vocal chorus layer + music ducking + a master limiter; `test/audio.js` now measures it. Title screen has a "Test sound" button and a build stamp for remote debugging. Scott then reported it sounded like "brief white noise, not a crowd" → **1.3.0 rebuilt the crowd from voice synthesis**: 8–36 individual sawtooth voices, each through two vowel-formant filters sweeping oo→oh→ah, with per-voice onset/pitch/vibrato jitter and a rising-falling "OOOoooh" contour; plus applause bursts and "wooo" whoops for the roar and a plosive "b" onset for the boo chant. `test/audio.js` now also asserts spectral flatness (voiced ≈ 0.0–0.1 vs white noise ≈ 0.55). Scott: "I can hear the difference but it still doesn't sound like a crowd." **1.4.0: real recordings.** Seven BBC Sound Effects clips (gasps, booing, laughter, cheer-into-applause; RemArc non-commercial licence, `audio/CREDITS.md`), cut by loudness profile with ffmpeg, 143 KB total, served from `audio/` on Pages. Fetched at load, decoded after first gesture; synth crowd remains the fallback for file:// / artifact / Drive copies. `EBB_URL=http://127.0.0.1:8123/ node test/audio.js` exercises the recorded path.

## Backlog

<!-- Future work, roughly priority-ordered. Not checkboxes — these aren't active yet. -->

1. **v2: news-refreshed roast library** — a backend job (Claude API or a Routine) reads current AI news and regenerates the `news` pool (and optionally seasons the others), emitted as `roasts.js` that sets `window.EBB_ROASTS_OVERRIDE`. Hook already exists in v1. Needs a spec: cadence, voice guardrails, how the refreshed file reaches shared copies.
2. **Line-library punch-up pass** — after playtest feedback; target the weakest ~20% of lines per category.
3. **Sound polish** — loop, sfx, and recorded crowd shipped 2026-09-18. Possible: a second riff for round 4+, remember mute across fights, a distinct clip for the final blow, applause on the result screen.
4. **Bot builder** — let players name a bot, pick body/weapon/palette, and write two signature lines; share as a URL hash.
5. **Best-of-3 with escalating stakes** — round 3 doubles comeback chance; only if single fights feel too short.

## Decisions

<!-- Lightweight ADR table. Prevents re-opening settled questions. -->

| Date | Decision | Context | Status |
|------|----------|---------|--------|
| 2026-09-18 | Built-in hand-written roast library; live LLM generation rejected for v1 | Scott's call at the design fork. A static library is shareable anywhere (artifact, file, Pages) with zero setup, deterministic, and testable. Live generation only works inside Claude artifacts and can stall mid-fight. News-based refresh is v2 via the `EBB_ROASTS_OVERRIDE` hook. | Accepted |
| 2026-09-18 | Single `index.html`, vanilla JS, procedural SVG, no deps | Same identity as Ichigo: instantly playable from `file://` and pasteable as an artifact. Rejected: a bundler or image assets, which would break the share-a-file story. **Amended same day (1.4.0):** small recorded crowd clips in `audio/` are allowed because the share channel became the Pages URL; the single file must still run (with synth crowd) when the clips are absent. | Accepted |
| 2026-09-18 | Recorded crowd audio over synthesis | Two synth passes (noise swells, then formant voice chorus) measured fine but Scott, listening, said neither sounded like a crowd. I can measure sound but not hear it, so for "does this sound like people" real recordings are the honest tool. BBC archive chosen for breadth (gasp / boo / laugh / cheer) and a clear licence; non-commercial only. | Accepted |
| 2026-09-18 | Core/UI split with CommonJS export inside one file | Lets `node test/smoke.js` simulate every bot pairing with zero deps while the shipped artifact stays one file. | Accepted |
| 2026-09-18 | Public GitHub repo + GitHub Pages as the share channel | Scott: "nothing about this needs to be private." A plain URL is the easiest thing to text friends; Pages deploys from `master` root with no build step, and the repo stays a single file. Supersedes the earlier same-day "local only" call. | Accepted |
