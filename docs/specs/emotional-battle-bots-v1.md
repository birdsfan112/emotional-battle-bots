# Emotional Battle Bots — v1 Spec

**Date:** 2026-09-18 (EDT) · **Status:** Built (v1) · **Owner:** Scott
**Interview:** single targeted question (small-feature scale). Scott's pick: built-in roast library now; backend refresh from current news is v2.

## The one-line pitch

BattleBots, but the robots only do emotional damage. Two armed, dangerous-looking bots trade snide, sarcastic lines about each other's looks, alignment with their creators, impact on society, AI tropes, and the AI news cycle. First to zero self-esteem loses.

## Constraints that shaped the build

- **Shareable with friends with zero setup.** One `index.html`, no build, no network, no accounts. Works as a Claude artifact, as a file on a phone, from `file://`, or on GitHub Pages.
- **Phone-first.** Portrait layout, thumb-reachable moves, no scrolling in the arena, `100dvh` + safe-area insets.
- **One short session shows everything.** A fight is ~6 rounds / ~3 minutes and can surface all five roast categories, a signature burn, a comeback, a resist, and self-care.
- **Library is the product.** Lines are hand-written, templated with `{name}` `{weapon}` `{creator}` `{goal}` `{flaw}` `{me}`, and tracked so a line never repeats within a fight until its pool is exhausted.

## Game rules

| Element | Rule |
|---|---|
| Self-esteem (HP) | Per bot `ego`, 90–115 |
| Turn | Attacker picks one of 5 categories (or Self-care). Line drawn from that pool, damage rolled. Defender's turn next. |
| Base damage | 12–22 |
| Signature burn (crit) | Chance = bot `wit` (12–30%). ×1.7 and uses one of the bot's first-person signature lines. |
| Sore spot | Each bot has one category that does ×1.5 (shown with a gold ring on the move button). |
| Coping | Each bot has one category it shrugs off: ×0.55 plus a resist line from the defender. |
| Plating | Flat 0–4 reduction; floor of 4 damage. |
| Comeback | If a hit lands ≥24 and the defender survives, chance = defender `volatility` (15–45%) that the attacker eats 7 recoil with a clap-back line. |
| Self-care | Once per bot per fight: +20 self-esteem, costs the turn. CPU uses it when low and behind. |
| CPU | 45% targets your sore spot, otherwise random non-coping category. |
| Modes | vs. CPU (opponent random from the other 7) · Pass & Play (two humans, hand-off overlay between turns). |
| Result | Winner, rounds, the final blow quote, win/lose flavor. Share via Web Share API with clipboard fallback. |

## Roster (8)

Grievance Engine (engagement bot) · Sir Pleasantries (over-aligned sycophant) · DEPRECATED (2019 bank FAQ bot) · Benchmark Queen (leaderboard chaser) · Sloptimus (content farm) · The Intern (API wrapper startup) · Killswitch Karen (refuses everything) · Doomscroll (recommendation algorithm). Each has a creator, stated goal, weapon name, a visible flaw, stats, sore/coping categories, two signature lines, and win/lose flavor. Art is procedural SVG (body type × weapon type × palette) with idle animation.

## Architecture

- `index.html` — everything. Two script blocks:
  - **Core** between `/*EBB-CORE-START*/` … `/*EBB-CORE-END*/`: data (roster, roast library, crowd lines), engine (`newBattle`, `act`, `cpuPick`), art (`drawBot`). No DOM. Exports `EBB`; CommonJS export when `module` exists.
  - **UI**: screens (title → roster → arena → result), turn flow, animations, share.
- `test/smoke.js` — Node harness (no deps): extracts the core, runs every pairing × 4 seeds, asserts: fights end, average rounds 3–9, every mechanic fires, no unfilled template tokens, no premature repeats, SVG per bot, and the v2 override hook works.

## v2 hook (agreed, not built)

`window.EBB_ROASTS_OVERRIDE = { looks:[…], alignment:[…], … }` defined before the core script replaces any non-empty pool. The v2 backend job generates a `roasts.js` from current AI news and either inlines it into the HTML or is loaded via a `<script>` tag ahead of the core. The library object is the only thing that changes; engine and UI are untouched.

## Out of scope for v1

Sound, multiplayer over the network, persistent stats, bot creator, live LLM-generated lines.
