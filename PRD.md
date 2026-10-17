# JAPA — Product Requirements Document

**Working title:** JAPA: The Long Way Out  
**Owner:** @ikenna  
**Status:** Canonical product source of truth (v3 + locked decisions)  
**Revision date:** 17 October 2026  
**Revision note:** Version 3 restores open-world exploration and meaningful world interaction as core product requirements. Retention, viral growth, Nigerian monetisation, financial simulation, route-specific immigration learning and the JAPA Codex are designed to live inside the explorable world—not replace it. Destination rules are treated as versioned content and must be rechecked before release. The **Decision log (§0)** records the decisions locked on 17 Oct 2026; where it conflicts with later sections, §0 wins.  
**Product type:** Free, mobile-first browser game; open-world Nigerian life simulation / migration adventure with narrative RPG, financial strategy and social-deduction systems  
**Primary market:** Nigerians aged 18–35 in Nigeria and the diaspora  
**Companion documents:** [`Technical-spec.txt`](Technical-spec.txt) (how it is built; reconciled with this PRD on 17 Oct 2026) · [`Dev_log.txt`](Dev_log.txt) (what has been done) · [`GLOSSARY.md`](GLOSSARY.md) (terms) · [`docs/adr/`](docs/adr/) (architecture decisions) · [`docs/history/`](docs/history/) (superseded PRDs, kept as history)

> **Document boundary:** This PRD defines the product, experience and acceptance criteria. It does not replace the technical specification. Architecture, persistence, security and performance detail lives in the technical spec, which follows this PRD where they disagree.

---

## 0. Decision log (locked 17 October 2026)

This PRD replaces the earlier scenes-and-cards PRD (`docs/history/PRD_v1_scenes-and-cards_2026-10-17.md`). The unedited v3 research draft is kept at `docs/history/PRD_v3_source_open-world_2026-10-17.md`. Decisions were made with @ikenna in a design review on 17 Oct 2026.

### Product shape and scope

| # | Decision |
|---|---|
| Q1 | This document (v3) is the product source of truth. The old `PRD.md` is history. The technical spec is reconciled to this PRD. |
| Q2 | **25 November 2026 is a soft date.** The Phase 1 vertical slice is the real gate; the launch date is set after it exists. Detty December is a nice-to-have, not a deadline. |
| Q3 | **The team is @ikenna + Claude.** No budget for paid reviewers before launch. Phase 0 shrinks to ~5 informal interviews; @ikenna fact-checks immigration claims against official pages, with dated sources. The two-reviewer content gate is deferred to post-launch content. |
| Q5 | **A run is a fresh life in a fixed, persistent world.** Each run starts a new character in the same district; character, money, relationships and quests reset. Endings close the run and produce the JAPA Receipt. Unlocks (backgrounds, discovered locations on the map, Codex entries) carry over. |
| Q9 | Resources are v3's five: **Funds, Energy, Readiness, Home ties, Risk sense.** "Sanity" is not used. |
| Q10 | The existing deterministic engine becomes the **simulation core** under the 3D world. The 27 existing cards become **Events triggered by places and NPCs** (e.g. talking to the landlord fires "Rent Is Due"). Nothing is deleted; only presentation changes. |
| Q11 | Act 4 (the Gate) is a single explorable interior (a visa-centre waiting room). Act 5 abroad is a **compact abroad hub**: one shared flat with flatmate NPCs plus one street (shop, workplace, bus stop), built from the same building kit with a colour and weather change. |
| Q13 | **Free at launch, monetise later.** No payments, ads or currency ledger at launch. |
| Q15 | Launch content: **UK Student** migration route plus **Stay and Build** as a full, equal path; all three backgrounds (Fresh Graduate, Working Professional, Family-Funded Applicant). UK Skilled Worker is the first content update. The vertical slice uses Fresh Graduate only. |
| Q16 | **Time moves by action.** Walking is free; activities cost in-game hours (shift 8h, danfo trip 1h, chat 15 min); sleeping ends the day. Sky and NPC schedules follow the in-game clock. No real-time clock. |
| Q24 | **Only Funds and Energy can end a run.** Funds: first crisis → warning and recovery options (cut spending, extra work, family bailout that costs Home ties and may add obligations); a second collapse needing another bailout ends the run as **Deep Debt**. Energy: zero → forced rest day with time and money consequences; a second collapse ends the run as **Burnout**. Both give a clear warning before the final loss. Readiness, Home ties and Risk sense never end a run; they shape opportunities, risks and endings. Every ending has a debrief (key decisions, consequences, alternative strategies) and a prominent **Try a Different Plan**. |
| Q27 | The vertical slice is defined in §0 "Vertical slice" below. |
| Q31 | Order of work: (1) docs (this revision), (2) half-day 3D performance spike on the test phone, pause for @ikenna to review screenshots, (3) vertical slice. |

### Technology

| # | Decision |
|---|---|
| Q4 | **Three.js low-poly 3D**, checked through the adb loop on the test phone (Infinix HOT 40i). It is gated by a half-day spike: one low-poly street block (~20 buildings, a walking character, 5 NPCs, shadows on/off). **Pass = 30+ fps with shadows off.** If it fails, fall back to isometric Canvas2D. The test phone is above the 2 GB device floor; a 2–3 GB Android must be tested before closed beta. See ADR 0001. |
| Q12 | **Static launch, switchable backend.** Launch is static files only (Cloudflare Pages): no accounts, no gameplay server, no database. Save, share and social go through one interface with a `local` adapter (device + share link) and a `server` adapter selected by a single config flag, so turning the backend on means writing the server adapter, not rewriting the game. No cross-device save at launch. See ADR 0002. |
| Q17 | Buildings and props are **generated in code** (boxes + colour blocking). Characters use **one free CC0 animated model** (e.g. Quaternius or Kenney: walk, idle, talk, wave), recoloured and re-outfitted for every NPC. A custom character can be commissioned later. |
| Q25 | **Lite mode** is a 2D top-down Canvas renderer driven by the same world data, engine and interaction systems. See "Lite mode" below. |
| Q26 | **Analytics-only backend exception**: a small Cloudflare Worker for approved events plus Cloudflare Web Analytics. See "Analytics" below. |
| Q29 | Retention uses a **random on-device ID**, stored locally, not linked to personal data, resettable ("reset analytics ID"), not sent when the player opts out, and described in the privacy notice as **pseudonymous, not anonymous**. |
| Q30 | **Sound is on by default at low volume** (a deliberate change from v3's "audio defaults to off"), with a mute button always visible. Lagos ambience (conductors calling stops, generators, horns, a distant church PA) is part of the "familiar" feel. Fully playable on mute: every spoken line has a text bubble. Audio loads only after first control, so it never delays first paint. |

### Social

| # | Decision |
|---|---|
| Q6 / Q7 | **Single-player world at launch with async social; live presence is the first major update.** Launch social is packed into share links: friend run seeds, comparing outcomes, visiting a friend's room as a snapshot. The architecture is ready for presence from day one (player IDs, network-serialisable avatar state, world state separate from rendering). |
| Q8 | Live presence ships with **avatars + emotes + preset phrases + visiting friends' rooms**. Co-op activities (split a danfo fare, a paired hustle) and the Agent Check scam challenge come after. **No free-text chat**, ever, without a separate risk assessment. The preset-phrase list is written to be funny and Nigerian. |

### World and Lagos identity

| # | Decision |
|---|---|
| Q14 / Q18 | **Real Lagos landmarks in a compressed geography** ("Lagos in one walk"), so it feels very familiar without players being able to say exactly why. A few connected zones, each anchored on one real landmark: an Ojuelegba-style roundabout and bus park, a Computer Village-type gadget market, a Yaba/Tejuosho-style market street, with Third Mainland Bridge and the Lekki/VI skyline visible on the horizon (not walkable). Real distances shrink; the layout is ours. Under the landmarks sits an **everyday-detail layer**: yellow danfos with conductors, kekes, POS umbrellas, "THIS HOUSE IS NOT FOR SALE" on walls, gutter planks, generator hum, church banners. |
| Q19 | Public landmarks are used freely. **Businesses use made-up names with familiar colour schemes.** Real brands appear only through paid sponsor deals later. |
| Q20 | **@ikenna is the authenticity reviewer**, supplying or selecting references for each anchor landmark and approves each zone from a test-phone screenshot before it is final. Claude researches and drafts the rest. |

### Look and feel, after the 3D spike (17 Oct 2026)

| # | Decision |
|---|---|
| Q4 result | **The 3D spike passed** on the test phone: 20 buildings, a walking player and 5 NPCs ran at 60 fps (p95 frame 17.6 ms) with shadows off, and 55 fps with shadows on in the worst-case full-junction view. 3D is confirmed. Shadows are for capable phones only. |
| Q32 | **Characters use the Quaternius Ultimate Modular Men and Women packs (CC0)** as the base: real human proportions, 24 shared animations. JAPA makes them Nigerian: recoloured outfits, ankara patterns generated in code, kaftan and agbada over the base body, and Nigerian hair and headwear (low cut, braids, afro puffs, gele). Weapons and hairstyles that don't fit Lagos are removed. RG Poly Cartoon City was rejected (chibi style, skin colour baked into a texture). Raw packs are not committed; the game ships one compressed male and one female base model plus a shared animation file. |
| Q33 | **Seven skin tones, all used**, deepest to lightest: `#2A160D`, `#3A1F12`, `#4B2715`, `#5C311A`, `#6E3B1F`, `#83492A`, `#9A5A34`, all with warm red-brown undertones and a slight sheen. NPCs are spread across the range, with the deeper tones most common; the player picks their own tone. |
| Q34 | **Faces must stay readable at every skin tone.** Characters get a warm fill light from the camera side and a soft back light; skin gets a warm inner glow that is stronger for deeper tones; pupils stay dark and glossy. Add eye whites in the slice so the deepest faces read in shared screenshots. Check every new character, outfit and lighting change on the deepest tone first. |
| Q35 | **Portrait by default, landscape supported**, like Lagos Life. In landscape the camera shows a wider view of the street; controls and panels adapt. |

### Camera, controls and interaction (Q21–Q23)

**Q21 — Camera and controls.** An elevated third-person camera follows the player, angled about 50° down and close enough to see expressions, nearby props and interactions on a 720px-wide screen.
- Mobile: virtual joystick on the left; one contextual action button on the right.
- Desktop: WASD to move, E to interact.
- The contextual button changes with the nearest valid interaction: Talk, Enter, Buy, Inspect, Use, Pick Up.
- Smooth following, collision handling around buildings and props, readable positioning indoors and outdoors.
- Controls stay responsive without covering important characters or interaction targets.

This camera is part of JAPA's visual identity. Do not replace it with a fixed, tilted overhead view simply because that is easier to implement.

**Q22 — Going inside buildings.** Small buildings (house, shop, cybercafé) are entered seamlessly: the camera stays in the same world and the roof and obstructing front walls fade, so the player keeps moving inside with no loading screen. Large interiors (visa application centre, airport) may load as compact separate scenes after a short transition.
- Preserve player position and interaction continuity.
- Roofs and walls never hide the player.
- Entrances are discoverable and consistently interactable.
- No separate scene load for every small building.

World continuity is a core requirement, not a visual extra.

**Q23 — How decisions look.** JAPA must not feel like a text-based quiz with a background image.
- NPC dialogue appears in speech bubbles above or near characters.
- The environment stays alive: ambient NPC behaviour, vehicles, environmental animation.
- Decisions appear in a bottom sheet with two to four clearly labelled buttons, covering no more than the bottom third of the screen under normal conditions.
- Options show relevant costs: naira, time, Energy and other resources.
- Tap on mobile; mouse and keyboard on desktop. No swipe.
- Consequences play out in the world: money leaves the player's hand, characters react, objects change, and short indicators appear (`+Home ties`, `−₦25,000`).
- Ambient animation may continue while a decision is open, but no consequential timer penalises players for reading their options.

### The in-game phone (Q28)

Keep the phone as an important part of JAPA, with an original visual identity: a **budget Android with a cracked screen**, familiar interface details and fictional apps. Group-chat-first, with contextual notifications, not a copied app grid.

Initial apps:
- **Family Group:** family expectations, financial requests, obligations, major announcements.
- **Japa Plug:** agent messages, rumours, referrals, suspicious offers, peer discussions.
- **Voice Notes:** recorded conversations and messages players can investigate.
- **Travel File:** documents, application progress, deadlines, missing requirements.
- **Money Map:** income, expenses, savings, debt, family obligations, migration costs.

Phone contents react to player decisions and progress; messages can reveal opportunities, create dilemmas, start quests or expose scam warning signs. The phone complements the open world and never replaces exploration, NPC conversations or in-person activities. Original interface designs and fictional brands only, unless a real brand partnership is agreed.

### Lite mode (Q25)

A 2D top-down Canvas renderer powered by the same world data, engine and interaction systems as the 3D mode. It must preserve: character movement and collision; the same map layout, buildings and locations; NPCs, dialogue, quests and interactions; decisions, consequences, inventory and progression; save and resume. Only the presentation changes. Both modes use the same simulation logic and a compatible save format; switching modes never resets progress or changes quest outcomes. Lite mode is a first-class way to play and the means of testing game logic on devices without WebGL.

### Analytics (Q26)

The game stays playable without a gameplay backend. A small Cloudflare Worker receives approved analytics events; Cloudflare Web Analytics covers site traffic. The analytics adapter is switchable: if the Worker fails or is disabled, movement, quests, saving and result cards keep working.

Launch event set (supersedes the §16 list where they differ):

| Event | Purpose |
|---|---|
| `game_start` | Measure new runs |
| `first_movement` | Understand onboarding |
| `first_interaction` | Measure time to engagement |
| `choice_made` | Understand decision behaviour |
| `quest_completed` | Measure progression |
| `run_ended` | Analyse endings and failure |
| `result_shared` | Measure sharing |
| `game_resumed` | Support retention analysis |

Privacy requirements:
- No names, phone numbers, email addresses or precise location in gameplay telemetry.
- No advertising trackers, fingerprinting or third-party tracking cookies.
- No raw IP addresses persisted in analytics records.
- Validate events, apply rate and retention limits, batch requests where practical.
- An appropriate privacy notice and an analytics opt-out.
- The retention ID (Q29) is documented as pseudonymous, and its privacy implications are reviewed.
- The analytics interface is independent of the game engine.

References: [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) · [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/). Re-verify free-tier limits and terms before launch.

### Vertical slice (Q27)

The first playable for ten external testers covers one compact, explorable Lagos zone. It tests the game's foundations; it does not limit the full game's scope.

**Zone:** the player's face-me-I-face-you compound room · the street outside · an Ojuelegba-inspired bus stop · a cybercafé.

**Characters:** the landlord · a neighbour · a cousin (through the in-game phone) · the cybercafé owner · a suspicious migration agent.

**Opening quest:**
1. **6:43 a.m. — Wake Up:** establish the player's circumstances and introduce movement.
2. **Rent Is Due:** the immediate financial pressure.
3. **The Voice Note:** a believable but suspicious offer promising a guaranteed visa.
4. **Verify or Pay:** investigate the agent, inspect the evidence, make a consequential decision.
5. **JAPA Receipt:** a shareable result based on the player's decision.

**Acceptance criteria:**
- Fresh Graduate is the only starting background.
- Low-graphics mode is supported.
- Save and resume work correctly.
- The player moves freely, enters supported interiors and interacts with the essential NPCs.
- The scam lesson is taught through gameplay and consequences, not a lecture.
- Completing the quest generates a shareable JAPA Receipt.
- Ten people outside the development team play twice without being prompted to replay.

The slice tests the hardest foundations first: movement, in-world interaction, continuity, consequential decisions and the educational loop. The full game then expands into more districts, activities, characters, routes and storylines, without reverting to a menu-driven, text-first game.

---

> **Version 3 correction:** The previous revision over-prioritised differentiation and low-data delivery, and incorrectly downgraded free-roam exploration. This version restores open-world interaction as a P0 product requirement.

## 1. Executive decision

JAPA should be an **open-world Nigerian life simulation built around the migration journey**. Players must be able to move through a recognisable Lagos environment, enter meaningful locations, meet characters, interact with objects and services, take jobs and hustles, discover stories, and see the world respond to their decisions. Migration is the central long-term ambition—not a reason to reduce the game to a sequence of static cards.

> **Core promise: Live your Lagos life, build your route out (or build a good life here), and deal with the people, money, opportunities, risks and consequences along the way.**

The world itself is part of the fun. Players should remember a particular street, mechanic, landlord, cybercafé, family visit, bus ride, agent encounter or late-night conversation—not only a final score. Story choices, financial simulations, immigration learning and shareable outcomes deepen the open world; they do not replace free movement and interaction.

### Non-negotiable product direction

1. **Open-world interaction is a core requirement, not a post-MVP aspiration.** The player controls an avatar and explores connected, explorable spaces. At a minimum, the first public version must include a playable Lagos district with multiple discoverable locations, NPCs, interactable objects, quests and consequential activities. The world can be compact and carefully scoped; it cannot be a slideshow or a static scene selector disguised as an open world.
2. **Build a world with its own identity.** JAPA may use stylised 3D or 2.5D, a distinctive camera, original character design, local architecture, sound, colour and interaction grammar. Differentiation from Lagos Life must come from JAPA’s migration-driven systems, storytelling, world structure and art direction—not from deleting world exploration.
3. **Make Nigerian specificity functional.** Rent, transport, job hunting, family obligations, power/internet reliability, side hustles, remittances, friendships, relationships, housing and December plans should alter what the player can do and what happens next.
4. **Make locations and characters useful.** A place should offer something to discover, do, obtain, learn, risk or remember. NPCs should have roles, dialogue, schedules or states where practical; they must not be decorative crowds only.
5. **Make scam awareness part of the world.** Players encounter fictional migration agents, suspicious messages and risky offers through believable locations and conversations, then learn safe verification habits. Do not provide a how-to manual for fraud or reward harassment of real players.
6. **Make the world produce shareable moments.** Funny encounters, unexpected consequences, memorable NPC dialogue, close calls, outfit/room/arrival moments and endings should be capturable as spoiler-safe JAPA Receipts or story cards.
7. **Retain players through freedom and discovery.** Give players long-term goals, side quests, social recognition, progression and seasonal changes. Do not rely on pay-to-win, punishing streaks, manipulative random rewards or artificial waiting timers.
8. **Optimise delivery without removing agency.** Use compact districts, streamed assets, level-of-detail, reusable props and a graceful low-data mode. Performance budgets dictate how the world is loaded and rendered; they do not negate the open-world requirement.

### One-sentence pitch

**JAPA is an open-world Nigerian life game where you hustle through Lagos, build relationships, chase migration plans, spot traps, survive the consequences and decide what a better life means to you.**

### Potential tagline

**Everybody get plan. The question is wetin the plan go cost you.**

The tagline is a creative direction to test, not approved final copy.

### Scope language used in this PRD

- **Open-world exploration (P0):** player-controlled movement through explorable spaces, with meaningful interaction with people, objects, services and activities. This is required for the first public version.
- **Connected district world (P0):** a compact world made of connected or seamlessly transitioned neighbourhood areas. The first release does not need a whole real-world-scale Lagos map.
- **Live multiplayer (decision, not assumption):** real-time presence and interaction between human-controlled avatars is separate from open-world exploration. It must be explicitly decided after technical review; it must not be silently used as a reason to remove the single-player open world. The architecture should avoid blocking future shared spaces if feasible.
- **Narrative decisions (P0):** dialogue, phone messages, documents and decision menus exist inside the world and are used for deeper choices—not as the entire game.

## 2. The problem and the opportunity

For many young Nigerians, migration is simultaneously a practical plan, a family conversation, a financial gamble, a social status signal and a source of fear. Some people are actively preparing to leave; some want to leave but cannot afford the first step; some have been misled by agents or online claims; some leave and struggle; and others build good lives without emigrating.

JAPA can turn this complicated and emotionally charged subject into an entertaining game that offers three forms of value:

- **Recognition:** “This is exactly what happened to my guy / cousin / colleague.”
- **Agency:** “I can see the trade-offs and make a different choice next run.”
- **Practical awareness:** “I know which promises to question and how to verify information before sending money or personal details.”

It should not tell every player to leave Nigeria, tell every player to stay, or imply that the game can predict a real visa decision. The story should make both migration and staying feel like real, complicated paths.

### Research signals

- Afrobarometer reported in December 2024 that **56% of Nigerians had considered emigrating**, including **60% of people aged 18–35**. Finding work and escaping economic hardship were the most commonly cited motives in that survey. This supports a broad, relatable premise; it does not prove that every young Nigerian wants to leave. [Afrobarometer: Majority of Nigerians have considered emigration](https://www.afrobarometer.org/articles/majority-of-nigerians-have-considered-emigration-in-search-of-opportunity-new-afrobarometer-survey-finds/)
- Nigeria’s National Bureau of Statistics and IOM 2023 report on intending and returned migrants describes economic factors as major drivers and includes job-seeking, hardship, return and migration-risk findings. Its research covers ten states and the FCT, so individual percentages must be quoted with that context rather than presented as a current national census. [NBS/IOM 2023 Migration Survey Report (PDF)](https://www.nigerianstat.gov.ng/pdfuploads/MIGRATION%20SURVEY%20REPORT%202023.pdf)
- LEAP Africa’s 2024 Japa report studies migration aspirations among young Nigerians, including their assumptions and expectations. Use it as a source for narrative discovery and character research, not as a substitute for direct player interviews. [LEAP Africa: Japa Report](https://leapafrica.org/japa-report/)
- Official UK and Canadian guidance documents recurring immigration-scam warning signs: guaranteed outcomes, pressure to act quickly, fake job offers or official identities, requests to pay through inappropriate channels, and requests for private information. These are useful foundations for the game’s scam-awareness scenarios. [UKVI fraud guidance](https://www.gov.uk/government/publications/frauds-tricks-and-scams/fraud-tricks-and-scams) · [IRCC immigration fraud guidance](https://www.canada.ca/en/immigration-refugees-citizenship/services/protect-fraud.html)
- Press reporting in October 2026 says Lagos Life rapidly attracted a very large audience. At least one report explicitly notes that its user figures are based mainly on the game’s own dashboard and have not been independently audited. Treat the reported scale as a signal of interest in culturally specific browser games, not a verified market-size estimate or a guarantee that JAPA will spread similarly. [Vanguard coverage](https://www.vanguardngr.com/2026/10/lagos-life-game-crosses-2-million-users-heres-how-to-play/) · [BusinessDay coverage](https://businessday.ng/technology/article/lagos-life-crosses-1m-players-as-nigerian-built-browser-game-goes-viral/)
- Research on mobile-game onboarding notes that the first few minutes are a high-risk point for churn. Research on player motivation commonly examines autonomy, competence and relatedness; these are better design foundations than simply adding streaks and reward loops. [Mobile-game onboarding study](https://portal.findresearcher.sdu.dk/en/publications/identifying-onboarding-heuristics-for-free-to-play-mobile-games-a/) · [Self-determination theory and game design review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12487717/)
- GeoPoll and the Pan Africa Gaming Group describe a survey of more than 2,000 gamers in Nigeria, Egypt, Kenya and South Africa covering genres, platforms, session habits, spending and localisation. Use the report to inform discovery, but validate its implications with JAPA’s actual audience. [GeoPoll/PAGG: Gaming in Africa report](https://www.geopoll.com/resources/gaming-africa-report/)
- Wordle is a useful *pattern reference*, not a template to copy: its creator described a simple browser experience, no sign-up, a low-effort result share and a common daily challenge that gave friends and group chats something to compare. He also acknowledged the role of timing and luck in virality. JAPA should adopt the principles of low friction and social conversation, not Wordle’s puzzle format or exact share visual. [TechCrunch interview with Josh Wardle](https://techcrunch.com/2022/01/12/josh-wardle-interview-wordle/)
- Research on sharing a digital game found that positive emotions predicted sharing during play, while negative emotions predicted sharing after play in the study context. Treat this as a prompt to test a range of emotionally meaningful moments—not as a universal formula for virality. [Cohen, *What makes good games go viral?*](https://www.sciencedirect.com/science/article/pii/S0747563213002513)
- GSMA’s 2025 smartphone-adoption report highlights a substantial Nigerian mobile-internet usage gap and reports 27% population-wide smartphone ownership in 2024. That statistic is not a measure of JAPA’s target audience, but it reinforces the need for a low-data fallback and careful testing on affordable devices. [GSMA smartphone adoption report](https://www.gsma.com/about-us/regions/africa/wp-content/uploads/2025/11/GSMA-SmartPhone_Adoption_Report_sm.pdf)
- A 2026 systematic review of research on dark patterns and random rewards in games discusses associations with problematic play and gambling-related outcomes, while also noting limitations in the underlying studies. JAPA should use that as a reason for deliberate, transparent design—not as proof that every reward mechanic is harmful. [2026 systematic review](https://www.sciencedirect.com/science/article/pii/S1875952126000443)

### What this evidence does—and does not—justify

It supports the relevance of the subject, the need for culturally grounded storytelling, and the inclusion of scam-awareness mechanics. It does **not** establish the right art style, ideal run length, likely viral coefficient, or retention rate for JAPA. Those decisions must be tested with Nigerian players.

---

## 3. Product vision, principles and positioning

### Vision

Create the most recognisable interactive Nigerian migration story: a game that players enjoy for its drama and humour, remember for its choices, and share because their outcome says something about them or their friends.

### Product principles

**1. The details must feel lived-in.** Every scene needs at least one recognisable Nigerian truth beyond slang: a cost, relationship, constraint, workaround, sound, ritual or social expectation that affects play.

**2. Choices need consequences.** Choices should change money, time, relationships, information, readiness or future events. Avoid cosmetic decisions masquerading as meaningful choices.

**3. Funny, not cruel.** The satire should punch up at exploitative systems, status anxiety, bureaucracy, false certainty and everyday contradictions. Do not humiliate people for being poor, being refused a visa, returning home, or being deceived.

**4. No single morally correct life.** Migration, remote work, return and staying are all legitimate routes. A “Stayed and Won” ending must be as satisfying as an abroad success ending.

**5. The player must understand the stakes.** Explain known costs before a decision. Keep some information hidden where uncertainty is the story, but do not hide critical controls, real-world safety information or monetisation terms.

**6. Nigerian by design, not by costume.** Avoid relying on random pidgin phrases, flags, danfo images or cultural shorthand as a substitute for deep local context.

**7. A real world, not a menu pretending to be one.** Players can move, explore, approach characters, interact with objects and discover activities without every action being gated by a narrative card.

**8. Fast to enter, rich to replay.** A new player should gain control and discover a meaningful interaction quickly, then find enough depth to justify another run.

**9. Respect the player’s time and data.** The game must work well on lower-cost Android devices and inconsistent networks. Stream or cache areas progressively; do not replace the world with static screens merely to meet a payload target.

### Positioning

JAPA is an **open-world life simulation and migration adventure** with narrative RPG, money-management, exploration, relationship, quest and social-deduction systems. It is not a real-world immigration calculator or visa-advice service. A massive seamless MMO is not required to qualify as open world: free movement and meaningful interaction in connected explorable areas are required.

### Differentiation from Lagos Life

JAPA should not copy Lagos Life’s distinctive assets, interface, character designs, terminology, map layouts or signature interactions. But it should **not differentiate by abandoning the open-world experience**. Open-world interaction is a valid and valuable part of JAPA’s own intended product; the distinction is what players do, why they do it and how the world responds.

| Dimension | JAPA’s intended identity |
|---|---|
| Core fantasy | Build a life in Lagos while pursuing, reconsidering or completing a migration plan |
| World | A compact but explorable Lagos world with connected districts, enterable locations, landmarks, NPCs, usable objects and discoverable activities |
| Core activity | Move through the world, work and hustle, build resources and relationships, complete quests, investigate claims, make route decisions and experience consequences |
| Long-term goal | Develop the player character and their circumstances over time, with migration, remote work, return and staying/building all available as meaningful outcomes |
| Signature systems | Migration planning embedded in world activities; scam-awareness encounters; family pressure; financial runway; jobs and side hustles; route-specific paperwork; living-abroad simulation |
| Story delivery | In-world encounters, dialogue, interactions and events, supported by a phone, map, inventory, finance view and concise decision panels |
| Social layer | Shareable emergent stories, friend challenges and an explicit decision about live multiplayer; not merely end-of-run score sharing |
| Visual direction | Original JAPA art direction built around the migration journey, local environments and distinctive world interactions; never a clone of another game’s visual language |
| Session structure | Players can free-roam and do side activities, while clear quests and an optional 15–25 minute migration-focused run provide a strong sense of progress |

The public reports about Lagos Life are useful context, but they are not a reason to remove a feature JAPA needs. The team should play the current product directly and maintain a “do not copy” list. Create differentiation through original locations and stories, deeper migration/financial systems, character arcs, quest design, world simulation, and the consequences of living with a plan—not by turning the world into a static illustrated dossier.

## 4. Target players and jobs to be done

### Primary audience

Nigerians aged 18–35 who are familiar with the language, pressures and online conversations around japa. They may be in Nigeria or part of the diaspora. The game should be approachable to people who do not identify as gamers.

### Player segments

**The active applicant** — Has an intended route, is pricing exams, tuition, paperwork or relocation, and is vulnerable to information overload and overconfident promises.

**The “I want to leave, but how?” player** — Wants a path out but is balancing income, rent, family needs, qualifications and competing obligations.

**The group-chat commentator** — May not be applying now but loves debates about japa, success stories, “my guy in Canada” stories and relatable social content.

**The diaspora player** — Knows the distance between the Instagram version of life abroad and rent, transport, work, weather, loneliness and family expectations.

**The stay-and-build player** — Wants a successful path in Nigeria, through employment, business, remote work or a life chosen for personal reasons.

### Jobs to be done

- “Let me experience the trade-offs without needing to commit my real money or future.”
- “Give me a story that feels like my life and my group chat.”
- “Let me compare how my decisions differ from my friends’ decisions.”
- “Help me practise questioning suspicious claims without making me feel foolish.”
- “Give me a satisfying outcome I can share as a joke, badge or personal story.”

### Exclusions for the initial release

- Players under 18 as a monetisation target.
- People seeking official immigration advice or visa approval prediction.
- A massive, seamless, persistent MMO with unrestricted real-time multiplayer is not promised for the first release. However, open-world roaming, in-world interaction and the ability to discover activities are core requirements and must be present. Whether other human-controlled avatars appear in the initial release is an explicit scope decision.

The game may be accessible to younger people, but monetisation, scam interactions and age-appropriate presentation require a separate policy review before the age rating is finalised.

---

## 5. Goals, non-goals and product hypotheses

### Goals

1. Deliver a compelling first decision within **30 seconds** of opening the game.
2. Make the first run understandable without a long tutorial.
3. Deliver at least one surprising, funny or emotionally recognisable moment in the first two minutes.
4. Make a complete run feel consequential and finishable in approximately 15–25 minutes, with the ability to pause and resume.
5. Make every run end in a result that is understandable, distinctive and shareable.
6. Teach players to recognise common migration-scam red flags and use safer verification behaviour in controlled scenarios.
7. Deliver a fast, stable experience on low-end Android devices and inconsistent connections.
8. Create replay value through meaningful path differences, character starting conditions, event variation and multiple endings.
9. Build a social sharing loop that brings in new players without requiring open chat, contact uploads or manipulative referral pressure.
10. Support a sustainable free-to-play model that never sells visa odds or real-life migration advantage.
11. Deliver an explorable, interactive Lagos world where the player can move freely within the released districts and engage with characters, objects, locations and activities.
12. Make the opening district feel populated and reactive, with enough meaningful interactions to invite exploration beyond the main migration quest.

### Non-goals for MVP

- A map matching the full geographical size or density of Lagos. Start with a smaller, high-quality, explorable district and expand it deliberately.
- A massive seamless MMO with thousands of simultaneous players, persistent public chat or complex player economies.
- Open text chat, dating, unrestricted player-to-player trading or unmoderated user-generated content.
- Real-money wagering or tradable/withdrawable in-game currency.
- User-submitted real immigration documents, external links, application forms or scam scripts.
- Teaching document forgery, evasion, or methods for bypassing immigration checks.
- Giving legal, financial or immigration advice tailored to a real player.
- Letting paying users improve visa outcomes or win player-versus-player encounters through purchased advantages.

**Not a non-goal:** open-world movement, exploring neighbourhoods, entering key locations, interacting with NPCs and objects, doing jobs/hustles, discovering quests and seeing consequences in the world. These are P0 features. If time or performance forces a smaller MVP, reduce geographic scope and visual complexity before removing world interaction.

### The three engines that must work together

JAPA has three commercial/product engines. They are related but must be measured separately; a large launch spike is not evidence that all three work.

| Engine | Player promise | Core mechanisms | Primary measures | Guardrail |
|---|---|---|---|---|
| **Retention** | “There is another story worth experiencing.” | Different starting backgrounds, branching events, earned unlocks, new episodes, a case-of-the-day, post-run reflection and alternate endings | D1, D7 and D30 retention; second-run starts; weekly completed meaningful runs; ending diversity | No punitive streak loss, artificial waits or paid retries |
| **Viral growth** | “My result is too funny, too accurate or too debatable not to share.” | JAPA Receipts, parody refusal cards, Relocation IQ, same-scenario friend challenges, group dilemmas and creator-friendly moments | Share action rate; shares per completed run; shared-link visits; share-to-first-choice conversion; referred-player quality | No fake virality, contact scraping, humiliating public rankings or real personal data |
| **Revenue** | “I can support the game without paying to win.” | Clearly labelled sponsorships, optional rewarded placements at safe pauses, cosmetics, optional content packs and consent-based qualified referrals | Revenue per active user; ad opt-in/completion; purchase conversion; sponsor engagement; qualified-lead conversion | No paid visa odds, misleading agent endorsements or sale of inferred migration intent |

The three engines are a **product hypothesis**, not a promise of viral growth or near-term profitability. Retention and trust come first; monetisation experiments must not weaken learning accuracy or the core game.

### Product hypotheses to test

| Hypothesis | Why it matters | How to test |
|---|---|---|
| A recognisable, explorable opening district will create stronger attachment than a generic “choose your country” screen. | Establishes emotional relevance and makes JAPA feel like a place, not a form. | Test district prototypes; measure first interaction, voluntary exploration, first quest completion and qualitative recognition. |
| Result cards will be the main organic acquisition mechanism. | Creates a reason to share and a clear landing point for new players. | Measure result-to-share, shares per completed run, link visits and new runs from shared links. |
| Scam-detection play can teach red flags without feeling like a lecture. | Adds practical value and a distinctive mechanic. | Conduct pre/post scenario checks and player interviews; revise if players remember the joke but not the lesson. |
| A compact 3D/2.5D district can feel alive within realistic mobile-web budgets. | Validates the core open-world promise without requiring a full-city asset load. | Prototype multiple rendering approaches and compare exploration, interaction success, frame time, first-load bytes and device heat. |
| Players will replay to explore different life outcomes. | Supports retention without artificial daily pressure. | Measure second-run starts, ending diversity and replay reasons. |

---

## 6. Core experience and game loop

### Core loop

1. **Arrive somewhere in the world.** The player controls their character in a recognisable, explorable setting: home, street, bus stop, workplace, shop, market, cybercafé, bank or another location unlocked by progression.
2. **Notice and investigate.** NPC dialogue, visible objects, environmental details, messages, location signs and changing events signal possible actions. The player can approach, inspect, speak, collect, use, purchase, work, travel or leave where appropriate.
3. **Choose how to engage.** Some interactions are direct world actions; others open dialogue, a short minigame, a phone message, a ledger or a decision panel. The world does not stop being explorable whenever the player sees a UI panel.
4. **Spend time, money or social capital.** Activities have believable trade-offs: travel costs money and time; a side hustle builds cash but consumes energy; a conversation may unlock help or create pressure; a risky agent may promise convenience but reveal red flags.
5. **See the world respond.** NPCs remember important decisions where appropriate, quests change state, items and money update, new locations or dialogue unlock, and the environment signals progress. Use visible feedback rather than invisible stat changes alone.
6. **Pursue a personal goal.** The player can follow the migration storyline or do optional activities—jobs, hustles, errands, social visits, skills, exploration and side stories—that support or compete with that goal.
7. **Reach a milestone and reflect.** Major story milestones trigger a meaningful scene or decision. The player can see their current plan, risks, finances and next steps without being forced into a linear card chain.
8. **Create a memorable story.** Emergent incidents and endings feed a spoiler-safe JAPA Receipt, highlight clip or result card. Sharing is optional and must never block progress.

The required rhythm is **explore → discover → interact → decide or act → see the consequence → uncover a new opportunity**. The game may use visual-novel-style dialogue and decision cards as tools, but these cannot be the entire gameplay loop.

### World interaction model (P0)

- **Movement:** responsive touch controls for walking and interacting; optional desktop keyboard support. Movement, camera and interaction prompts must be usable on narrow screens.
- **Interactables:** characters, doors, counters, shops, transport points, workstations, phones, documents, cash machines or bank counters (fictional), household items and quest objects. Each marked interactable must perform an action or have a clear explanation why it is unavailable.
- **NPCs:** named or role-based characters with a purpose—landlord, friend, family member, colleague, recruiter, agent, tutor, customer, official character or neighbour. Prioritise readable behaviours and state changes over a large number of lifeless NPCs.
- **Locations:** home and at least two additional usable locations in the first vertical slice. MVP expands to multiple connected or clearly transitioned spaces; districts should have a reason to visit and distinct activities.
- **Activities:** at least one money-earning activity, one social/relationship interaction, one exploration/discovery interaction, and one migration-related activity in the first public slice.
- **Quests:** a clear main objective plus optional side quests. Quest markers assist discovery but do not require every player to follow a single linear route.
- **Consequences:** important actions update resources, relationships, quest states, inventory or future dialogue; communicate critical consequences in a legible way.
- **World continuity:** entering a menu or conversation should not reset the player's location or world state. Returning from a dialogue should place the character back into the world consistently.
- **Boundaries:** no unrestricted open chat or player-submitted external links in the MVP. NPC and quest interaction can be rich without exposing players to abuse.

### Session design

- **First session:** the player gains movement control and completes a meaningful world interaction within 30 seconds; within 3–6 minutes they can complete a short quest or milestone.
- **Normal session:** 10–30 minutes of exploration, errands, jobs, social interactions and migration progress. Players can stop and resume without losing state.
- **Individual interaction:** 5–90 seconds for simple actions; more time for dialogue, jobs, minigames or major decisions.
- **Focused migration run:** the 15–25 minute structured journey remains as a quest arc or challenge mode within the broader game, not the only way to play.
- **Replay:** new starting circumstances, discovered locations, dialogue states, side quests and long-term goals create variety without forcing a repeated tutorial.

### Starting backgrounds

Offer backgrounds that affect starting resources and story access rather than creating a simple rich/poor ranking. For the first release, use three well-tested choices:

- **The Fresh Graduate:** lower starting cash, more time flexibility, stronger education-related options.
- **The Working Professional:** regular income, less free time, existing responsibilities and references.
- **The Family-Funded Applicant:** stronger starting funds, higher family expectations and less freedom to make a quiet change of plan.

A founder/entrepreneur, returning migrant and remote worker can follow once their stories are adequately researched. Avoid labelling players as “better” or “worse” based on family wealth or background.

### Core resources

Keep the interface to five primary indicators at most. Secondary information should appear when relevant rather than becoming a dashboard chore.

| Resource | Represents | Example effects |
|---|---|---|
| **Funds** | Available fictional money and short-term liquidity | Application costs, rent, transport, emergencies, fees or debt |
| **Energy** | Time, physical stamina and emotional bandwidth | Ability to take shifts, prepare for interviews, manage stress or recover |
| **Readiness** | Preparedness, verified information and completeness of the plan | Access to safer routes, fewer avoidable delays and better-informed choices |
| **Home ties** | Family expectations, support, obligations and communication | Help, remittance pressure, conflict, emotional support and return options |
| **Risk sense** | Ability to question claims and verify offers | Better scam-detection options, safer choices and stronger post-scenario learning |

Do not use “Sanity” as the name of a player stat. Use language that describes pressure or energy without stigmatising mental-health conditions.

### Consequence rules

- Show immediate resource changes whenever the game can calculate them.
- Use foreshadowing where a consequence is plausible but not certain (“this saves time but gives you less room to verify”).
- Do not use opaque random visa outcomes as the main difficulty mechanic.
- Keep the simulation deterministic for the same run seed and choices, apart from explicitly identified non-gameplay analytics or cosmetics.
- Do not imply that high fictional Readiness guarantees a real visa decision.

### High-stakes financial system: “The Sinking Ship”

The financial game should make the player feel that relocation is not a single visa payment: it is a sequence of liquid, illiquid, recurring and family-linked obligations. Use fictional scenario amounts, clearly labelled as game values, except in an explicitly dated reference card that quotes a current official rule.

**Asset liquidation choices**

- **Sell a car:** cash rises quickly, but commuting time/cost or access to work changes. In a Lagos chapter, the player may need to choose between more expensive alternatives, a longer journey or a time-saving arrangement.
- **Sell family land or another inherited asset:** this may unlock capital but triggers a family-council scene, disputed expectations, transaction uncertainty and a need to retain a truthful paper trail. Never imply that every Nigerian family responds in the same way.
- **Keep an asset and delay the plan:** the player preserves a safety net but risks losing an admission, recruitment or application window.
- **Use a fixed or restricted savings product:** model liquidity limits and breakage costs only where appropriate. Do not imply that every fixed deposit automatically qualifies as immigration proof of funds; eligibility and documentation depend on the destination and application route.

The player should learn to distinguish **wealth, available cash, documented funds and money legally accessible to the applicant**. A high balance alone does not make a plan viable.

**The sudden-deposit dilemma**

A character sells a car or land and deposits the proceeds shortly before preparing a financial statement. The game should not automatically reject the character. Instead, surface a verification question: can the player explain the source and connect the transaction to credible evidence, such as a sale agreement, receipt and traceable bank transactions, if relevant to that route? The debrief explains that unusual deposits may need a truthful explanation and supporting evidence; they do not automatically trigger a particular letter or decision.

**The “borrow to show” / rented proof-of-funds trap**

A fictional agent offers to temporarily place a large sum in the applicant’s account in return for a fee, then remove it later. The tempting option provides a temporary in-game balance but adds a severe integrity risk. The lesson is that funds must satisfy the specific route’s rules for availability, access, history and source. Canada’s Express Entry settlement-fund rules state that applicants cannot borrow the required funds from another person; the UK Student route has its own 28-consecutive-day holding rule for relevant applicants. A gift, sponsor or family contribution is not a universal workaround: evidence must meet the route’s specific rules.

Do **not** implement a deterministic “the embassy checks exactly two weeks later” event or imply that every temporary deposit produces an automatic ban. Outcomes should reflect the risk of misrepresentation, refusal, further questions and financial loss without claiming a guaranteed enforcement sequence.

**Budget survival abroad**

After arrival, track cash runway rather than just total money. The player balances rent and deposits, transport, groceries, heating/utilities, study or work commitments, emergency costs and requests from home. One scenario may involve cooking in batches, sharing food with flatmates and deciding whether to send a remittance now or after the next pay cycle. Show the short-term emotional and long-term financial consequence without caricaturing either Nigeria or the destination.

### Financial-learning debrief

After a major money event, give a short, optional “What this taught you” panel:

1. **What changed:** available funds, recurring costs, debt exposure and liquidity.
2. **What evidence mattered:** legitimate transaction records, accepted sponsorship documents or official requirements, where applicable.
3. **What to verify in real life:** a current official source and the date checked.

The panel is educational, not a personal financial recommendation, immigration assessment or guarantee of an application result.

---

## 7. Acts, route structure and narrative scope

The journey remains five acts, but each act must have a distinct emotional and gameplay purpose.

### Act 1 — Lagos Grind

**Purpose:** establish the character, their obligations and why they are considering change.

Potential situations: an early-morning commute; a salary that arrives after several obligations have already arrived; rent renewal; family requests; a professional exam fee; a side hustle that competes with interview preparation; a power or connectivity interruption during an important task; a friend posting an abroad success story; an opportunity to stay and grow locally.

Mechanics: income and expense decisions, time trade-offs, selecting the player’s initial route, managing commitments.

**Required outcome:** the player understands their current constraints and chooses a plan—not simply “leave Nigeria”.

### Act 2 — Processing

**Purpose:** turn ambition into a plan with costs, requirements and trade-offs.

Potential situations: comparing study, legitimate work and skills-building routes; deciding whether to pay for a language test or improve a qualification; checking an institution or employer; deciding whether to use a representative; gathering documents; asking a relative for help; receiving contradictory advice from group chats.

Mechanics: route planning, checklist completion, budgeting, source verification and time management.

**Required outcome:** the player knows what they are trying to do, why it costs what it costs, and what remains uncertain.

### Act 3 — The Agent Market

**Purpose:** introduce pressure, misinformation and social persuasion, then make verification a game skill.

There should be a spectrum of characters: helpful people, legitimate paid professionals, confused acquaintances, overconfident influencers, exploitative intermediaries and outright scammers. Do not portray every agent or every person offering help as fraudulent.

Mechanics: evidence checks, comparing claims, pausing under urgency, identifying inconsistency and deciding whether to verify, refuse, report or proceed with incomplete information.

**Required outcome:** the player experiences the temptation of an easy shortcut and understands the cost of failing to verify.

### Act 4 — The Gate / The Big Decision

**Purpose:** turn earlier decisions into a high-pressure milestone.

The “Gate” may be an interview, a job offer review, a funding decision or another route-appropriate checkpoint. The interaction can have a timed or limited-turn structure, but should primarily test whether the story the player built is consistent with their choices and preparation—not whether they memorised a supposedly guaranteed visa trick.

Possible outcomes include approval, refusal, delay, a request for further information, a changed plan, or a decision to pause and rebuild readiness. Include more than binary win/lose outcomes.

**Required outcome:** a consequential turning point with understandable causes and room to learn from it.

### Act 5 — The Life You Actually Get

**Purpose:** reveal the difference between the imagined destination and daily life, while preserving hope and agency.

For the abroad route, explore first rent, deposits, work that does not match expectations, unfamiliar systems, transport costs, weather, flatmates, loneliness, remittance requests, community and the challenge of building a routine. Avoid making cold weather or loneliness a one-note joke; show adaptation, friendship and progress too.

For the stay/remote-work route, explore income stability, local opportunities, work-life boundaries, community, family obligations and the work required to build something sustainable.

**Required outcome:** the ending feels earned and reflects multiple earlier choices.

### MVP route strategy

**Recommendation: launch one destination route first, with multiple legitimate approaches inside it.** The prototype should not attempt UK, Canada, Germany and Remote Work in full at once. Start with a UK-focused narrative because it is a familiar aspiration for many Nigerians, but country selection must be confirmed through target-user interviews. A single route can support different strategies—study, eligible work, skills development, or pausing to strengthen the plan—without implying these routes have identical rules.

Add Canada, Germany and a “Japa Without Japa” / remote-work path only after country-specific research and content review. Destination rules change; every route should be maintained as versioned content, not written as permanent universal truth.

### Route-specific learning pathways (versioned content, not universal advice)

These pathways are intended to become story systems over time. They are not all MVP commitments, and the content library must be reviewed by a qualified immigration-information reviewer before public use.

| Pathway | Gameplay hurdles | Practical learning objective | Accuracy guardrail |
|---|---|---|---|
| **UK Student** | Course choice; Confirmation of Acceptance for Studies (CAS); tuition and maintenance budget; the relevant financial holding period; English-language and document requirements; study/work balance | Understand how course costs, maintenance, documents and time interact | As of the 17 Oct 2026 research check, GOV.UK lists maintenance funds of £1,529 per month for up to 9 months in London and £1,171 outside London for relevant applicants, alongside course fees for one academic year (up to 9 months). The required amount and exemptions can change; calculate from versioned official data, not a hard-coded universal ₦25m threshold. Relevant funds generally need to be held for 28 consecutive days, with the period ending within 31 days of application. [Official UK financial requirement](https://www.gov.uk/student-visa/money) |
| **UK Student: dependants and work** | A family-planning decision; term-time work schedule; study deadlines and living costs | Learn to check dependant eligibility and working conditions before budgeting | Do not state a blanket “no dependants” rule for every student. GOV.UK allows dependants for specified cases, including certain government-sponsored students and eligible postgraduate research courses; most taught postgraduate courses starting from 1 January 2024 do not qualify on the ordinary student route. Degree-level students sponsored by eligible higher-education providers can generally work up to 20 hours per week during term time, but conditions depend on the course and sponsorship. Check current official rules. [Dependants](https://www.gov.uk/student-visa/family-members) · [Student work conditions](https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-student) |
| **Canada Express Entry** | Language-test planning; education credential assessment where relevant; work-experience eligibility; CRS estimate; proof-of-funds documentation for applicable programmes; uncertainty between invitation rounds | Understand that eligibility, CRS ranking, invitation rounds and settlement funds are separate questions | Never hard-code a single CRS cutoff such as “510–525” as a permanent bar. Cutoffs vary by invitation type and round. IELTS General Training results must be mapped by ability to Canadian Language Benchmarks; the often-discussed Listening 8, Reading 7, Writing 7, Speaking 7 aligns with CLB 9, but it is not a universal minimum for every Express Entry programme. An ECA is relevant where programme rules or points require it. [Language tests](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html) · [Rounds](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html) |
| **Canada: proof of funds** | A bank letter, balances, debts, account history, funds access and an explanation of legitimate financial support | Distinguish available and legally accessible money from temporary borrowed funds or property equity | IRCC says proof of funds is required for some Express Entry programmes but not all; funds must be available when applying and when a permanent-resident visa is issued, and applicants cannot borrow the required money from another person. Bank letters include average balances for the past 6 months, but that is not the same as a universal rule that every dollar must have been held for 6 months. Requirements and annual amounts change. [Official proof-of-funds rules](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html) |
| **Germany Opportunity Card** | Qualification recognition, language evidence for the applicable pathway, points where required, proof of resources and job-search planning | Learn that a job-search permission has entry conditions and is not a guaranteed job | Germany’s official portal describes distinct routes: a recognised qualification or a points-based route with its own qualification, language and points conditions. The 2026 official page states a resource benchmark of €1,091 net per month for the relevant blocked-account option; this must be rechecked before content release. [Official Opportunity Card guidance](https://www.make-it-in-germany.com/en/visa-residence/opportunity-card/job-search) |
| **UK Global Talent / technology talent** | Evidence of achievement or potential, recommendation letters, CV, portfolio and endorsement assessment | Learn that strong skills and evidence may support a specialist route, but a profile or GitHub repository does not guarantee eligibility | GOV.UK states that applicants generally need endorsement unless they qualify through an eligible prize. For digital technology, evidence and endorsement criteria are specific; GitHub contributions, open source or conference speaking may be evidence, not mandatory requirements for every applicant. [Official guidance](https://www.gov.uk/global-talent-digital-technology) |
| **Remote work / “Japa Without Japa”** | Skill development, proof of work, international job search, reliable connectivity, income volatility and boundaries | Present a credible alternative to relocation without implying remote work automatically solves currency, tax, labour or residency issues | Keep tax, employment and residency claims country-specific and source-reviewed. Do not promise that a remote job removes all visa or proof-of-funds requirements. |

**Shared rule for all routes:** every changing legal claim needs a `source_url`, `checked_at`, `effective_from` (where known), `review_due`, `route_id` and `content_version`. Expired claims should show a safe fallback message or be removed from play until rechecked. Never make a real-world rule depend solely on player comments or influencer content.

### Document-review mini-games: “The Embassy Decision Engine”

Use short case-file puzzles where the player investigates a fictional application packet and identifies what needs clarification, correction or verification. The purpose is to teach evidence quality and consistency—not to guess a secret embassy trick.

Example scenarios:

- A name or date differs between a passport and an education record. The player must flag the discrepancy and choose an appropriate correction or explanation path; the game must not imply every mismatch has the same outcome.
- A financial statement shows a large recent credit with no supporting transaction context. The player asks what legitimate evidence may explain the source, based on the relevant route.
- An admission letter, employer offer or representative’s claim cannot be verified through the issuer or official register.
- A work or study plan conflicts with the applicant’s stated timeline, resources or course choice. The player checks whether the narrative and evidence are coherent.
- A so-called “home ties” question offers misleading answers. The debrief must explain that requirements differ by route and that lacking property, a spouse or children is not, by itself, a universal ground for refusal.

**Mini-game acceptance criteria**

- Present 3–5 clues, with a maximum of 60 seconds only if the timer can be disabled or extended for accessibility.
- Allow review of the case file before a final answer.
- Give immediate feedback, then a plain-language debrief with source link and review date.
- Score the player on the validity of the issue identified and their next safe action, not on memorising opaque legal jargon.
- Clearly label any fictional officer feedback as simulated. No scenario predicts the decision on a real application.

### Example event cards

These are creative prompts to develop and validate, not finished script.

| Event | Decision tension | Intended consequence space |
|---|---|---|
| **“The Voice Note”** | A person in a family group says they can guarantee a visa if payment arrives tonight. | Urgency versus verification; money, Readiness and Risk sense |
| **“The Rent Is Due”** | Pay the rent and delay an application expense, move somewhere cheaper with a time cost, or ask for help with relationship consequences. | Funds, Energy and Home ties |
| **“My Guy in Manchester”** | A friend offers a success story, but leaves out the work, costs and support behind it. | Expectations, route choice and emotional pressure |
| **“The Job Offer”** | A tempting offer arrives through an unofficial channel and asks for an unusual fee. | Verification, time, funds and risk |
| **“Proof of Funds”** | Decide whether to wait and build a transparent financial plan or chase a shortcut that creates future risk. | Time, Readiness and possible later consequences |
| **“Power Went”** | A remote assessment or application task collides with an outage or poor connectivity. | Energy, preparation and resource allocation |
| **“December Is Coming”** | Spend on social plans, protect a savings target or use the season to build networks and opportunities. | Funds, Home ties and connections |
| **“The First Payslip”** | The first overseas pay packet is smaller than expected after deductions and essential costs. | Funds, expectations and remittance pressure |
| **“The Return Ticket”** | A setback makes returning, pausing or rebuilding a legitimate option. | Identity, Home ties and long-term outcome |
| **“The Offer at Home”** | A credible Nigerian opportunity appears just as the player is preparing to leave. | Stay-versus-leave decision and ending variety |

---

## 8. Scam-awareness system and controlled player-versus-player play

### Design objective

Allow players to experience the social pressure of a fictional migration scam and, where appropriate, send a simulated scam challenge to another consenting player—while teaching verification habits and preventing the game from becoming a real-world scam toolkit.

The game must not reproduce real fraud templates, facilitate payments, expose players to real solicitations, or teach people how to forge documents or evade immigration controls.

### Scam scenario principles

- Base scenarios on published, verifiable warning signs, including guaranteed outcomes, artificial urgency, requests for payment through inappropriate channels, fake official identities, suspicious job offers, pressure to share personal information, and claims that a paid representative can guarantee approval.
- Use fictional names, organisations, domains and documents. Do not copy government branding or create a document that could reasonably be mistaken for a real visa, job offer, bank statement or admission letter.
- Do not explain how to build more convincing fakes or how to avoid detection. The player-facing lesson should focus on **recognition and verification**, not execution.
- The result screen should explain the red flags, suggest a safer action such as independently checking the official government source, and remind players that game scenarios do not constitute immigration advice.
- Refresh each destination’s scenarios when the linked official guidance changes. Record the source and review date in the content-management system.

### MVP: single-player “Verify or Regret” encounters

Each encounter presents a fictional claim and a limited set of actions:

1. **Verify independently** — inspect a fictional source, then consult an official-link reference card.
2. **Ask for verifiable details** — request a legitimate identity/registration detail without sending sensitive information.
3. **Decline and report** — stop the interaction and receive an explanation of safer next steps.
4. **Proceed under pressure** — a fictional consequence may occur, followed by a non-shaming debrief.

The game must avoid turning “pay the scammer” into a slapstick punishment. The consequence should feel believable, preserve player agency and teach the reason for verification.

### Post-MVP: opt-in asynchronous “Agent Check” challenge

This feature should only launch after moderation, privacy and abuse testing. It can fulfil the desire for players to try a scam-like role against another player, but it must remain a controlled simulation.

**Flow**

1. Player A chooses to create a challenge for a specific consenting friend or through a private invite link.
2. Player A selects from a small library of fictional, prewritten scenario archetypes—such as “guaranteed outcome”, “urgent payment”, “fake official contact” or “too-good-to-be-true job offer”. Player A cannot enter free text, upload documents or insert external links.
3. Player B receives a clear notice that this is a fictional scam-awareness game. They can play, decline or block future challenges.
4. Player B chooses how to respond: verify, request evidence, decline/report, or proceed within the fictional economy.
5. Both players receive a debrief describing warning signs and safe verification behaviours. Any simulated loss affects only non-transferable game resources and cannot be purchased or converted to cash.
6. Both can share the lesson or outcome without exposing the other player’s identity.

**Scoring guardrails**

- Do not create a public leaderboard ranked by the number of real players a person successfully deceives.
- Do not award escalating rewards for spamming challenges or repeatedly targeting the same person.
- Reward scenario knowledge, fair challenge calibration and red-flag recognition. If the simulation records a “fooled” result, treat it as a learning moment and do not let it damage the target’s persistent account or social standing.
- Allow players to disable challenges, limit incoming requests and report abuse.

**Abuse prevention**

- No open chat, free-text messages, external payment requests, uploads or user-created scam documents.
- No real-world money, real banking credentials, passport data, visa application numbers, phone numbers or home addresses in the mechanic.
- Private invite or explicit opt-in only for the initial version.
- Rate limits, block/report functions, age policy, abuse logging and a moderation escalation process before public release.
- Clear visual labelling: **SIMULATED SCENARIO — DO NOT USE IN REAL LIFE**.
- Any future free-text social feature requires a separate risk assessment and must not be silently added under this scope.

### Educational success measure

Before and after a small set of representative scenarios, test whether players can identify the key red flags and select a safer action. Target a **20-percentage-point improvement in correct red-flag identification in the pilot** as an initial hypothesis—not as an established benchmark. If players remember the punchline but cannot identify the lesson, redesign the mechanic.

### Official reference cards

The first release should link only to the official resources that have been checked for that route. Initial reference sources:

- [UK government fraud, tricks and scams guidance](https://www.gov.uk/government/publications/frauds-tricks-and-scams/fraud-tricks-and-scams)
- [Canada immigration fraud guidance](https://www.canada.ca/en/immigration-refugees-citizenship/services/protect-fraud.html)
- [Canada guidance on unauthorised representatives](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigration-citizenship-representative/learn-about-representatives.html)

These links are starting points, not a permanent list. The product owner must verify the correct official source for each destination immediately before release.

---

## 9. Narrative and content system

### Content that should feel distinctly Nigerian

Prioritise the social and economic mechanics that shape the character’s choices. Use specific local details where they are correct, but do not assume every player shares the same experience.

Content domains to research and represent:

- transport costs, traffic and commute uncertainty;
- rent, agency fees, household bills and shared accommodation;
- job searching, interviews, internships, NYSC and early-career frustration;
- salary timing, side hustles, informal work and unstable income;
- family support, “black tax”, obligations, generosity and boundaries;
- friends’ migration stories and social-media status pressure;
- legitimate education and employment pathways;
- scam warnings, misinformation and conflicting online advice;
- power and network reliability as occasional constraints, not the only Nigerian story;
- church, mosque, friendship, alumni and professional networks where relevant to a character;
- diaspora adjustment, hidden costs, community, loneliness and joy;
- returning home, remote work, entrepreneurship and staying by choice;
- Detty December, weddings, travel plans and the pressure to appear successful.

### Signature social scenarios

**The Family Council** — The character’s plan changes after a relative asks them to fund or relocate an extended-family member. Choices may include setting a boundary, asking for time, changing the budget or agreeing to a support plan. Consequences should explore relationship strain and generosity without presenting the family as inherently exploitative. If a character considers falsifying a relationship or adoption document, the story must frame it as fraud with serious consequences and offer no instructions for doing it.

**JAPA in Debt** — The character arrives abroad with a fictional cash runway that looks comfortable until deposits, rent, transport, food, study/work requirements and an unexpected cost collide. The player balances permitted work, time and wellbeing. Do not imply that every student can work a set number of hours in every destination; working conditions are route-specific and should be taught from current sources.

**The Group Chat Tribunal** — Friends, cousins and online commentators debate whether a person should leave, return or stay. The player can respond with humour, set boundaries or ask for useful information. Keep the conflict shareable, but do not shame a character for visa refusal, poverty, return or choosing to stay.

**The Receipt Moment** — After a major cost or questionable promise, the game generates a fictional receipt, timeline or “what I wish I’d checked” recap. It should expose the consequence, not provide a reusable real-world scam template.

### Character standards

- Give central characters motives beyond being a stereotype: a hustling friend may also be generous; an agent may be legitimate; a parent may be anxious but supportive; a diaspora contact may be honest about hardship; a returnee may be proud and successful.
- Include women and men with different ambitions, responsibilities and risk tolerances. Do not make the woman character a romance reward or treat a man’s migration success as the only valid arc.
- Do not make poverty, visa refusal, returning home or choosing Nigeria a punchline by themselves.
- Avoid turning any nationality, region, religion, class or occupation into a single personality type.
- Let players disagree with a character without the game claiming that every character of that kind behaves the same way.

### Writing style

- Modern Nigerian English first; use pidgin and local expressions where characters would naturally use them.
- Prefer short, expressive exchanges over long exposition.
- Use humour from timing, contradiction, understatement, misunderstanding and consequences—not only catchphrases.
- Avoid forced slang or phrases inserted solely to signal “Nigerian”.
- Every major decision card must state the choice clearly. Jokes cannot obscure the cost or the user’s action.
- Every scene should pass two tests: **Would a person who has lived this recognise it?** and **Would a person who has not lived it still understand the choice?**

### Content card schema

Every content card must include:

- Card ID and content version.
- Act, route and prerequisite tags.
- Scene setting and narrative objective.
- Dialogue and visual direction.
- Available choices and explicit costs.
- Immediate effects on resources.
- Delayed consequences and trigger conditions.
- Any randomised element and its defined range.
- Accessibility text and optional audio transcript.
- Content-sensitivity note, where needed.
- Research source for factual claims.
- Reviewer, review date and expiry/recheck date for changing immigration or scam information.

### Story quality gate

Before a card ships, have at least two reviewers assess it: one for cultural/narrative authenticity and one for factual or safety accuracy where applicable. For major story arcs, include playtesters from Nigeria and the diaspora, and people who have chosen to stay as well as people who intend to leave or have returned.

---

## 10. Art direction and UX

### Recommended visual identity: “Lagos, On the Move”

The visual target is a **stylised, expressive, compact open world** that looks unmistakably JAPA: alive enough to explore, readable on affordable Android phones, and distinct from other Nigerian games. Prototype low-poly 3D and 2.5D/isometric approaches before locking the renderer. Do not pre-decide to remove 3D or free roaming just because the game must be data-light.

World-design pillars:

- **A place, not a backdrop:** neighbourhood blocks, compounds, shops, bus stops, streets, office corridors and interiors are arranged so the player can learn the layout and recognise where they are.
- **Lagos texture through observation:** architecture, signage, street furniture, transport, weather, power/internet constraints, shopfronts, noise and crowd behaviour should feel researched and locally reviewed, not assembled from stereotypes.
- **Readable stylisation:** simple geometry, clear silhouettes, warm lighting, intentional colour blocking and distinctive character shapes. Avoid over-realistic assets that are expensive to load and look uncanny on small screens.
- **In-world discovery:** quest clues, messages, objects and optional interactions belong in the environment. The HUD supports exploration but must not cover the world with floating cards.
- **Originality:** build JAPA-specific avatar proportions, animations, UI, world layout, props, icons, sounds and terminology. Do not copy Lagos Life’s distinctive assets, maps, interface arrangements or signature effects.
- **Useful interiors:** key places should be enterable or provide an intentional interaction scene, not just decorative facades. Prioritise fewer meaningful interiors over many empty buildings.
- **Life and motion:** pedestrians, vehicles, shop activity, ambient animation, NPC reactions, day/night or time-of-day changes where performance permits. Every ambient system must earn its cost in clarity or immersion.
- **Cutaways where needed:** a transition to an interior or close-up dialogue view is acceptable when it maintains continuity and lets the player complete an action; it must not turn every location into a static story card.

### Camera and controls

- Default to a camera angle that keeps movement, navigation and interactables readable on mobile. Isometric, elevated third-person or another stylised camera may be tested in the vertical slice.
- Touch controls: virtual joystick or drag-to-move plus a contextual interaction button. Avoid controls that obscure important parts of the scene.
- Desktop controls: keyboard movement and a clear interact key, with responsive mouse/touch alternatives.
- Camera boundaries, collision and walkable surfaces must feel intentional. The player should not frequently get trapped behind props or walk through key objects.
- Context prompts appear when an object/NPC is in interaction range and disappear when no longer relevant.
- Support reduced motion, adjustable text and a simplified visual mode. A simplified mode must preserve movement and interaction, even if it reduces shadows, crowd density, animation and texture detail.

### Suggested visual system

These colours are starting points for exploration and must be tested for contrast and cultural fit.

| Token | Suggested colour | Purpose |
|---|---|---|
| Ink | `#191B1E` | Primary text, strong outlines and deep backgrounds |
| Paper | `#F4EBDD` | Main background and dossier/document surfaces |
| Lagos Teal | `#176B6B` | Primary action and route-map accent |
| Alert Orange | `#EA973B` | Deadlines, attention and choice tension |
| Stamp Red | `#C74742` | Warnings and consequential decisions—not generic decoration |
| Route Blue | `#355D93` | Verified information and calm secondary actions |

Use a bold display face for chapter headings and a highly legible sans-serif for body copy. Avoid handwriting fonts for long passages. Never use colour alone to communicate risk or state; combine it with words, icons and shape.

### Information architecture

**World / Continue** — Resume at the saved location, enter the explorable world, track the main objective and review optional activities.

**World HUD** — Minimal health/energy or mood indicator if needed, cash, time/quest objective and a contextual interaction prompt. The scene remains the main interface.

**Map** — Discover neighbourhoods, travel points, services, quest destinations and places the player has already visited. Do not reveal every secret up front.

**Phone** — Messages, contacts, job leads, calendar, travel file, financial overview, Codex, map shortcuts and later approved sponsor content. It is a useful in-world tool, not a substitute for moving through the world.

**Travel file** — Route, checklist, evidence, commitments and migration milestones.

**Inventory / wardrobe** — Useful objects, documents represented as game items, outfits and cosmetics. No real document uploads.

**Dialogue / interaction panel** — Short dialogue, costs, risks and two-to-four choices for complex conversations. Closing it returns the player to the same world location.

**Results / JAPA Receipts** — Milestone summary, ending, funny or moving moments, share controls and replay paths.

**Safety / Verify** — Official source links, red-flag summaries and report/feedback routes.

**JAPA Codex (Living Wiki)** — An in-game glossary that unlocks as players encounter terms such as CAS, POF, ECA, CRS, biometrics, NHS surcharge, Certificate of Sponsorship (CoS) and relevant route-specific terms. Each entry must include a plain-English explanation, “why it matters in this story”, what not to assume, the official source and its last-checked date. Acronyms should not unlock a false sense of expertise by themselves.

**Money Map** — A compact view of one-off costs, recurring costs, accessible cash, restricted money, debt and expected runway. Its values are fictional simulation values unless the player deliberately opens a dated, official reference card.

### Key screen requirements

- Every choice displays its cost when the cost is knowable.
- A tap target should be comfortable on a small phone; no interaction relies on hover.
- The player can review the current objective and important previous facts without losing the scene.
- Avoid walls of text. Present the important sentence first, then optional details.
- Motion and sound are optional, never required to understand the outcome.
- Sound is on by default at low volume with an always-visible mute button (decision Q30). All spoken content has text equivalents, and the game is fully playable on mute.
- Result cards should remain legible when saved, reposted or compressed by social platforms.
- Support browser back/forward behaviour without accidentally erasing a run.

### First 30 seconds

The player should enter the world directly—not a signup wall, account form, settings tour, cinematic they cannot control or lengthy backstory. The first 30 seconds must teach basic movement and produce a meaningful interaction. The first consequential migration or financial decision should follow quickly, without requiring the player to understand every system.

**Example opening (illustrative only):**

1. The game opens inside a modest Lagos room at 6:43 a.m. A phone buzzes; rent is due, an interview or work shift is approaching, and a cousin has forwarded a suspicious “guaranteed visa” voice note.
2. A subtle movement prompt lets the player move to the phone or door. The player can pick up/read the message, inspect their wallet or leave the room. This is playable, not a passive cutscene.
3. Outside, the player can walk a short route to a bus stop, greet a neighbour or enter a nearby kiosk/cybercafé. One optional interaction rewards curiosity.
4. Approaching the suspicious offer opens an in-world conversation panel with choices: verify the person, ask a trusted contact, or pay under pressure. The consequences affect money, trust and future quest states.

The aim is to make the player feel in control of a real place within seconds, then discover that ordinary Lagos activities connect to the larger migration story. The scenario must avoid presenting any real-world immigration shortcut as legitimate or guaranteed.

---

## 11. Social sharing and growth loops

The game cannot guarantee that a launch post goes viral. It can make sharing feel natural, produce highly legible content and measure whether shared content converts into new players.

### Result cards: the primary growth asset

Every completed run should generate a card that includes:

- the ending title and a one-sentence explanation;
- 2–3 memorable run facts (for example, biggest expense, most consequential choice or an unexpected recovery);
- an expressive illustration or character pose;
- the game name and a clear play link;
- an optional share seed that lets a friend try the same starting dilemma;
- spoiler-safe and full-reveal variants;
- no email address, phone number, legal name, private messages or sensitive player information.

Possible ending titles to test include **Japa Lord**, **IJGB for Two Weeks**, **Survived, Not Thriving**, **Embassy Regular**, **Returned With Receipts**, **Stayed and Won**, **Remote Worker, Local Wahala**, **The Agent Collected**, and **Plan Rebuilt**. Names should be tested with players so that the joke does not shame people in painful circumstances.

### Share formats

Generate images in common vertical and portrait social formats, while preserving one clear text hierarchy. The user should be able to save an image even if the platform share sheet is unavailable. Shared links should open the game directly to the relevant starting challenge, not the generic home page.

### Social loops to build

**Ending identity:** “What kind of japa planner are you?” The result must describe the player’s fictional run, not imply a diagnosis or real-world forecast.

**Friend challenge:** a friend can share the same opening scenario or run seed, then compare outcomes without needing an account.

**Weekly dilemma:** a short, optional scenario that everyone can play and discuss. Do not punish players who miss it.

**Group-chat export:** share a compact image and optional copyable text; never upload contacts or message a person without the player’s action.

**Creator-friendly moments:** design a handful of visually striking, funny and emotionally clear scenes that work in a 10–20 second screen recording. Keep spoiler controls and a visible game attribution.

**JAPA Receipts and parody refusal cards**

At the end of a run, create a fictional “JAPA RECEIPT”, “CASE REVIEW” or satirical “REJECTION ENERGY” card. It may include a funny summary of the player’s fictional choices, largest expense, most questionable decision and next recommended learning topic. Example tone: “Refusal grounds: the budget was 80% vibes and 20% actual receipts.” The wording must make clear it is parody, not an official government document. Do not reproduce actual embassy letter layouts, seals, real officer names or formats that could be mistaken for authentic correspondence.

Share variants should include:

- **The receipt:** money in, money out, and the unexpected cost.
- **The case file:** two or three red flags the player learned to spot.
- **The ending:** character outcome and one-line story.
- **The Relocation IQ card:** an entertaining score split across in-game preparedness, budgeting and scam recognition.

Relocation IQ is a **game-learning score**, not a visa eligibility score, immigration assessment, professional qualification or prediction of a real application. Show the breakdown and encourage players to review weak areas. Do not present “you will be refused” as a score result.

### Optional JAPA Groups (post-MVP)

Players may form small private groups of up to 10 friends to complete the same weekly dilemma and compare safe, high-level choices. Group play should not require open chat. Where “Testimony Service in Progress” or similar boosts appear, they can unlock a cosmetic, an alternative story scene or a temporary non-financial narrative modifier—not extra real-looking proof of funds or a hidden visa-approval advantage. Members must be able to leave, mute or block invites. Never disclose one player’s run detail to the group without that player’s consent.

### Launch content strategy

- Release a small bank of ready-to-share result cards and scene clips on launch day.
- Share prompts that invite choices or friendly debate: “Would you pay this agent?”, “What is the most expensive part of your plan?” or “Would you stay if this offer landed?”
- Work with Nigerian creators across comedy, career, migration, diaspora and gaming—not only gaming accounts.
- Invite people who have stayed, returned and settled abroad to playtest, so the marketing does not become a one-sided “everyone must japa” message.
- Use community quotes only with permission. Do not make fabricated player testimonials or unverified claims about how many people are playing.
- Keep creator tracking links simple and privacy-respecting.

### Referral mechanics

- No reward for uploading address books.
- No fake scarcity or “your friend is waiting” pressure.
- No need to log in before a first run.
- If referrals earn cosmetics or badges, make those rewards optional, capped and non-monetary.
- Measure quality of referred users, not just number of shares.

---

## 12. Retention and replayability

The goal is **compelling replayability**, not compulsive use.

### Mechanics that create meaningful replay

- Different starting backgrounds with real trade-offs.
- Route and event choices that unlock different scenes.
- Multiple credible endings, not a single “correct” solution.
- A post-run “what changed your ending?” timeline.
- Optional alternative approaches to the same crisis.
- New scenario drops tied to real seasonal rhythms such as NYSC, rent renewal, exam periods and Detty December.
- An optional daily/weekly dilemma that players can skip without losing progress.
- A short “try a different plan” action after the result card.

### Mechanics to avoid

- Punishing streak loss.
- Artificial waits to refill energy.
- Loot boxes or paid random rewards.
- Making the player pay to retry a route or undo a mistake.
- Selling advantages in visa/interview scenes.
- Using shame, fear of missing out or social humiliation to force return visits.

### Long-term progression: “Generational Hustle”

Use a light roguelite structure: a completed or failed run earns **Street Cred** (or another tested in-world term) based on choices explored, lessons completed and new story routes encountered. The currency unlocks new starting backgrounds, alternate story branches, visual customisation and harder case files.

Example starting archetypes to test include **Foreign Uncle Network**, **First-Class Graduate**, **Tech Portfolio Builder**, **Family-Funded Applicant** and **Returnee With Receipts**. Avoid perks that imply a person can skip mandatory checks, bypass language requirements, buy a sponsorship, or gain a guaranteed visa. An archetype may alter fictional starting resources or open a different scene, but it must not teach that family connections or wealth automatically establish eligibility.

Failure should convert into insight, not a grind penalty. A player who loses a run may unlock a debrief, a different starting circumstance or an optional practice scenario. No accumulated currency should be purchasable in a way that affects a visa-like decision.

### Case of the Day (daily ritual without punitive streaks)

Offer one short, optional **Case of the Day** at a consistent local time only if operations can maintain it reliably. It asks one practical question about a fictional claim, document discrepancy or budget decision and explains the answer immediately. Players can complete missed cases from an archive or skip them without losing progress. Track consecutive plays only as an optional personal stat; do not frame it as an “embassy pass streak” or imply daily practice guarantees a visa outcome.

### Seasonal content

Use seasonal drops such as Detty December, January reset, NYSC/pass-out season, rent-renewal periods, exam windows and new-country episodes. A real policy update may inspire a new scenario, but the legal guidance must be reviewed and updated before the event goes live. Do not ship unverified rules just to react to a trending post.

### Return-session experience

When a player returns, show a short recap: their current goal, their last consequential decision and the next available action. Do not demand that they remember a long thread of story details or replay an already-seen tutorial.

---

## 13. Monetisation and commercial partnerships

### Principles

- The basic game and complete core journey remain free.
- Purchases can change cosmetics or optional presentation, never the chance of a visa-like outcome.
- Never monetise a player’s fear, financial hardship or real-world migration aspirations through pressure tactics.
- All paid placements are visibly labelled. Sponsors cannot alter story outcomes, scam warnings or official verification information.
- No sponsor should be presented as an official immigration service without independent legal approval and verified authorisation.

### Suitable future revenue options

- Optional cosmetic character items, luggage skins, passport-holder designs and profile frames.
- Clearly disclosed sponsor placements that fit the fictional world and do not interrupt high-stakes decisions.
- Sponsored special stories from reputable education, career or financial-literacy partners, with editorial control retained by the game team.
- Rewarded ads only at natural pauses and only where they do not interrupt or bias the outcome.
- Optional paid narrative packs, new starting backgrounds and cosmetic items after the core free game has demonstrated retention.
- Sponsored fictional services or contextual placements, clearly labelled as advertising and reviewed for credibility, relevance and conflict of interest.
- Consensual referral partnerships with qualified education or immigration professionals, where a separate opt-in flow sends a player to a partner—not their game profile or progress by default.

### Nigerian-first monetisation stack

**A. Rewarded advertising**

Test an opt-in rewarded-ad format only if a technically compatible, policy-compliant provider supports the browser/PWA distribution. Use it for low-risk rewards such as a cosmetic token, an optional hint, replaying a non-critical story scene or an expanded learning explanation. The ad must not supply “proof of funds”, make real-looking cash appear in a bank account, purchase extra visa odds, bribe an official, bypass an immigration appointment or turn a refusal into an approval. Do not interrupt a case debrief or official-source screen.

**B. Low-price purchases**

Test local pricing bands (for example, ₦200–₦1,500 as a research range, not a validated price list) for cosmetic packs, character outfits, profile frames, luggage designs and optional story episodes. Use actual willingness-to-pay research and payment-provider fee checks before committing. Paystack, Flutterwave or other local methods may be evaluated subject to merchant eligibility, integration constraints, platform policy and current fees; do not assume every method or airtime billing is supported for this distribution model.

Purchases must have clear prices, a clear confirmation step, receipts, refund/support guidance and no countdown pressure. Do not sell a “VIP Agent Fast-Track” that implies someone can guarantee biometrics, or “POF insurance” that magically protects a fictional bank balance. No payment can change a simulated visa/immigration decision.

**C. Sponsor placements and branded scenarios**

Potential categories include remittance and multi-currency services, financial literacy, exam preparation, career skills, legitimate education services, mobile connectivity and travel-related services. Specific brands such as Lemonade Finance, Geegpay, Chipper Cash or a named exam-prep provider must only be used after direct commercial approval, brand review and factual verification. A brand must not be presented as the only safe choice or as officially endorsed by a government.

Keep the fiction and the promotion distinct: for example, a fictional “FX comparison” scene can contain a clearly labelled sponsored panel, but the panel must not silently determine a route outcome or distort the educational explanation. Sponsors must not edit scam-warning content or purchase a favourable “agent” portrayal.

**D. Qualified lead generation**

A post-run message may say: “Want to explore this route outside the game? View options from independently checked providers.” Before a lead is sent, the player must choose to continue, see which organisation receives information, review a separate privacy notice, and explicitly submit only the fields needed for that request. Do not send the player’s gameplay history, Relocation IQ, fictional balances or inferred migration intent by default. Verify any claimed professional authorisation using the relevant official register and disclose any commercial relationship.

**E. Revenue rollout**

Start with measurement and sponsor conversations; do not rush intrusive ads into the first playable. A reasonable sequence is: free core loop and result-sharing → limited contextual sponsor pilot → rewarded-ad opt-in test → cosmetic or optional content purchases → qualified lead experiments with explicit consent. Each step proceeds only if retention, trust and performance guardrails remain healthy.

### Avoid in MVP

- Pay-to-win boosts.
- Paid “visa odds”.
- Selling a player’s profile, inferred migration intent or sensitive behavioural data.
- Currency that can be withdrawn, transferred for value or confused with actual money.
- Ad placements inside scam-awareness debriefs or official-source screens.

### Currency policy

All in-game currencies are fictional, non-transferable and non-withdrawable. Clearly label fictional money and avoid visual design that makes it look like a real bank balance. Any future payment integration requires a separate payment, privacy, consumer-protection and under-18 review.

---

## 14. Functional requirements and user stories

Priority is marked **P0** (required for first playable/MVP), **P1** (important after the core run works) and **P2** (future expansion).

### A. Entry, onboarding and saving

**US-01 — Start without friction (P0)**  
As a new player, I want to start immediately so that I can experience the game before deciding whether to commit.

**Acceptance criteria**
- A playable first scene appears without an account requirement.
- A consequential first choice can be reached within 30 seconds on a supported device under target network conditions.
- The game does not request phone contacts, location, passport details or other unnecessary personal data.
- Tutorial guidance is contextual and skippable after the first encounter.

**US-02 — Pause and resume (P0)**  
As a player, I want to leave and resume a run without losing progress.

**Acceptance criteria**
- A run is saved locally as soon as a consequential choice resolves.
- Where server sync is available, the run can resume across sessions without duplicating rewards or choices.
- Loss of connectivity does not erase an already saved local run.
- A clear state is shown when local progress has not synced.

### B. Story engine and decision system

**US-03 — Understand a choice (P0)**  
As a player, I want to understand what I know, what I will spend and what is uncertain before choosing.

**Acceptance criteria**
- Each choice presents its known direct cost or explicitly states that the cost is uncertain.
- Choosing an option produces visible feedback.
- Delayed consequences reference prior decisions consistently.
- The same run seed and choice sequence produce the same gameplay outcomes.

**US-04 — Experience meaningful alternatives (P0)**  
As a player, I want more than one viable approach so that there is a reason to replay.

**Acceptance criteria**
- Each major milestone has at least two meaningfully different approaches.
- No single starting background is strictly superior across every route.
- The story supports multiple endings, including a positive stay/build path.

### C. Resources, routes and endings

**US-05 — Manage a believable plan (P0)**  
As a player, I want to weigh time, cash, family obligations and readiness so that the decisions feel connected.

**Acceptance criteria**
- Each main resource has a visible purpose in at least three encounters.
- Major costs and gains are logged in the run recap.
- The game never represents fictional values as current real-world immigration fees.

**US-06 — Reach a clear ending (P0)**  
As a player, I want to understand how my choices created the outcome.

**Acceptance criteria**
- The ending names the main outcome and summarises at least three relevant decisions or facts.
- The ending is reachable through normal play and is not paid-gated.
- A player can start another run without creating an account.

### D. Scam awareness

**US-07 — Practise spotting a red flag (P0)**  
As a player, I want to assess suspicious claims in a fictional scenario and understand the safer next step.

**Acceptance criteria**
- Each scam-awareness scenario contains at least one researched red flag.
- After the choice, the game explains the signal in plain language and links to an official resource where relevant.
- No scenario includes instructions for creating forged documents, impersonating a real official or evading detection.
- Content shows a review date for changing destination-specific guidance.

**US-08 — Challenge a consenting friend (P2)**  
As a player, I want to send a fictional scam-awareness challenge to a friend so that we can compare our judgement.

**Acceptance criteria**
- Both participants explicitly opt in.
- The sender can only select from approved fictional scenario templates.
- No free-text scripts, uploads, payment links or requests for real data are permitted.
- The receiver can decline, block and report.
- The encounter has a clear simulation label and educational debrief.
- Scoring does not reward repeated targeting or public humiliation.

### E. Sharing and growth

**US-09 — Share my outcome (P0)**  
As a player, I want to share a result that reflects my run and makes friends curious.

**Acceptance criteria**
- Every ending generates a spoiler-safe result card and a play link.
- The player can save the card when native sharing is unavailable.
- The result card contains no private personal information.
- The link opens the relevant challenge or a sensible fallback if the seed expires.
- Share events can be measured without collecting the text of private conversations.

**US-10 — Compare with a friend (P1)**  
As a player, I want to compare how a friend handled the same dilemma.

**Acceptance criteria**
- A shareable scenario can be replayed from the same starting seed.
- No account is required for first play.
- The comparison shows outcomes and high-level choices, not private financial or identity data.

### F. Learning, financial literacy and progression

**US-11 — Review the JAPA Codex (P1)**  
As a player, I want plain-English explanations of terms encountered in a route so that the story is understandable and I can check the real-world source.

**Acceptance criteria**
- Each Codex entry explains the term, its relevance, common misunderstanding, official source and last-checked date.
- Out-of-date entries are flagged or withdrawn until reviewed.
- The Codex explicitly says it is educational and not a personalised immigration assessment.

**US-12 — Understand financial trade-offs (P0)**  
As a player, I want to see how asset sales, restricted savings, family contributions, recurring costs and debt affect my cash runway.

**Acceptance criteria**
- The game distinguishes fictional balance, liquid/available money, committed expenses and restricted money.
- Major changes are shown before or immediately after the choice.
- A sudden deposit does not automatically trigger a universal legal outcome; the debrief explains the route-specific documentation question.
- The game never teaches a player how to fabricate proof of funds or evade verification.

**US-13 — Improve my learning score (P1)**  
As a player, I want an honest score that shows what I understood and what I should review.

**Acceptance criteria**
- Relocation IQ is broken into visible sub-scores such as budgeting, document consistency and scam red-flag recognition.
- The score is labelled as a game score, not visa odds, legal eligibility or a certification.
- The score card has a link to the relevant learning content and can be shared without exposing identity or sensitive run data.

**US-14 — Return for a short daily case (P1)**  
As a player, I want a quick optional challenge that I can complete or skip without losing progress.

**Acceptance criteria**
- The case has a clear source and review date for factual claims.
- Missed cases remain accessible in an archive or do not affect persistent progress.
- The game does not advertise a streak as a predictor of immigration success.

### G. Accessibility, performance and reliability

**US-15 — Play on an affordable phone (P0)**  
As a player, I want the game to load and remain responsive on my phone and network.

**Acceptance criteria**
- Core gameplay works on the agreed minimum Android and browser matrix.
- The first interactive experience is within the defined payload and timing budgets.
- The player can switch to reduced-motion and low-data modes.
- Essential content is readable without audio and at increased text size.

**US-16 — Play through a network interruption (P0)**  
As a player, I want a temporary connection loss not to destroy my run.

**Acceptance criteria**
- The full single-player core loop can be completed offline after the required assets/content are cached.
- Offline limits are explained; external verification links and social sharing are clearly marked as requiring connectivity.
- Sync conflicts are resolved without duplicate currency or rewards.

---


**US-17 — Explore the world freely (P0)**  
As a player, I want to move around a recognisable Lagos neighbourhood so that the game feels like a place I inhabit rather than a sequence of screens.

**Acceptance criteria**
- The player can control an avatar and move across walkable areas without selecting every destination from a menu.
- The first public version includes at least one connected, explorable district with recognisable landmarks and multiple activity locations.
- Collision, walkable surfaces, boundaries and camera behaviour are reliable on target phones.
- The player can leave and return to the main quest without losing progress or being forced to finish every optional activity.
- Loading or transitioning between districts preserves character, quest and relevant world state.

**US-18 — Interact with people and objects (P0)**  
As a player, I want to speak to characters and interact with useful objects so that exploration produces meaningful actions and stories.

**Acceptance criteria**
- At least five meaningful interaction types are implemented for the public version, selected from conversation, inspecting clues, collecting/using items, shopping, working, travel, resting, accepting quests and playing a short activity.
- At least eight distinct interactive NPC roles or named characters exist in the initial district/content slice; characters have a clear purpose even where schedules or state memory are simplified.
- Interaction prompts are contextual, readable and dismissible; the player is returned to the same world position after closing dialogue or a panel.
- Important interactions change resources, inventory, quest state, relationship state or future dialogue, or clearly explain why no change occurs.
- Decorative objects are not marked as interactable unless they do something.

**US-19 — Discover activities and side quests (P0)**  
As a player, I want to find optional work, errands, social encounters and secrets so that I can choose how to spend my time in Lagos.

**Acceptance criteria**
- The main migration objective coexists with optional side activities.
- The first public version includes at least one money-earning activity, one social/family activity, one world-discovery activity and one migration-related activity.
- Activities communicate their known costs, expected benefits and relevant risks before irreversible choices.
- Completing or ignoring a side quest can affect opportunities or resources without making the main story impossible to complete.

**US-20 — See a responsive world (P1, with P0 minimum response states)**  
As a player, I want the environment and NPCs to react to time, choices and events so that the world feels alive.

**Acceptance criteria**
- The initial district includes ambient movement or animation and at least three event/state changes that the player can observe.
- Key NPC dialogue or availability changes after at least selected major decisions.
- The game has at least a basic time-of-day or event-state representation if supported by the engine; this must not create punitive waiting.
- World-state changes are reproducible for deterministic test scenarios.

**US-21 — Play an explorable world on low-end phones (P0)**  
As a player, I want a responsive world without excessive data use so that I can play on a typical affordable device.

**Acceptance criteria**
- The initial world area loads progressively and does not require downloading every district before the first interaction.
- The game uses compressed/reused assets, culling and appropriate levels of detail or 2D fallbacks where useful.
- A low-graphics mode reduces effects, texture quality, shadows and nonessential crowd density without removing movement, quests or interactions.
- If a later district is not cached offline, the player can still play the cached area and receives a clear connectivity message before attempting to travel there.
- The team measures initial payload, per-district payload, memory usage, frame time and device heat on physical devices.

**US-22 — Meet other players (first major update after launch; decisions Q6–Q8)**  
As a player, I want to see and interact with friends in a safe shared space so that the world can become a social destination as well as a single-player game.

**Acceptance criteria if enabled**
- Presence is opt-in and built around small instances or rooms before a massive shared world is attempted.
- Text chat, user-created scripts, real-money transfers and sharing real immigration documents are not enabled by default.
- Players can mute, block and report; the product defines abuse response and data-retention rules before release.
- Human-controlled avatars never affect immigration outcomes through purchased advantages.
- Live multiplayer is explicitly decided in the technical scope; this requirement must not be interpreted as permission to remove open-world single-player interaction.

## 15. Performance, security, privacy and accessibility requirements

### Performance targets

The original technical constraints should be treated as strict budget targets and validated on actual devices, not only desktop emulation.

- **First interactive payload:** target ≤3 MB, hard ceiling 5 MB for the boot experience and first playable area, using compressed assets and a documented counting method. The complete world is loaded progressively by district/asset bundle; do not require the full world download before the player can move and interact. Set and test an explicit per-district budget, and offer an optional progressive cache that can grow toward a separate proposed 40 MB budget.
- **Time to first control:** target ≤4 seconds on the agreed 3G-like test profile.
- **Time to first world interaction:** target ≤30 seconds from load (movement, speaking to an NPC, using an object or taking an in-world action).
- **Time to first consequential choice:** target ≤60 seconds, once the player has basic movement context.
- **Device floor:** Android 9, 2 GB RAM as the initial minimum, subject to device/browser compatibility testing.
- **Frame rate:** target 30 fps for movement and world interaction on minimum devices; the world must remain controllable and readable if frame rate falls below target.
- **Low-data mode:** reduce image quality, prefetching and non-essential animation; avoid autoplay video.
- **Reduced-motion mode:** disable non-essential camera movement, screen shake and parallax.
- **Failure tolerance:** gameplay should not crash or lose local progress when analytics, ads or social-share services fail.

If the team keeps a 3 MB initial-payload target, it must optimise the first district and stream the rest of the world, rather than replacing open-world play with illustrated screens. Compare low-poly 3D, 2.5D/isometric and other lightweight rendering options in a physical-device vertical slice before locking the approach. Keep the same gameplay agency in low-graphics mode.

### Security and integrity

- Gameplay state that affects online competition, account entitlements or paid cosmetics must be validated server-side.
- Do not trust client-submitted outcomes, balance changes or completion claims for valuable entitlements.
- Deterministic run seeds and choices should be logged in a minimal, privacy-respecting way to reproduce defects.
- Protect against duplicated rewards, replayed purchase callbacks, tampered run states and challenge spam.
- Keep sponsor content separate from authoritative game logic.
- Do not let challenge messages execute scripts or open user-controlled external destinations.

### Privacy

- Guest play should be possible.
- Collect only data needed for gameplay, reliability and consented analytics.
- Do not request real migration documents, visa numbers, passport details, home address, contacts or bank information.
- Do not infer or sell a person’s real migration intentions from in-game choices.
- Offer a clear privacy notice and an in-product route for privacy questions and deletion requests where accounts exist.
- Review the Nigerian Data Protection Act 2023 and applicable cross-border requirements with qualified counsel before release. This PRD is not a legal opinion.

### Accessibility

- Meaningful labels for buttons and interactive states.
- Adequate contrast and no colour-only warnings.
- Text captions for audio, voice-note formats and animation-dependent events.
- Scalable text and layouts that work on narrow phone screens.
- A reduced-motion mode and no necessary timed interaction that cannot be paused or adjusted.
- Avoid culturally specific jokes as the only way to understand a safety-critical clue.

---

## 16. Analytics and success metrics

The team must define events before public launch, distinguish anonymous sessions from accounts, document metric definitions and avoid collecting message content or sensitive personal data.

### North-star metric

**Weekly engaged world players**: unique players who complete a major quest/milestone or perform a minimum of five meaningful world interactions in a week. Report completed migration arcs as a separate deep-engagement metric. This reflects open-world play better than counting only finished runs, and is more useful than raw page views, which can be inflated by repeat visits or automated traffic.

### Funnel metrics

| Metric | Definition | Initial target / interpretation |
|---|---|---|
| First world interaction | Share of landing sessions where a player moves, speaks, inspects, collects, uses or activates something in the world | Target ≥70% during closed testing; diagnose device/load differences |
| Time to first world interaction | Time from initial load to first meaningful world action | ≤30 seconds |
| Time to first consequential choice | Time from initial load to the first decision that materially changes a resource, relationship or quest | Target ≤60 seconds after movement context is understood |
| Exploration rate | Share of players who discover at least one optional interactable or activity beyond the tutorial path | Establish baseline in prototype; use qualitative feedback to understand discovery failures |
| Interaction depth | Meaningful world interactions per session, excluding repeated non-actions | Segment by device and session length; monitor alongside quest completion and player feedback |
| Location revisits | Share of players who voluntarily revisit a location or NPC for a new purpose | Indicates whether places feel useful rather than disposable, not a goal to maximise on its own |
| First-act completion | Share of first-choice players completing Act 1 | Establish a baseline in prototype; investigate the largest drop-off points |
| Full-run completion | Share of players starting a run who reach an ending | Set the public target after usability tests; do not optimise by making choices meaningless |
| Second-run start | Share of completed runs that start another run | Core replayability measure; compare by ending and starting background |
| Day-1 retention | Share of first-day players who return the following day | 25% floor / 35% stretch for soft launch; provisional targets, not industry facts |
| Day-7 retention | Share who return in the following week | Establish a baseline and review by acquisition source |
| Result-card share rate | Completed runs that generate a share action | Test an initial 8–12% hypothesis; measure actual exported/ copied shares where possible and do not equate “clicked share” with a successful post |
| Share-to-start conversion | Visits from shared links that begin a first choice | Measure by platform and card style |
| Crash rate | Sessions ending in an attributable crash | <1% target after hardening, measured on supported devices |
| Loading performance | First interactive time, payload size and timeouts by device/network | Must stay inside performance budget for the agreed test matrix |
| Scam recognition | Change in correct red-flag identification before/after scenarios | Pilot hypothesis: +20 percentage points; revise from measured results |
| Ending diversity | Distribution of endings across completed runs | Avoid one ending dominating solely because it is mechanically easiest; inspect for balance rather than forcing equal shares |

### Retention, growth and revenue measures

The launch dashboard must report all three engines separately:

| Engine | Metric | Definition / use |
|---|---|---|
| Retention | D1 / D7 / D30 | Share of eligible first-time players who return within the defined windows; segment by acquisition channel and device tier |
| Retention | Replay rate | Completed runs followed by a second run within 24 hours and within 7 days |
| Retention | Episode uptake | Unique players who start and complete newly released stories; check whether old stories remain playable |
| Growth | Share action rate | Result cards shared, copied or saved divided by completed runs; distinguish an opened share sheet from a confirmed export where possible |
| Growth | Share-to-play conversion | New sessions from share links that reach the first consequential decision |
| Growth | Invitation conversion | Invited recipients who voluntarily open a challenge and start play; do not use uploaded address books |
| Revenue | Rewarded-ad opt-in/completion | Player choice and completion, plus any abandonment or complaint rate around the placement |
| Revenue | Purchase conversion and net revenue | Completed purchase events after refunds, provider fees and taxes where the data is available |
| Revenue | Sponsor engagement | Clearly labelled placement views and player-selected clicks; separate views from qualified actions |
| Revenue | Qualified lead conversion | Consented partner referral submissions and downstream qualified outcomes reported by the partner; minimise shared data |
| Trust | Policy/accuracy complaints | Player reports that factual rules, sponsor claims or scam warnings are wrong or misleading; route to human review |

Do not set revenue or virality targets from wishful thinking. Establish baseline results in soft launch, then set targets from actual cohorts. Any monetisation experiment should be rolled back if it materially damages completion, trust, accessibility or return rates.

### Analytics events

Minimum event set:

- `landing_opened`
- `first_scene_rendered`
- `first_choice_made`
- `act_started`
- `act_completed`
- `choice_resolved` (choice ID, run seed and outcome tags; no raw private text)
- `scam_scenario_started`
- `scam_red_flag_selected`
- `scam_debrief_viewed`
- `run_completed`
- `ending_viewed`
- `result_card_generated`
- `share_sheet_opened`
- `result_image_saved`
- `shared_link_opened`
- `replay_started`
- `sync_failed`
- `crash_recorded`

Use sampling and retention limits where appropriate. Do not record clipboard contents or scrape social platforms to confirm what a player posts.

---

## 17. Product delivery plan and release gates

> **Decided (Q2, Q12, Q13):** 25 Nov is a soft date; launch is static with no payments or ledger, so Phase 2 "guest sessions" means on-device saves and share links, not server accounts.

Dates below are an indicative plan aligned to the original ambition of a late-November release before Detty December. Restoring the open-world requirement materially changes the scope compared with a card-led prototype, so the timeline must be re-estimated against actual team capacity and the current technical status. **Do not replace world interaction with static scenes or ship a fake open world merely to preserve the calendar date. If the vertical slice shows that more time is needed, move the launch date rather than breaking the core promise.**

### Phase 0 — Research and direction lock (17–24 October 2026)

**Deliverables**
- Interview 12–20 people across the five player segments, including people in Nigeria, diaspora, returned migrants and people who have chosen to stay.
- Playtest a movement-and-interaction prototype in the opening district, three world-art directions and result-card concepts.
- Review Lagos Life directly and document visual/interaction elements JAPA must not copy.
- Review the current technical spec and dev log against this PRD.
- Research and fact-check the first scam-scenario library against current official guidance.

**Gate**
- Players can describe the game’s unique promise after viewing a short concept.
- The chosen world art style is understood on low-end mobile, supports readable exploration and interaction, and looks materially distinct from other games without sacrificing the open-world promise.
- The team has one agreed MVP route and an honest content scope.

### Phase 1 — Vertical slice (target: late October / early November)

**Scope**
- One playable, explorable Lagos vertical slice—not a card-only prototype.
- Player movement, collision, camera, interaction prompt and at least two meaningful locations or spaces (for example, home and street/shop/cybercafé).
- At least five NPC/object interactions, including one social interaction, one earn/spend interaction and one migration-related interaction.
- One compact quest arc covering a Lagos hustle, a suspicious agent/offer, a consequential choice and a milestone or ending.
- A distinct prototype art direction (compare low-poly 3D and 2.5D/isometric if the renderer decision is unresolved).
- Local save/resume, deterministic state changes and one JAPA Receipt generated from the tester’s actions.
- A low-graphics mode that preserves movement and interaction.

**Gate**
- At least 10 external testers can move, discover an interaction and complete the short quest without being guided through the controls.
- At least 7 of 10 voluntarily explore beyond the direct quest path or try an optional interaction.
- Testers can name at least one character/location/moment they remember.
- No critical movement, collision, save-state or minimum-device defects.

### Phase 2 — MVP content-complete (target: early to mid-November)

**Scope**
- One high-quality explorable Lagos district with several connected/transitioned areas, enterable or meaningfully usable locations, NPCs, side activities and a clear main migration quest.
- One primary destination route with multiple valid approaches; all five acts represented through in-world quests, conversations and world events.
- Approximately 30–45 well-tested story/quest events and at least five substantially different endings.
- At least one job/side hustle, one family/social quest, one scam-awareness encounter and one migration-planning interaction.
- Guest sessions, world/quest resume, inventory/resource state, shareable JAPA Receipts, privacy-respecting analytics and official-source links.
- Low-graphics mode and progressive district loading.

**Gate**
- Deterministic replay matches recorded outcomes for fixed seeds and fixed action sequences.
- Testers can explore, interact, complete the main arc and save/resume without losing world state.
- No payment or monetisation path influences migration outcomes.
- Safety/content review is complete for each real-world claim and target-device playability passes.

### Phase 3 — Closed beta and hardening (target: mid-November)

**Scope**
- Invite a small group of testers from different player segments and phone capabilities.
- Run performance, offline, crash, accessibility and privacy checks.
- Measure first-choice completion, first-act completion, full-run completion and reasons for replay or exit.
- Test the share card on the platforms the audience actually uses.

**Gate**
- No critical privacy or security defect.
- Crash rate below 1% across the agreed supported test set, or a clearly justified fix plan with no release-blocking defects.
- The first choice and run-saving flows are reliable.

### Phase 4 — Soft launch (target: around 5,000 players, only if acquired organically and safely)

**Scope**
- Controlled public access, small creator tests, clear bug-report path and daily review of major failures.
- Validate traffic capacity and analytics quality.
- Run limited experiments on opening hook, choice layout and result cards—one variable at a time.

**Gate**
- Stability, first-run comprehension and share-to-start conversion support broader release.
- No unresolved pattern of players mistaking game scenarios for real immigration advice.

### Phase 5 — Public launch (target: around 25 November 2026, conditional)

**Scope**
- Public launch campaign built around the player’s story, endings and friend challenges.
- Creator kit, social assets, landing page and fallback for traffic spikes.
- Clear status communication and an incident-response owner.

**Gate**
- Run saving, share links, core narrative and scam debriefs work at expected load.
- Any sponsor placement has passed disclosure and content-safety checks.

### Phase 6 — Seasonal live operations (late November–December)

- Add carefully researched Detty December, homecoming and family-obligation content.
- Ship small content updates rather than untested large features.
- Gather feedback about cultural accuracy, overused jokes, confusing costs and endings that feel unfair.
- Do not introduce asynchronous player-versus-player scam challenges until abuse-prevention and moderation requirements are met.

---

## 18. Key risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Looks like a Lagos Life clone | Weak identity and avoidable reputational risk | Preserve JAPA’s own open-world interaction, but create original map layouts, assets, controls, UI, NPCs, progression and migration-first systems; document the “do not copy” list |
| Writing feels like an outsider’s checklist of Nigerian slang | The intended audience will spot the lack of lived-in detail | Pay Nigerian writers/reviewers, test with different regions and classes, and prioritise real constraints over slang density |
| Game mocks people who are refused or scammed | Real situations may be painful or financially damaging | Punch up at exploitation and bad systems; use empathetic writing and a useful post-scenario explanation |
| Scam mode trains the wrong behaviour or enables harassment | Player-versus-player interactions can spill into real life | Locked scenario library, opt-in only, no free text or uploads, no real money, rate limits, blocking/reporting and safety review |
| Immigration information becomes outdated | Incorrect claims could mislead players | Source every factual claim, version content, recheck official links before releases and avoid personalised advice |
| World scope or 3D ambition delays the game or breaks performance | Low-end devices may not load or play well | Reduce district size, asset density and visual effects before removing free movement or interaction; test a playable world slice on minimum devices and stream areas progressively |
| Viral acquisition overwhelms infrastructure | A sudden spike can make the game unavailable | Cache static content, rate-limit sensitive endpoints, protect persistence, load-test shared links and provide a graceful fallback page |
| Players share the joke but do not replay | High impressions may not become durable engagement | Measure second-run start and D1/D7 retention; improve consequence variety and narrative pay-off |
| One ending dominates | Outcomes feel predetermined or choices feel cosmetic | Audit ending distributions and review the underlying choice graph; do not artificially equalise outcomes without diagnosis |
| Monetisation undermines trust | Players may read the game as exploiting migration anxiety | Keep outcomes unpurchasable, disclose sponsors, keep ads out of safety moments and avoid sensitive targeting |
| “Staying” is written as failure | Alienates part of the audience and weakens the story | Give the stay/build path strong mechanics, meaningful milestones and desirable endings |
| Nigerian reality is represented as endless hardship | The game becomes emotionally flat and stereotyped | Include humour, friendship, romance where suitable, creativity, generosity, joy, successful local careers and believable recovery |

---

## 19. Open decisions

> All except D10 (age rating, still needs legal/policy review) were resolved on 17 Oct 2026; see §0 for the full decisions.

Resolve these before production scope is locked.

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| D1 | Core game shape | Open-world Nigerian life simulation with player movement, connected explorable spaces, meaningful NPC/object interaction, quests and migration systems. A compact district is acceptable; card-only/static-scene play is not. | **Decided (P0)** |
| D2 | Rendering / art direction | Prototype stylised low-poly 3D and 2.5D/isometric world options. Choose based on interaction quality, visual identity, device performance and production cost—not on an assumption that open world must be removed. | **Decided (Q4):** Three.js low-poly 3D, gated by a half-day spike on the test phone; isometric Canvas2D fallback; 2D lite mode (Q25) |
| D3 | Live multiplayer | Keep open-world single-player as the baseline. Decide explicitly whether the initial release includes opt-in shared rooms/presence; do not conflate MMO scope with open-world interactivity. | **Decided (Q6–Q8):** single-player + async social at launch; live presence (avatars, emotes, preset phrases, room visits, no free text) as the first major update |
| D4 | Minimum device and payload budgets | Android 9 / 2 GB RAM target; ≤3 MB first interactive payload, hard ceiling 5 MB for boot/first area; progressively load districts while preserving low-graphics interaction | **Kept; validate on devices** (test phone is above the floor; test a 2–3 GB Android before closed beta) |
| D5 | First destination | UK-first draft route, subject to interviews and fact-checking | **Decided (Q15):** UK Student + Stay and Build at launch; UK Skilled Worker next |
| D6 | Gameplay input | Mobile movement control (joystick or tested alternative) plus contextual interact action; tap-based dialogue/decision choices. Desktop keyboard and mouse/touch support where feasible. | **Decided (Q21, Q23):** joystick + contextual button; tap choices; WASD + E |
| D7 | Terms | Use Act / Event / Resource / Background / Ending consistently throughout PRD, technical spec and glossary | **Decided:** applied to PRD, technical spec and glossary (17 Oct 2026) |
| D8 | Tech stack and determinism | Keep the existing stack if it can meet performance, local saving, security and deterministic-run requirements; do not change frameworks solely to achieve a visual concept | **Decided:** keep the existing deterministic engine as the simulation core (Q10); static launch with switchable adapters (Q12); plain JavaScript until npm works on the dev machine |
| D9 | Monetisation | Core run free; cosmetics and clearly disclosed sponsorship only after trust and retention are validated | **Decided (Q13):** free at launch, monetise later |
| D10 | Age rating | Design for adults first; confirm age-rating, monetisation and player-versus-player eligibility before release | **Legal/policy review** |
| D11 | Public launch | Target late November only if reliability, content accuracy and first-run gates pass | **Decided (Q2):** soft date; set after the vertical slice exists |

---

## 20. Definition of done for the first public version

JAPA is ready for public release only when all of the following are true:

- [ ] A first-time player can make a consequential choice within 30 seconds under target conditions.
- [ ] The player can freely move through at least one explorable Lagos district; open-world interaction is present in the first public version, not postponed to a future roadmap.
- [ ] The initial district contains multiple meaningful interactables, NPCs, usable/enterable locations and optional activities beyond the main quest.
- [ ] Movement, collision, camera, contextual interaction, save/resume and state transitions work on the agreed minimum device matrix.
- [ ] The opening and overall art direction feel recognisably JAPA through original world design and migration-focused systems, without copying another game’s assets, interface or signature interactions.
- [ ] One destination route has a complete beginning, middle, gate and aftermath, with multiple valid approaches.
- [ ] At least five substantially distinct endings are reachable through normal play.
- [ ] The core run can be paused and resumed without losing a resolved choice.
- [ ] Fixed-seed test runs are deterministic and reproducible.
- [ ] Every scam-awareness scenario has a documented source, review date and safe post-scenario explanation.
- [ ] No feature asks players to provide real immigration, banking or identity documents.
- [ ] Result cards are generated for every ending and contain no private player data.
- [ ] The game passes the agreed low-end device, data, offline and accessibility test matrix.
- [ ] Analytics distinguish meaningful runs from raw page views and do not collect private conversation contents.
- [ ] The privacy notice, sponsor disclosures, content review and incident-response responsibilities are approved.
- [ ] The team has a post-launch process to fix defects, update route facts and moderate any enabled social feature.

---

## 21. Research references and content governance

The following sources informed the product rationale and safety approach. They should be revisited before public launch, especially for destination-specific immigration claims.

1. **Afrobarometer (18 Dec 2024)** — *Majority of Nigerians have considered emigration in search of opportunity, new Afrobarometer survey finds.* Includes reported overall and youth emigration consideration rates and common reasons.  
   https://www.afrobarometer.org/articles/majority-of-nigerians-have-considered-emigration-in-search-of-opportunity-new-afrobarometer-survey-finds/

2. **National Bureau of Statistics / International Organization for Migration (2023)** — *Awareness and Perception of Intending and Returned Migrants on the Dangers of Irregular Migration.* Use with its sample and geographic limits in view.  
   https://www.nigerianstat.gov.ng/pdfuploads/MIGRATION%20SURVEY%20REPORT%202023.pdf

3. **LEAP Africa (14 Jul 2024)** — *Japa Report: Factors Driving Migration Wave Among Young Nigerians.*  
   https://leapafrica.org/japa-report/

4. **UK Visas and Immigration / GOV.UK** — *Fraud, tricks and scams: guidance.* Covers suspicious messages, fake jobs, guaranteed visas and inappropriate payment requests.  
   https://www.gov.uk/government/publications/frauds-tricks-and-scams/fraud-tricks-and-scams

5. **Immigration, Refugees and Citizenship Canada** — *Protect yourself from immigration fraud.* Includes official checks, representatives, online scams and reporting pathways.  
   https://www.canada.ca/en/immigration-refugees-citizenship/services/protect-fraud.html

6. **Immigration, Refugees and Citizenship Canada** — *Learn about representatives.* Explains that paid immigration representatives must be authorised and that hiring one does not guarantee approval.  
   https://www.canada.ca/en/immigration-refugees-citizenship/services/immigration-citizenship-representative/learn-about-representatives.html

7. **Vanguard (7 Oct 2026)** — *Lagos Life game crosses 2 million users – here's how to play.* Coverage of a current Nigerian browser-game reference point; reports that metrics came mainly from the game’s dashboard and were not independently audited.  
   https://www.vanguardngr.com/2026/10/lagos-life-game-crosses-2-million-users-heres-how-to-play/

8. **BusinessDay (5 Oct 2026)** — *Lagos Life crosses 1m players as Nigerian-built browser game goes viral.*  
   https://businessday.ng/technology/article/lagos-life-crosses-1m-players-as-nigerian-built-browser-game-goes-viral/

9. **Le Monde (1 Oct 2024)** — *Africa takes aim at the video game market.* Discusses the growth of African game development, mobile-first play and demand for culturally relevant local content.  
   https://www.lemonde.fr/en/international/article/2024/10/01/africa-takes-aim-at-the-video-game-market_6727841_4.html

10. **GeoPoll / Pan Africa Gaming Group** — *Gaming in Africa Report.* Survey of more than 2,000 gamers across Nigeria, Egypt, Kenya and South Africa, including interests, play behaviour and localisation.  
    https://www.geopoll.com/resources/gaming-africa-report/

11. **TechCrunch (12 Jan 2022)** — *Wordle founder Josh Wardle on going viral and what comes next.* Useful as a qualitative case study of low-friction browser access, result sharing and group-chat conversation; the creator explicitly notes that virality also involved luck.  
    https://techcrunch.com/2022/01/12/josh-wardle-interview-wordle/

12. **Cohen (2014)** — *What makes good games go viral? The role of technology use, efficacy, emotion and enjoyment in players’ decision to share a prosocial digital game.* Findings are specific to the studied game and population; use as a hypothesis generator, not a universal growth law.  
    https://www.sciencedirect.com/science/article/pii/S0747563213002513

13. **GSMA (2025)** — *Smartphone adoption report*, including the connectivity landscape in Nigeria. The reported national ownership figure should not be treated as a direct estimate of JAPA’s intended audience.  
    https://www.gsma.com/about-us/regions/africa/wp-content/uploads/2025/11/GSMA-SmartPhone_Adoption_Report_sm.pdf

14. **Thomsen, Petersen, Drachen and Mirza-Babaei (2016 conference proceedings)** — *Identifying onboarding heuristics for free-to-play mobile games: A mixed methods approach.*  
    https://portal.findresearcher.sdu.dk/en/publications/identifying-onboarding-heuristics-for-free-to-play-mobile-games-a/

15. **Tyack and Mekler (2024 preprint)** — *Self-Determination Theory and HCI Games Research: Unfulfilled Promises and Unquestioned Paradigms.* A useful caution to apply motivation theory carefully rather than treating it as a formula.  
    https://arxiv.org/abs/2405.12639

16. **Krath, Schürmann and von Korflesch (2021)** — *Revealing the theoretical basis of gamification: A systematic review and analysis of theory in research on gamification, serious games and game-based learning.*  
    https://doi.org/10.1016/j.chb.2021.106963

17. **Entertainment Computing (2026)** — *The impact of video game use of dark patterns and random reward mechanisms on the youth: A systematic literature review.* Read alongside its stated evidence limitations.  
    https://www.sciencedirect.com/science/article/pii/S1875952126000443

### Additional official references for the expanded route and finance mechanics

18. **GOV.UK — Student visa: money you need.** Current UK Student route course-fee and maintenance-fund rules, including the relevant 28-day holding condition. Recheck amounts before each release.  
    https://www.gov.uk/student-visa/money

19. **GOV.UK — Student visa: partner and children.** Conditions for dependants under the Student route.  
    https://www.gov.uk/student-visa/family-members

20. **GOV.UK — Immigration Rules: Appendix Student.** Student work conditions, including term-time limits that vary by study/sponsor type.  
    https://www.gov.uk/guidance/immigration-rules/immigration-rules-appendix-student

21. **IRCC — Express Entry: Proof of funds.** Programmes requiring funds, bank-letter detail, legal access and the rule against borrowing required funds from another person.  
    https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html

22. **IRCC — Express Entry: Language test results.** Current language thresholds and the distinction among programmes.  
    https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html

23. **IRCC — Express Entry: Rounds of invitations.** Evidence that invitation cut-offs vary by round and invitation type; never encode a single evergreen cutoff.  
    https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/rounds-invitations.html

24. **IRCC — Consequences of immigration and citizenship fraud.** Consequences of false documents or information, including the possibility of a ban of at least five years; do not state this as an automatic result of every deposit or error.  
    https://www.canada.ca/en/immigration-refugees-citizenship/services/protect-fraud/consequences-fraud.html

25. **Germany — Make it in Germany: Opportunity Card requirements.** Official qualification, language, points and financial-resource conditions.  
    https://www.make-it-in-germany.com/en/visa-residence/opportunity-card/job-search

26. **GOV.UK — Global Talent visa: digital technology.** Endorsement and evidence requirements; portfolio items are potential evidence, not guaranteed substitutes for eligibility.  
    https://www.gov.uk/global-talent-digital-technology

27. **GOV.UK — Find an immigration adviser.** Check current adviser authorisation before the product labels a partner as regulated or qualified.  
    https://www.gov.uk/find-an-immigration-adviser

### Rules that must never be hard-coded as universal truths

- A single naira amount is not a universal proof-of-funds threshold for all routes or countries.
- A sudden bank deposit does not automatically trigger a Procedural Fairness Letter, refusal or ban; evidence and context matter.
- Canada’s “five-year ban” is a possible consequence of certain findings of misrepresentation, not an automatic outcome for every discrepancy or unusual transaction.
- The UK Student route’s 28-day financial holding rule is not interchangeable with Canada’s bank-letter / proof-of-funds framework.
- Express Entry CRS cut-offs depend on the type and date of invitation round. Do not teach an evergreen “safe” score.
- IELTS thresholds vary by programme and are assessed across abilities; a 6.5 in one skill should not be represented as an automatic universal refusal.
- Having no property, spouse or children is not a universal ground for refusal. Use the actual test and evidence requirements applicable to the fictional route.
- No test score, game ending, paid item, sponsor or adviser can guarantee a real immigration outcome.

### Required ongoing research

- Conduct player interviews and observation before locking dialogue, visual style and ending names.
- Maintain a country-by-country source register for migration-process claims and scam-awareness content.
- Recheck official source links and claims before every major content release.
- Revisit player metrics weekly during soft launch, but do not make product decisions from one viral post or one day of traffic.
- Separate verified research findings, player quotes, design hypotheses and editorial fiction in internal content notes.

---

## Final product rule

**JAPA must feel like a place players can inhabit, not a stack of cards they click through. Open-world movement and meaningful interaction are core requirements; narrative, financial literacy, immigration learning, retention, viral sharing and monetisation must be built around that living world. If scope must shrink, shrink the map and asset density before removing player agency—and never let the commercial engine corrupt the educational truth of the game.**
