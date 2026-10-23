# Changelog

What each version of team-skills changed, newest first.

## 0.16.2 — 2026-10-23

- **Biz, not Business.** The page labels the business lens *Biz*: the lens marks, the *Both | Biz | Tech* switch, the trade-off column, the Filter menu and the shortcut list. The JSON key stays `business`, so existing gates render unchanged.

## 0.16.1 — 2026-10-23

- **List marks on the first line.** A row's status mark, and the rail elbow that meets it, sat 5px under the title, level with neither line. It is now centred on the lowercase of the first line, where the eye reads it, in whatever font the reader's `system-ui` resolves to: the page measures it (baseline plus half the x-height) when the list lays out, and again when it is shown, narrowed to a rail (where the id is the line) or widened.

## 0.16.0 — 2026-10-22

- **The author's note (team-review).** The session that wrote a change has no voice in its review: no seat, no answers to the seats, no running the review itself. Its last step is a note in `.council/author-notes/<branch>.md`, ~20 lines: intent, deliberate choices with what they trade away, known gaps, what was checked by hand. Recon copies it into the Review Brief as `author claim` lines; the verifier never sees it. A claim refutes nothing: a choice whose scenario still breaks stays a card naming the claim; a scenario the choice already accepts goes under *Not raised* as `author choice:`, and onto the gate's *Settled without you* list, where the CEO can reopen it. Invoking team-review in the conversation that wrote the code writes the note and hands off to a fresh session. The note is deleted with the run folder.

## 0.15.0 — 2026-10-22

- **Evidence per option.** An option, or a tension side, can carry its own `code: { "after" }` (plus `"before"` where it differs; the item keeps the shared `before`), `metrics`, `figures` and `accepts`. The evidence pane shows the chosen option's, else the recommended one's, beside the item's own; an *Evidence for* picker atop the pane shows another option's without choosing it, and a new choice brings the pane back to it. An option with no code of its own (Defer, Decline) shows *Before* alone. The renderer rejects an option `code` with no `after`, a `code.after` on the item beside options that carry their own, and an option `accepts` over 160 characters; a recommended option's own `accepts` stands in for the item's.
- **Accepts is never wrong.** It used to show the recommended option's cost whatever was chosen. It now shows the chosen (or picked) option's; an option without one shows the recommended one's under "The recommended option accepts".
- **An outcome can follow a card.** `outcome[].on: { "id", "when" }` shows an entry only while that card's answer, chosen else recommended, is in `when`, headed "If D1 = …".
- **First click on an option no longer lost.** Focusing an option by mouse added *Enter · Choose focused* to the key legend; at some widths the legend wrapped to a second line between mousedown and mouseup, the option moved from under the pointer, and the click was dropped. That key now shows for keyboard focus only.
- **Three sides stack.** A tension with three sides or more lists them one under the other, divided by a rule, instead of leaving the third alone and offset on a second row. On narrow screens every column after the first now gets its rule, not only the last.

## 0.14.2 — 2026-10-22

- **Figures readable again.** The 0.13.0 redesign dropped `--surface`, `--surface-2` and `--accent`, the colours `figures.md` gives figure authors: box fills fell back to the text colour and swallowed their labels. They are back, scoped to figures: fills and label masks take the ground the figure sits on, and the focus is told by brightness alone (text in ink-2, sublabels a step below, the focus in full ink), so no hue takes a second meaning. A test now checks that every colour `figures.md` names is defined.
- **Web links in text.** `[ticket #1892](https://…)` renders as a link on the words, in a new tab; a bare URL links too and wraps instead of spilling into the next column. Only `http(s)`. The contract asks for the first form.

## 0.14.1 — 2026-10-22

- **The gate page opens on the summary.** The one-line summary strip under the top bar is gone. The page lands on the *Summary* item, the first row of the list, instead of the first card to decide. A card named in the address (`#d-ID`) still opens first. `z` still goes from the summary to the card and back.

## 0.14.0 — 2026-10-21

- **File links on gate pages.** A repo file the page names (in backticks, `` `path` `` or `` `path:line` ``, a card's `at`, the record) becomes a link. On the served page a click opens it in your editor at that line, through the local server: `CEO_VIEW_EDITOR` if set, else the IDE Claude runs in (VS Code or JetBrains), else `code` or `idea` on the `PATH`. The GitHub or GitLab logo beside it opens it on the remote repo (any host other than github.com is taken as a GitLab) at the pushed commit, else the pushed branch. The shared page links the remote only, never a local path. Files git doesn't track (`.council/`, uncommitted ones) get no remote link. The server opens only files the page names.

## 0.13.1 — 2026-10-21

- Agents read run-folder files with the Read tool, several in one message, instead of `cat`-ing them through Bash. A batch over Bash's output limit got copied to `$TMPDIR`, and reading it back there asked for permission.

## 0.13.0 — 2026-10-21

The gate page is redesigned as a decision console: one screen to move through the cards, weigh them and answer.

**Layout**
- **Three panes.** Left, the list of every card by section; centre, the current card (what's at stake, details, For and Against with each point tagged Business or Tech, your choice with keycaps, a note); right, the evidence (constraints, one trade-off table with Business and Tech columns, numbers, code before and after, suggestion, location, figures). Arguments appear only in the centre. A card whose only evidence is a location spans the evidence column.
- **Rails.** In the list, a solid elbow means a card refines another (`on`), a dashed one that it needs another first (`after`). Each row carries a status mark and word, and lens marks. Search and a Filter menu sit above it.
- **Lenses.** A *Both | Business | Tech* switch narrows the evidence pane; `l` cycles it, `b` and `t` pick one.
- **Colours keep one meaning each.** Amber marks the recommended option only, green what you chose, red blockers and lifted constraints. For and Against keep their blue and copper, never the green and red of a code diff; Tech is teal so it never reads as For.
- **A collapsible list.** The list narrows to a rail (marks and ids) or hides entirely, by the buttons on the pane or `[`; the state is remembered per gate.
- **Top bar and summary.** Title, kind, date, record, *Decided n of m*, Reset, Accept recommended, Send to Claude (served) or Copy decisions, Share (review gates), Keys. A one-line summary strip opens *Full summary* (summary, outcome and figures) as a *Summary* item at the top of the list.
- **Dark only.** On phones: Cards, Card and Evidence tabs and a bottom bar.

**Keys**
- `←` `→` `↑` `↓` `j` `k` move, `1`–`9` choose, `Enter`, `Tab` / `Shift+Tab` step through options, `u` next to decide, `n` note, `r` recommended, `l` lens, `b` / `t` Business / Tech, `a` accept recommended, `s` send (served), `c` copy, `z` full summary, `/` search, `[` list pane, `Esc`, `?` keys.

**Behaviour**
- `Tab` cycles the options only while focus is on an option or nowhere.
- The list follows the dependency tree order.
- `u` skips cards no longer needed.
- Minor, settled and rejected sections are rows marked "Defaults applied, open to change." instead of folded boxes.
- README screenshots retaken; skill docs describe the new page.

## 0.12.0 — 2026-10-21

Two review gaps: breakage outside the diff, and scale judged without a load.

- **team-review: breakage outside the diff.** Recon's brief gains a *Reach* section: every caller or reader of a signature, return value, field, error or unit the diff changes, with `ok` or `broken`. The Correctness seat checks each against the new contract. A caller the diff breaks in a file it leaves untouched is now a card (`In diff: reach`), anchored on the changed line so its thread lands in the diff. Only defects the diff did not cause go to *Not raised*.
- **team-review: an expected load.** The brief carries the project's *Expected load* (one user running a script, one process, several instances sharing a store). Races and cost are judged against it: a race that load never reaches is *Not raised*, a race or cost card names the load it assumes, and *blocker* means it breaks a main path at that load. A load the human corrects at the gate goes back into the profile.
- **team-scan:** the profile gains `## Expected load`, from the README and the deploy config, or marked `assumed`. A load the user corrected survives a re-scan.

## 0.11.0 — 2026-10-20

Gate clarity and lean runs (from a post-mortem of six runs on 0.10.x: you answered through free-text notes, gates were bloated, and each run spent 11–47M input tokens).

**Gate page**
- **Linked cards.** A card that only makes sense within another card's choice carries `on: { "id", "when"? }` and renders in that card's block, right under it, behind a coloured rail, with a chip ("refines D1"). When the root's answer is negative or outside `when` (chains too), the child is moot: greyed, written `M3 = moot (D1 = hand)` in the decisions block, and skipped by *Accept recommended*, the share prompt and the review. A refutation is an `against` argument or a premise correction on the card it refutes. A card whose options the other's answer removes or forces is merged with it into one card of combinations.
- **Order you can trust.** `needs` is now `after` (work order, no hierarchy; `needs` is still read). The renderer orders the page so nothing shows before what it relies on, and a card shows "↳ after S0 — chosen ✓" or "answer it first ↑"; the other card shows "S2 comes after this". Nothing locks.
- **Settled without you.** What an agent answered from the code, every `assumed` premise taken as true, every default the orchestrator took, and every question sent to the author's comment fold into a last section, pre-applied **OK** with **Reopen** (`A3 = reopen | note`). A reopened one is an open question.
- **Constraints on the cards they bind.** The unreadable page-level block is gone, and a constraint binding no card is dropped. A copy of a constraint on several cards keeps one id and stays identical.
- Triage: a plan step with no decision is minor and approved at once; unanimous, zero-cost structural choices are one card *Confirm the structure*; at most ~7 weighty cards, folded by the writer, never by asking you. A card says what it changes for you, glosses jargon and opens with what exists today.
- A review's counts in the shared body come from the cards, never typed. An amendment merges into an unanswered gate; `-r<N>` only for one already answered.
- Old gates that now fail the renderer, and how to fix them: a page-level `constraints` (move each onto the cards it binds); a decision that comes `after` a tension (use `on`); a weighty card after a minor one (drop `minor` on the one it relies on); a card relied on in another decision group, when the dependent's group is already placed above (the page otherwise reorders the groups; put both cards in one group, or link them with `on`); a card relied on in Tensions, Minor or Settled below it (drop `minor` or `settled` on it, or link with `on`). Gates without the new fields render and save as before.

**All skills**
- **Lean runs.** Agents return asynchronously; while a round is incomplete a notice gets one line (under 10 words) and no tool call. A follow-up needing more than one grep goes to a Sonnet evidence agent, and a record amendment of five lines or fewer is appended directly.
- `team-protocol` is split: `scope.md`, `execution.md` (Execution, Sweep, Weakened checks), `auto-accept.md` and `lane-handoffs.md` are read only by the step that needs them. Total SKILL.md size does not grow, and the run folder is created after the preconditions pass.
- **Only real questions reach you.** A question the code answers is answered with `file:line` and goes to *Settled without the CEO*; a negative claim lists what was searched, else it is `unverified`; every `assumed` premise sits in a question or in *Settled*.
- **Visible choices are yours** (UI placement, wording, flow), as structural choices already were; a spike answers a fact, never such a choice.
- **Open answers.** An UNDECIDED or a note that asks a question gets one check, then one chat question stating only what the run's files hold; the record says "gate pick X, changed in chat to Y".
- **Handoff checks.** Before the run folder is deleted, the deliverables are grepped for `runs/` and run-only ids; what is worth keeping goes to `decisions/<name>-sources/`. The commit question names any gitignored file the next phase needs.

**Per skill**
- team-council: framing lists the *variants* of the decided object and a *glossary* of your terms, used verbatim; the evidence pass runs first, with `file:line`, and lists its own contradictions. Constraints are limited to what cannot be repaired inside the plan (about 8 K); `confirmed` needs a checked source.
- team-council-plan: traces cite decision ids only, no run-folder paths; about 40 lines per task and 800 per plan, beyond that sub-plans; one fixer per review round; a consolidation pass before approval; Opus executors only for a step marked design-heavy, with the reason.
- team-review: the forge head SHA is resolved first and a stale local branch is said and offered for alignment; long gates run in parallel; one Recon size cap; a missing tool is `Ungated … (tool missing)`; one verifier for all zones; an optional `Replacement:` line feeds `suggestion`.
- team-scan: the profile gains `## Environment limits`. team-review and team-refactor offer a scan when the profile is missing; team-council and team-council-plan run it at once.
- Records: a correction folds into its decision with a one-line *History*; a decision record opens with *Decisions in 10 lines*.

## 0.10.1 — 2026-10-19

- A review shared on GitHub or GitLab gives every card whose line is in the diff its own thread, minor ones included; the body keeps only the cards it cannot anchor (*Not anchored in the diff*, *Minor*), each with its location. team-review's gate writer may now put a one-click `suggestion` on a minor finding.

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
