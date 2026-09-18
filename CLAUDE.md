# Emotional Battle Bots

A shareable phone/browser game: BattleBots-style robots that do purely emotional damage with snarky lines about each other's looks, alignment, societal impact, AI tropes, and AI headlines. Single `index.html`, vanilla JS, no build, runs from `file://` or as a Claude artifact.

## Goals

- Playable and fully graspable in one ~3-minute session on a phone.
- Shareable with friends with zero setup (one file).
- The roast library is the product: every line should land; keep templating tokens resolved and avoid repeats within a fight.
- v2: refresh the roast library from current AI news via the `EBB_ROASTS_OVERRIDE` hook without touching engine or UI.

## Hard stops

- Never add a third-party network call, analytics, or account requirement to `index.html`. Same-origin static assets (the `audio/` clips) are fine, but the page must still work without them.
- Crowd clips are BBC Sound Effects under the non-commercial RemArc licence (`audio/CREDITS.md`). Never use this project commercially without replacing them.
- Keep the core between the `EBB-CORE-START/END` markers DOM-free so `node test/smoke.js` keeps working.

## End-of-Session Protocol

Follow the `session-closure` skill. Run `node test/smoke.js`, `node test/visual.js`, and `node test/audio.js` before committing.

## Lessons Learned

<!-- Hard-won gotchas specific to this project. Add entries as they come up. -->

- **Web Audio `exponentialRampToValueAtTime` toward ~0 is a cliff, not a fade (2026-09-18).** A ramp from 0.9 to 0.0001 over 1 s is ~35× quieter by 400 ms, so a "1.8 s crowd roar" was audible for a blip and buried under the beat. Use linear decays (or exponential to a real floor like 5% then linear to 0). Never trust a synth sound by reading the code: `test/audio.js` renders it through an OfflineAudioContext and asserts RMS per time window.
