# JAPA: Product Requirements

**Owner:** @ikenna · **Status:** Draft · **Last updated:** 17 Oct 2026
**Companion docs:** [Technical-spec.txt](Technical-spec.txt) (architecture and game-systems detail; the target we are building towards) · [Dev_log.txt](Dev_log.txt) (what has been done) · [GLOSSARY.md](GLOSSARY.md) (terms)

This document covers *what* we are building and *why*. *How* it is built lives in the technical spec. Where they disagree, the open-decisions section below says so.

---

## 1. Summary

JAPA is a free, mobile-first browser game about trying to emigrate ("japa") from Nigeria. Each **run** is one life of about 15–25 minutes. You hustle in Lagos, fight through paperwork, face the embassy, and either land abroad or end up somewhere else entirely: broke, burnt out, refused, scammed, or happily staying home. It is satire built on real obstacles: proof of funds, IELTS fees, visa refusals, japa agents, black tax, the first winter.

## 2. Why now

- **Browser games can spread in Nigeria at huge scale.** Lagos Life launched on 1 Oct 2026 and passed 1M players within days. It runs in the browser with no download, and its world looks like the one outside the window.
- **Japa is a shared national experience.** Almost every young Nigerian has an opinion on it, a story about it, or a group chat about it. That makes it naturally shareable.
- **Lagos Life left gaps we can learn from.** It had an early outage and an in-game money exploit. Our spec is designed to avoid both: core play stays static, and anything with value is checked on the server.

## 3. Goals and non-goals

**Goals**
1. A run that is fun, funny and replayable, where a new player makes a meaningful decision within 30 seconds of opening the page.
2. It looks and feels like a real game, with Lagos Life as the bar for polish. It must never feel like a text quiz.
3. It runs on a cheap Android phone over expensive data (see section 8).
4. Every ending produces a shareable result card that brings new players in.
5. It earns money from players who never pay (sponsor placements, rewarded ads).

**Non-goals (for now)**
- A free-roam open world, or a real-time shared world with other players.
- Open chat with strangers, trading between players, dating features.
- Irregular migration routes such as desert or sea crossings. They are life-or-death, and satire doesn't sit well with them.
- Any card that describes a real method of document fraud.
- Paying to improve your visa chances. Payments can change cosmetics and starting conditions, never the odds at the Gate.

## 4. Who it's for

- **Young Nigerians at home** who are planning, dreaming about or mocking japa. This is the core audience and the main growth engine.
- **Nigerians abroad**, who will recognise every card. They are also the most likely to buy Coins.
- **Nigerians who chose to stay.** The "Stayed and Won" ending exists so the game never reads as anti-Nigeria.

## 5. Core experience

A run moves through five **Acts** (names from the technical spec):

| Act | What happens |
|---|---|
| 1. Lagos Grind | Job, side hustles, rent, family emergencies. Build savings and pick a route. |
| 2. Processing | Exams, applications, proof of funds, agents. |
| 3. The Gate | The embassy interview: a timed minigame with an officer who has a personality. Approved, refused, or administrative processing. |
| 4. Living It | Rent, work, cold, loneliness, black tax, abroad (or at home on a dollar salary, on the Remote Work route). |
| 5. Endgame | December return, settling, coming home, or building something. |

- **Stats** the player manages: Money, Sanity, Documents, Family Pressure, Connections (plus Skill on the Remote Work route). Any one of these can end a run.
- **Routes:** UK, Canada, Germany and Remote Work ("Japa Without Japa"). The prototype starts with the UK only.
- **Endings:** Japa Lord, IJGB King / Queen, Survived Not Thriving, Embassy Regular, Returnee, Stayed and Won, plus the losses (Burnout, Cut Off, Deep Debt). Full conditions are in the technical spec.
- **Between runs:** starting traits (Rich Uncle, First Class, Village People…) unlock through play.

## 6. Look and feel (proposed, pending decisions D1–D5)

Based on hands-on review of Lagos Life (17 Oct 2026):

- **Scenes, not screens.** Each step of the journey is a small 3D place: a Yaba street with danfos, the passport office, the IELTS centre, the embassy waiting room, the airport, a cold flat abroad. Interiors are cutaway "dollhouse" rooms.
- **Style:** chunky low-poly. Buildings are simple blocks in flat colours with soft lighting, and characters are animated with name tags. The style stays readable on small screens and keeps downloads small.
- **Interface floats over the world:** a frosted top bar (date, mood, money), compact stat bars, quest chips, and decision cards that pop up over the scene with the cost shown on each choice.
- **An in-game phone is the hub:** stats, messages, apps, and sponsor apps (Lagos Life already runs real brands this way).
- **Feel:** every choice gives immediate feedback, such as stat pulses, sound, a camera nudge, or the visa stamp with screen shake and confetti.
- **A lite view** for phones that can't run 3D. It still looks good, because a real share of players will only ever see this version.

## 7. Requirements by phase

The dates and gates come from the technical spec.

**Phase 1: Prototype (16–25 Oct)**
- One route (UK), all five Acts, around 30 cards, and The Gate minigame.
- At least three scenes in the chosen visual style, plus the lite view.
- A deterministic game engine, so runs can be replayed and checked later.
- **Gate:** 10 people outside the team play twice without being asked.

**Phase 2: MVP (26 Oct – 15 Nov)**
- Acts 1–3 plus a short Act 4. UK, Canada and Germany, plus the Remote Work route.
- Guest accounts, the in-game currency ledger, server-side run validation, result cards, Paystack, and one sponsor placement.
- **Gate:** the bundle stays within budget, and replayed runs match the original on 100% of recorded runs.

**Phase 3–6:** hardening, soft launch (around 5,000 players), public launch (around 25 Nov, ahead of Detty December), then December live ops. See the technical spec.

## 8. Constraints

- First load ≤ 3 MB (hard ceiling 5 MB). First swipe ≤ 4 s on 3G.
- Works on Android 9 with 2 GB RAM, at 30 fps minimum.
- A full run is playable offline.
- Nigeria Data Protection Act 2023 compliance. The in-game currencies can never be withdrawn as cash.

## 9. Success metrics

| Metric | Target | Source |
|---|---|---|
| Prototype replay | 10 outsiders play twice unprompted | Phase 1 gate |
| Day-1 retention (soft launch) | ≥ 35% | Phase 4 gate |
| Crash rate | < 1% | Phase 4 gate |
| Time to first meaningful decision | ≤ 30 s | Onboarding target |
| Ending balance | Every ending reachable, none above 40% of runs | Content pipeline rule |
| Share rate | To set after soft launch | — |

## 10. Open decisions

| # | Decision | Recommendation | Status |
|---|---|---|---|
| D1 | Game shape: 3D scene per step + floating cards + phone hub (vs. swipe cards only, vs. open world) | Scenes + cards + phone | Awaiting @ikenna |
| D2 | Art: code-built low-poly world + free animated character models + 2D lite view | Yes | Awaiting @ikenna |
| D3 | Single-player for now, with game-controlled characters to make scenes feel alive | Yes | Awaiting @ikenna |
| D4 | Keep the spec's 3 MB / 2 GB RAM / 30 fps limits with richer graphics | Yes | Awaiting @ikenna |
| D5 | Test 3D on a phone over local Wi-Fi (dev Mac can't render 3D) | Yes | Awaiting @ikenna |
| D6 | How players decide: swipe left/right (spec) or tap 2–3 buttons on the card (Lagos Life, current build) | Open: tap allows a third "easy-out" choice, swipe is faster and more tactile | Open |
| D7 | Vocabulary: spec's Act / Card / Stat / Trait vs. the glossary's Stage / Event / Meter / Archetype | Adopt the spec's terms | Open |
| D8 | Toolchain: the spec's TypeScript + Vite + Preact + PixiJS vs. plain JavaScript while npm is blocked on the dev Mac | Plain JS until npm is fixed. Three.js would replace PixiJS if D1/D2 are accepted | Open |
| — | Spec's own open items: API host, Postgres provider, ad network, team size | See the technical spec | Open |

## 11. Risks (product)

- **Tone backlash.** The game could be read as mocking emigrants or Nigeria. *Mitigation:* playtest the writing with all player types, keep "Stayed and Won", and use satire with consequences.
- **The novelty fades.** Viral browser games often lose players fast. *Mitigation:* weekly content drops, seasonal events (Detty December), and shareable endings.
- **Copycats within days.** *Mitigation:* ship fast and lock in sponsor deals early.
- **Graphics ambition outruns the device floor.** *Mitigation:* the lite view is a first-class product, and the CI budget check fails the build when it's exceeded.

## 12. References

- Lagos Life coverage: [BusinessDay](https://businessday.ng/technology/article/lagos-life-crosses-1m-players-as-nigerian-built-browser-game-goes-viral/), [WeeTracker](https://weetracker.com/2026/10/06/lagos-life-game-nigeria-browser-gaming-explodes/), [Leadership](https://leadership.ng/from-viral-game-to-10m-valuation-lagos-lifes-eight-day-rise/)
- Hands-on review of lagoslife.app and @ikenna's screenshots, 17 Oct 2026 (summarised in the dev log).
