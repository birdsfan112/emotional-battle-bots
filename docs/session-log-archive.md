# Session Log — Emotional Battle Bots

<!-- Append-only. Reverse-chronological. session-closure writes here directly.
     Older entries: no rotation until file exceeds 1000 lines, then oldest 200 move
     to docs/session-log-archive-YYYY.md. -->

---

## 2026-09-18 — Project created, v1 shipped, four live feedback passes, build 1.4.0

**Scaffold + v1 (one targeted question, then build).** Scott asked for a shareable "Emotional Battle Bots" game. Single design fork resolved by AskUserQuestion: built-in roast library now, news-refreshed library as v2. Scaffolded per `new-project` (roadmap, CLAUDE.md, spec in `docs/specs/emotional-battle-bots-v1.md`, bugs-inbox, this log, local git), registered in the Hub Project Directory. Built `index.html`: 8 bots (procedural SVG, idle animation), 5 categories × 16 lines + per-bot signature lines, comebacks, resists, self-care, vs. CPU + Pass & Play, share sheet. `test/smoke.js` (224 simulated fights, template-token and repeat checks) and `test/visual.js` (headless Chrome over CDP, 7 screenshots, page-error capture; no playwright).

**Share channel.** Uploaded to Scott's Google Drive root (he was away from the machine, SSH stuck). Then, on "nothing about this needs to be private": public repo `birdsfan112/emotional-battle-bots`, GitHub Pages from `master` root. Live URL in the share text.

**Feedback pass 1** — lines vanished too fast: tap-to-continue + persistent scrolling transcript with round dividers; crowd text enlarged. Background music: Web Audio synth loop + hit/crit/heal/fanfare sfx, mute button.
**Pass 2** — art: saw spun around the wrong pivot (offscreen); flipper redrawn as hinged plate + ram. Mechanics: sore/coping labels removed from UI; sore spot revealed on first hit then patched for the fight; repeat-category penalty (×0.82/use, floor 0.6) with "used ×n" on buttons; CPU prefers fresh categories; base damage 12–22 → 16–28 to hold ~5 rounds. Crowd made audible (synth).
**Pass 3** — "I only hear music": built `test/audio.js` (OfflineAudioContext shim over CDP, RMS per window). Found exponential-ramp-to-zero envelopes collapsing in ~300 ms → linear decays, limiter, music ducking, Test-sound button + build stamp. Then "brief white noise, not a crowd" → rebuilt as formant voice chorus + applause + whoops; added spectral-flatness assertion. Scott: audibly different, still not a crowd.
**Pass 4** — switched modality: recorded crowd. BBC Sound Effects API (found request shape by reading the site bundle: `criteria.query`), downloaded 10 candidates, chose cuts by loudness profile (`C:\Temp\ebb-profile.py`, scratch), trimmed/normalised/encoded with ffmpeg (installed via winget this session), 7 clips / 143 KB in `audio/` with `CREDITS.md` (RemArc, non-commercial). Same-origin prefetch, decode after first gesture, synth fallback on file://. `EBB_URL=http://127.0.0.1:8123/ node test/audio.js` proves 7/7 load and play. Scott: "MUCH better."

**Open:** friends' feedback on lines and clips; Backlog #1 (v2 news-refresh spec), #2 (line punch-up), #3 (sound polish).

**Deviations:** `new-project` is `disable-model-invocation`; followed its steps manually rather than invoking it (Scott asked to build, not to scaffold). `design-pressure-test` skipped in favour of the small-feature one-question path (memory: `feedback_small_feature_interview_scale`).

**Next session: start by** reading friends' feedback in whatever form Scott relays it, then the line punch-up pass; if any clip is flagged, search the BBC API (`criteria.query`) for a replacement and re-cut with ffmpeg.

**Recorded Misses:** none
