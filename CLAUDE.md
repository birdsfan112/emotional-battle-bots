# Emotional Battle Bots

A shareable phone/browser game: BattleBots-style robots that do purely emotional damage with snarky lines about each other's looks, alignment, societal impact, AI tropes, and AI headlines. Single `index.html`, vanilla JS, no build, runs from `file://` or as a Claude artifact.

## Goals

- Playable and fully graspable in one ~3-minute session on a phone.
- Shareable with friends with zero setup (one file).
- The roast library is the product: every line should land; keep templating tokens resolved and avoid repeats within a fight.
- v2: refresh the roast library from current AI news via the `EBB_ROASTS_OVERRIDE` hook without touching engine or UI.

## Hard stops

- Never add a network call, analytics, or account requirement to `index.html`.
- Keep the core between the `EBB-CORE-START/END` markers DOM-free so `node test/smoke.js` keeps working.

## End-of-Session Protocol

Follow the `session-closure` skill. Run `node test/smoke.js` before committing.

## Lessons Learned

<!-- Hard-won gotchas specific to this project. Add entries as they come up. -->
