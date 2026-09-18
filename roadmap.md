## Status
| Field | Value |
|-------|-------|
| Priority | active |
| Phase | Validate |
| Updated | 2026-09-18 |
| Summary | v1 built and live 2026-09-18: single-file phone-first browser game, 8 bots, 5 roast categories (~80 lines) + signature burns, comebacks, resists, self-care; vs. CPU and Pass & Play; share sheet. Same-day feedback pass: tap-to-continue with a scrolling fight transcript (no line is ever replaced), larger crowd commentary, synthesized arena music + hit/crit/heal/fanfare sfx with a mute button. Node smoke test covers every pairing; headless-Chrome visual test walks every screen. Spec: `docs/specs/emotional-battle-bots-v1.md`. |
| Needs Scott | Play a few fights on your phone and with a friend (Pass & Play); flag lines that land flat and any layout issues on your device. |
| Autonomous | Line-library punch-ups, balance tuning, layout fixes on reported devices. |
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

**Play:** https://birdsfan112.github.io/emotional-battle-bots/ (GitHub Pages, deploys from `master` root on every push). Or open `index.html` in any browser. No install, no build, no network. **Test:** `node test/smoke.js` (engine) · `node test/visual.js` (headless Chrome screenshots). **Remote:** `birdsfan112/emotional-battle-bots` (public).

## Current Sprint

<!-- Active work only. When everything is checked, this section should be empty — a signal to update the Status block. -->

- [x] v1 build: roster, roast library, engine, art, UI, share, smoke test (2026-09-18)
- [ ] [NEXT:scott] Phone playtest (solo + Pass & Play with a friend); note flat lines and layout issues
- [x] Share channel: public repo + GitHub Pages (2026-09-18). Also uploaded to Scott's Google Drive root as a fallback.
- [x] Scott's first-play notes (2026-09-18): lines and crowd commentary vanished too fast → tap-to-continue + persistent scrolling transcript; crowd text enlarged. Background music → Web Audio loop + sfx, mute button.
- [x] Second pass (2026-09-18): saw pivot bug + flipper redraw. **Hidden sore spots** (v1.1 engine): no sore/coping labels anywhere; a sore hit reveals "SORE SPOT FOUND!" and the defender patches it for the rest of the fight. **Repeat penalty**: each reuse of a category by the same attacker lands softer (×0.82 per use, floor ×0.6), shown as "used ×n" on the button. Base damage raised 12–22 → 16–28 to keep fights ~5 rounds. **Audible crowd**: synthesized oooh / roar / boo / murmur keyed to the hit tier.

## Backlog

<!-- Future work, roughly priority-ordered. Not checkboxes — these aren't active yet. -->

1. **v2: news-refreshed roast library** — a backend job (Claude API or a Routine) reads current AI news and regenerates the `news` pool (and optionally seasons the others), emitted as `roasts.js` that sets `window.EBB_ROASTS_OVERRIDE`. Hook already exists in v1. Needs a spec: cadence, voice guardrails, how the refreshed file reaches shared copies.
2. **Line-library punch-up pass** — after playtest feedback; target the weakest ~20% of lines per category.
3. **Sound polish** — basic loop + sfx shipped 2026-09-18. Possible: a crowd "oooh" sample synthesized from filtered noise, a second riff for round 4+, remember mute across fights.
4. **Bot builder** — let players name a bot, pick body/weapon/palette, and write two signature lines; share as a URL hash.
5. **Best-of-3 with escalating stakes** — round 3 doubles comeback chance; only if single fights feel too short.

## Decisions

<!-- Lightweight ADR table. Prevents re-opening settled questions. -->

| Date | Decision | Context | Status |
|------|----------|---------|--------|
| 2026-09-18 | Built-in hand-written roast library; live LLM generation rejected for v1 | Scott's call at the design fork. A static library is shareable anywhere (artifact, file, Pages) with zero setup, deterministic, and testable. Live generation only works inside Claude artifacts and can stall mid-fight. News-based refresh is v2 via the `EBB_ROASTS_OVERRIDE` hook. | Accepted |
| 2026-09-18 | Single `index.html`, vanilla JS, procedural SVG, no deps | Same identity as Ichigo: instantly playable from `file://` and pasteable as an artifact. Rejected: a bundler or image assets, which would break the share-a-file story. | Accepted |
| 2026-09-18 | Core/UI split with CommonJS export inside one file | Lets `node test/smoke.js` simulate every bot pairing with zero deps while the shipped artifact stays one file. | Accepted |
| 2026-09-18 | Public GitHub repo + GitHub Pages as the share channel | Scott: "nothing about this needs to be private." A plain URL is the easiest thing to text friends; Pages deploys from `master` root with no build step, and the repo stays a single file. Supersedes the earlier same-day "local only" call. | Accepted |
