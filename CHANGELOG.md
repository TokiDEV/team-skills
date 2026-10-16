# Changelog

What each version of team-skills changed, newest first.

## 0.10.0 — 2026-10-16

team-review and team-refactor work as one loop, and stop paying where they bought nothing (from an 18-run sweep's post-mortem).

- **Hand-offs are taken in.** One line format for *For team-review* and *For team-refactor* (`team-protocol` § *Lane hand-offs*): a scenario, med or high confidence, the test that pins it. `/team-review <refactor record>` sends a refactor's suspected bugs straight to the verifier, no seats; `/team-refactor <review record>` refactors what a review flagged, with the full panel.
- **Sweep.** Review every zone, execute its fixes, refactor only where a review asks, then one intake review of the refactors' hand-offs (`team-protocol` § *Sweep*). It replaces refactor's "all of them, one run each".
- **Records first.** Every Recon reads both review and refactor records on its scope: what was refuted, rejected or left as debt is *Settled* and not raised again, and gates start from the last record's commands.
- **Diff guard.** Each executor runs a guard on its staged change before committing: no added suppression comment, no file outside the fence, the formatter clean on the touched files. A hit stops the step.
- **Gates cover the scope.** Recon lists the files lint and typecheck never reach (*Ungated*); review cards them, refactor hands them to review.
- **Known flakes** live in the profile (`## Known flakes`, kept by team-scan); team-review applies the flake rule too.
- **Auto-accept builds no page** on team-review and team-refactor: the synthesis carries each item's options, and the record writer takes the recommendations.
- team-review: Security sits only when the brief lists a trust boundary; a finding may carry two candidate fixes (`fix-a`, `fix-b`), the recommended one keeping the behavior and data from before the change; card extraction is a tested script (`cards.sh`), safe from skill argument substitution and from seat-named prefixes.
- team-refactor: on fresh code the panel is Mechanics, Depth and Safety Net plus the Minimalist gate; copies that behave differently are not duplicates (`KILL — behavior change` goes to *For team-review*).
- The orchestrator appends the *Execution* section to the record itself; a fixup gets an opus re-check unless it touches only formatting, comments or test names.
- The orchestrator copies the skill files first and reads only the run-folder copies: no permission prompt on `templates.md`. The README gives the read rule for an install that still prompts.

## 0.9.0 — 2026-10-15

The bridge: business and tech on one decision.

- Every argument, metric and figure on a council, plan or kickoff card carries a lens, `business` or `tech`. The card header names the lenses it concerns; a card with arguments of both switches them by tab (`b` / `t`). The sidebar's lens filter hides the cards that concern only the other lens.
- Each weighty card shows its bridge: the constraints that bind it, what each option gains and costs per lens, and what the recommendation accepts. On a wide screen the bridge heads the evidence column.
- An option that breaks a constraint stays choosable and carries a *lifts K2* badge; choosing it lifts the constraint, and the decisions block says so (`D1 = buy (lifts K2)`). A recommended or default option never breaks one, so auto-accept never lifts a constraint.
- `team-protocol/bridge.md` defines lenses, constraints (`K<n>`, standing `KS<n>`), statuses and trade-offs once. team-council fills them from the framing to the record, team-council-plan carries and checks them, team-kickoff fills its restate, and team-scan keeps the profile's standing constraints across re-runs. A lifted standing constraint stops binding.
- Gates without lenses render as before, with the same saved choices.
- Example: `examples/council-gate/`.

## 0.8.2 — 2026-10-15

Structural choices are the CEO's.

- A new package or module, layer, dependency rule, public contract or folder convention is a choice the CEO makes between options, never a writer's call or an "approve" on a routine step. Defined once in `team-protocol`.
- team-council's CTO names each one; team-council-plan settles the rest before drafting and records them in the plan's *Structure*; team-refactor and team-kickoff put them on their gates.

## 0.8.1 — 2026-10-15

One rule, one place.

- After an audit, every rule several skills share lives once in `team-protocol` (writers, code scope, execution, weakened checks); each skill keeps only its own additions.
- team-review always hands its fixes to a fresh session.
- team-ceo-view fields are defined once in `contract.md`. Markdown only; no renderer change.

## 0.8.0 — 2026-10-14

- Per-run `auto-accept`: every gate of that run skips the page and takes each card's default or recommendation (`render.js --accept-recommended`). Claude asks in chat only about cards with no recommendation, items relying on a declined one, and premise corrections.

## 0.7.0 — 2026-10-14

- **team-review**: four blind seats (Correctness, Security, Intent, Craft) and a verifier that tries to refute each finding before it reaches the human. On your own branch, fixes go test-first, one finding per commit. Recorded under `.council/reviews/`.
- **Share a review gate** with the branch owner: as a file, a claude.ai link, or a pending review on the MR/PR (`--share`, `--review=github|gitlab`), with the sharer's choices pre-filled (`--preset`).
- One lane per skill: the fix decides the lane, and each skill hands off what it finds outside its own.
- `render.js` becomes a thin CLI over `lib/`, with tests (`node --test test/ceo-view/*.test.js`).

## 0.6.0 — 2026-10-10

Lessons from live council, plan and refactor runs.

- Skill files are copied into the run folder before dispatch, so agents read them without permission prompts.
- team-refactor: one refactoring per step; gate commands verbatim; known flakes.
- team-council: the framing lists environment facts; CEO answers kept verbatim; an evidence pass.
- team-council-plan: open questions and human-only inputs settled before drafting; the contract and keystone sub-plan before consumers; amending a decision at the gate re-gates only what changed.
- Each skill split by reader (`templates.md`, `contract.md`, `counting.md`), so the orchestrator loads less.

## 0.5.1 — 2026-10-09

- Final-review findings in team-refactor go to a fresh executor as `fixup!` commits, never to the orchestrator.

## 0.5.0 — 2026-10-09

Hardened against shortcuts.

- Descriptions say when to use a skill, never its workflow.
- Shared rationalizations and red flags in `team-protocol`; an off-model seat (Codex or Gemini CLI) with the user's yes.
- team-council: a framing interview, earlier decisions given to every role, supersession links, records in the project's ADR format.
- team-kickoff: the vision step is an interview. team-refactor: weakened checks are red flags.

## 0.4.0 — 2026-10-09

- Roles are lenses, named after what they look at, each with 5–8 declared sources; agents pick and name the 2–3 that fit.
- team-refactor seats renamed: Responsibilities, Mechanics, Sequencing, Safety Net, Depth, Minimalist.

## 0.3.0 — 2026-10-08

- A drawing guide for figures (`figures.md`): when to draw, which diagram fits, drawing rules for the page.

## 0.2.1 — 2026-09-30

- Companion skills (planning, execution, exploration, TDD) come from the project profile, not by name.

## 0.2.0 — 2026-09-30

- `team-protocol`: one shared skill for dispatch, the run folder, the agent contract, counting positions and the fresh-session handoff.
- team-council fits its roster to the decision; only a position with checkable evidence counts toward a majority.
- The CEO page shows the outcome under the summary and keeps cards short; `render.js --serve` posts the decisions back to Claude.
- One card per question: a majority makes a decision, no majority a tension.
- Token economy: model tiers, tool budgets, an agent contract and fresh-session handoffs.

## 0.1.0 — 2026-09-27

- First release: team-scan, team-council, team-council-plan, team-kickoff, team-refactor and team-ceo-view, packaged as a Claude Code plugin marketplace.
