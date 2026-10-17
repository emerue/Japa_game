---
name: triage-feedback
description: Rank JAPA tester feedback from the Tally form into docs/feedback/backlog.md and open a pull request.
disable-model-invocation: true
---

# Triage tester feedback

Turn every tester response into a ranked **backlog**: the issues worth fixing next, highest score first. You are the triage desk: you read, group, score and write. Edit only files under `docs/feedback/`; the game code changes later, when @ikenna picks items from the backlog.

Source: the Tally form **q5ZzW2** ("JAPA tester feedback"), read with the Tally connector's `fetch_submissions`. Questions: how far they got, what confused them, what felt real or fake Lagos, a 1–5 rating for wanting the next part, and phone model. Hidden fields: `build` and `stamp` (the receipt stamp: SCAMMED, SAVED or EXPOSED; empty means they never reached a receipt).

## Steps

1. **Check for news.** Read the header of `docs/feedback/backlog.md` (if it exists) for "Responses read". Fetch every submission. If the count matches, there is nothing new: stop and report "No new feedback since <date>". Done when you know the total and the number of new responses.

2. **Read every response.** Split each one's free text into observations. Tag each observation with a **stage** (room, landlord, street, cybercafe, office, receipt, general) and a **kind**:
   - _blocker_: stopped them progressing or finishing (stuck, crash, red error box, couldn't find something);
   - _confusion_: they got through but didn't understand what to do or why;
   - _fake_: it didn't feel like Lagos (wrong word, wrong price, wrong behaviour);
   - _polish_: looks, feel, speed, small annoyances;
   - _praise_: what worked. Keep these; they say what to protect.
   Done when every response is accounted for: each has at least one observation or is marked "nothing actionable".

3. **Cluster** observations that share a root cause into one issue, named by the player's problem ("No idea where to go after the voice note"), not by the fix. Then read `docs/feedback/fixed.md`: for an issue listed there, keep only observations from builds after the one it was fixed in (builds count up: slice-1, slice-2, …; a `-lite` suffix means the 2D lite view). If none remain, move the issue to a "Fixed, watching" list instead of ranking it; if some remain, rank it and say the fix didn't fully work.

4. **Score** each issue:
   - **Reach** = testers who hit it ÷ all testers (0–1).
   - **Impact**: blocker 5, confusion 4, fake 3, polish 1.
   - **Effort**: read the code it touches (`Japa_game/src/`, the zone data, `src/content/slice.js`) and estimate S = 1, M = 2, L = 3.
   - **Score** = reach × impact ÷ effort, two decimals. Break ties toward whatever gets more testers to a receipt (PRD §0, Q27 acceptance criteria).
   Done when every issue has all four numbers and the files it touches.

5. **Write `docs/feedback/backlog.md`**, replacing the previous version, in this shape:

   ```markdown
   # JAPA backlog from tester feedback

   Responses read: <total> (<new> new) · Last run: <YYYY-MM-DD> · Builds: <builds seen>

   ## Ranked issues
   ### 1. <player's problem> — score <x.xx>
   Reach <n>/<total> · Impact <kind> · Effort <S/M/L> · Stage <stage>
   > "<quote>" — <phone model>
   > "<quote>" — <phone model>
   Files: `<path>`, `<path>`
   Proposed fix: <one or two sentences>
   ...

   ## How far testers got
   Room <n> · Landlord <n> · Office <n> · Receipt <n>. Stamps: SCAMMED <n>, SAVED <n>, EXPOSED <n>. Want the next part: average <x.x>/5.

   ## Fixed, watching
   - <issue> (fixed in <build>): <n> reports since, or none

   ## What's working
   - <praise, with a quote>

   ## Phones
   <model>: <n> ...
   ```

   Quotes are verbatim, with the phone model when the tester gave one. No names or contact details (the form doesn't collect any; drop any a tester typed in). Done when every issue from step 4 appears, in score order.

6. **Open the pull request.** Create branch `feedback/triage-<YYYY-MM-DD>` from `main`, commit only `docs/feedback/backlog.md` with the message "Feedback triage <YYYY-MM-DD>: <n> responses, top issue: <name>", push, and open a PR to `main` with `gh pr create`. The PR body lists the top three issues with their scores and ends with the attribution line the system provides. Done when the PR URL exists; report it.

If the Tally connector or GitHub push is unavailable, stop at that step and report exactly which one failed, so the run can be repeated once access is fixed.
