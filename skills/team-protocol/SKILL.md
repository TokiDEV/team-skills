---
name: team-protocol
description: Use when running any team-* skill (team-council, team-council-plan, team-kickoff, team-refactor, team-review) — dispatching its role agents, settling what they disagree on, or handing off at a CEO gate.
---

# team-protocol

The rules every team-* skill shares. Each caller owns its roles, rounds and gate mapping; this skill owns how agents are dispatched, how their positions are counted, how a run hands off, and how approved work is executed and checked. When a caller and this skill disagree, the caller wins for its own flow.

## Dispatch

- **One agent per role, dispatched in parallel.** Never play the roles yourself in one context (one context, one opinion in several costumes).
- **Separation of context.** Every agent gets the minimum it needs; none receives the conversation, the raw transcripts or another agent's output unless its caller says so. The caller's table says what each one receives.
- **A round is one message, in the foreground.** Send every agent of a round in a single message with `run_in_background: false`. The next step needs all the replies.
- **Pass the model and budget** from the caller's table to every dispatch.
- **Skill files go into the run folder first.** The skill's base directory (`~/.claude/skills/…` or the plugin cache) is outside the project, so an agent's Read there waits on a permission prompt. Before the first dispatch, copy every skill file an agent will Read into the run folder with one Bash call: the caller's `templates.md`, the role files, this skill's `counting.md` and `bridge.md`, this skill's `SKILL.md` as `team-protocol.md` when the caller's `templates.md` points to a `team-protocol` section, and `team-ceo-view`'s `contract.md` and `figures.md` for any agent that builds a page or draws a sketch. E.g. `cp <base directory>/{templates.md,roles/role-*.md} <base directory>/../team-protocol/{counting.md,bridge.md} <base directory>/../team-ceo-view/{contract.md,figures.md} <run folder>/ && cp <base directory>/../team-protocol/SKILL.md <run folder>/team-protocol.md`. Adapt the paths to the caller: team-council-plan has no `roles/` and copies its role files from `<base directory>/../team-council/roles/`; team-kickoff has no `templates.md` and no `roles/` (its council run copies team-council's). Then point each agent to its copy; a template's pointer to a `team-protocol` section means that section of `team-protocol.md`. A script run through Bash (`render.js`, `cards.sh`) needs no copy, and a project override (`.council/role-overrides/`) is already inside the project. **The copy is the run's first action, and you read the copies too.** Read no skill file but the SKILL.md the Skill tool loaded until it is copied. When you need a section yourself, read it from the copy (`grep -n '^## ' <run folder>/templates.md` first), never from the base directory: a Read there stops the run on a permission prompt.
- **Role overrides.** Templates live in the caller's `roles/`. A project may override any of them with `.council/role-overrides/role-<name>.md`; the project file wins. `<name>` is the role's file name.
- **Roles are lenses.** A role is named after what it looks at, never after a person. This holds for built-in roles, ad-hoc specialists and project overrides.
- **Sources.** Every role file has a `## Sources` section: 5–8 entries, one line each, a source and the question or test it brings. The list is varied on purpose, in gender, country, discipline and epoch. A source earns its place by changing what the agent does.
- **Pick and declare.** The agent picks the 2–3 sources that best fit the case and is not bound to the others. It names the ones it used, where its caller's output format says.
- **Ad-hoc specialists.** When you summon one, write it 3–5 sources by the same rule.
- **Attribution.** Every finding is credited to the role that made it, including what a role got from a specialist skill.

## Writers

Writers keep the orchestrator short. Gate JSON, decision, refactor and review records, exec briefs and plans are written by agents (from the synthesis file, the decisions block or a reviewer's lines). The orchestrator writes prompts and small run-folder notes, flips a `Status:` line, appends a record's *Execution* section, serves the page, and passes the decisions block on. Each caller's table gives these writers a model and a budget.

- **The synthesis** stays under ~300 lines and holds everything the gate page and the record need, since it is the only run-folder file the gate writer and the record writer read.
- **The exec brief** is for the executors and nothing else: a header (scope, the quality-gate commands copied verbatim, fences for the whole run), then the approved cards in order. No debate, no arguments, no declined or rejected items. Aim under ~150 lines.
- **After execution**, complete the record yourself with one Bash call that appends to it (`cat >> <record> <<'EOF'`), then flip `Status:` to `executed`. The appended `## Execution` section copies the reply lines as they came: *Commits* (hash and item, one line each), *Reverted or blocked* (item and reason), *Notes* (the final reviewer's `note` findings; the caller says what they count as).

## Off-model seat

The caller names the seat that can go off-model. Before the roster line that seats it, read `off-model.md` in this skill's base directory: why, when to offer it, and how to run it.

## Run folder

`.council/runs/YYYY-MM-DD-<topic>/`. Every agent writes its full output there, except a writer whose output is a project file (*Agent contract*). Later agents (Round 2, gate, synthesizer) read the files they need from it. The orchestrator reads only the synthesis file, or, in a flow with none, the reply lines its caller names.

## Agent contract

Append this block to every dispatch prompt, with the budget, run folder and agent id filled in. Every turn re-reads the whole context, so context size × turns is the bill.

```markdown
## How to work
- Budget: about <N> tool calls. Put several searches in one Bash call; Read a file once, whole.
- Tool rules: <the user's standing tool rules from CLAUDE.md, e.g. "absolute paths, never `cd`">
- Only a command's output counts, never IDE diagnostics (they can come from stale buffers). Run each gate command exactly as your brief writes it, with no pipe, redirect or prefix added.
- Write your full output to <run folder>/<agent id>.md.
- Reply with: the file path, one line per position, card, verdict or defect (id + title), and any questions for the CEO. Nothing else.
```

Drop the *Tool rules* line when the user has none. A caller may add lines above the budget (team-refactor adds "Start from the Code Brief").

**A writer whose output is a project file** (a plan, a record, an exec brief, a gate JSON) writes it there: its project path replaces the run-folder line, as `- Write your full output to <project path>.` An off-model seat replaces that line too (`off-model.md`).

An agent whose job is not to change the project (a role, a reviewer, an evidence pass) also gets this line: `- Leave the project tree as you found it. Scratch files (a probe test, a script) go in <run folder>; if a tool only runs them from inside the tree, delete them before you reply and say so.`

## Counting positions

Every question the roles disagree on is settled by `counting.md` in this skill's base directory: the count goes in `tags` (`3–1`). The synthesizer and the writers apply it from their copy.

**Confidence.** `counting.md` § *Confidence* is the only definition of `high`, `med` and `low`; agents apply it from their copy.

## Bridge

How business and tech meet on one decision is set by `bridge.md` in this skill's base directory: lenses, constraints and trade-offs. A caller that follows it names it in its REQUIRED BACKGROUND line; its role agents, synthesizer and writers apply it from their copy.

## Structural choices

A structural choice is any of: a new package or module, a new layer, a dependency direction or import rule, a public contract other code builds on, a folder convention. Each is expensive to undo, so the CEO makes it as a choice between options, with a recommendation. A writer never settles one, and an `approve` on a routine step that happens to create one is not that choice. The caller says where its structural choices reach the CEO. A settled one that later work could break also becomes a constraint (`bridge.md` § *Structural choices and constraints*).

## Code scope

For a caller that reads existing code (team-refactor, team-review). The caller names its brief, which lines it counts, how Recon ranks a whole repo, and the seats that always run whatever the size.

- **Size.** Under ~150 lines, write the brief yourself by the caller's template instead of dispatching Recon. Above ~3,000 lines, or more than one package, narrow the scope before dispatching the panel.
- **Narrowing.** For the whole repo, or a scope over that cap, dispatch Recon first to rank zones by the caller's criteria. Then ask the user to pick, with the ranking in the question: each option carries its size and its main risk, and one is marked *(Recommended)*.
- **Recon writes its brief to a file.** Use a general-purpose agent, or a code-exploration agent from the profile's Technical domain that has Write. The built-in `Explore` has no Write; if you use it, save its reply to the run folder yourself.
- **The brief** stays under ~60 lines, plus the excerpts, at most ~200 lines in all. Its quality-gate commands go in **verbatim as Recon ran them**, each with its result. No placeholders: a command nobody ran is not a gate.
- **Records first.** Recon reads every record under `.council/reviews/` and `.council/refactors/` that names a file in scope, and lists under *Settled*, one line each: refuted cards with what refuted them, findings left as known debt, rejected cards, *Leave alone* items, declined items with the CEO's note. A card that restates a *Settled* line is not raised again unless it cites evidence the record did not have. Recon starts from the latest such record's *Quality gates* and reruns them.
- **Gates cover the scope.** Recon checks that the lint and typecheck commands reach every file in scope (the `tsconfig` `include`, the linter's file patterns, the CI job's paths) and lists the files they miss under *Ungated*: a check that never runs on a file passes for it. A gate that fails repo-wide also gets a touched-files form, run on the scope (e.g. `npx prettier --check <files>`).
- **Known flakes.** Recon copies the profile's `## Known flakes` into the brief and adds each test that failed, then passed on a rerun, during its own runs.
- **Diff guard.** Recon writes the brief's *Diff guard*: the commands each executor runs on its staged change before a commit (§ *Execution*), with the profile's formatter (prettier, biome, ruff, gofmt) in the third line, or without that line when the project has none. Recon runs that check on the files in scope first and lists those already failing under *Unformatted*; the third line leaves them out.
  ```bash
  P='eslint-disable|@ts-ignore|@ts-expect-error|(istanbul|c8|v8) ignore|noqa|type: ?ignore|pragma: no cover'; a=$(git -C <repo> diff --cached -U0 | grep -cE "^\+[^+].*($P)"); d=$(git -C <repo> diff --cached -U0 | grep -cE "^-[^-].*($P)"); [ "$a" -gt "$d" ] && echo "GUARD: suppression added ($a added, $d removed)"
  git -C <repo> diff --cached --name-only
  <the formatter's check on those files, e.g. npx prettier --check --ignore-unknown $(git -C <repo> diff --cached --name-only --diff-filter=d)>
  ```
  The first command prints nothing on a clean change (a moved suppression is not an added one); the second lists the staged files, to hold against the card's *Fence* and its named files.

## Lane hand-offs

For team-refactor and team-review, which each hunt in one lane (`team-review` § *Lanes*) and hand what they stumble on in the other to a list named for the receiver: *For team-review*, *For team-refactor*.

- **One line each:** `- <file:line> — <what> — <scenario> — <high|med> — pinned by <test | none>`. The scenario says where it bites: for a suspected bug, the input and what goes wrong; for structure, the change it makes hard and how. *Pinned by* names a test that pins the behavior as it is today (a refactor's Step 0 test), or `none`.
- **Only what could become a card.** Leave out a line with no scenario, a `low` one (`counting.md` § *Confidence*), a design question the scope's plan or decision record already answers, and anything the brief lists as *Settled*.
- **Unverified, no decision.** The run that writes a line never verifies or decides it. The record keeps the list, and the receiving skill takes it in from the record: `team-review <refactor record>…` (`team-review` § *Intake*) and `team-refactor <review record>…` (`team-refactor` § *Intake*).

## Handoff

Each CEO gate ends a session. Write the record the next phase needs and delete the run folder (anything worth keeping is in the record by then). Then ask once: *"Commit <the files the next phase reads> now, as one docs commit?"* Worktree executors only see committed files, and a commit made after the handoff line costs turns at the session's largest context. Then tell the user:

*"`/clear`, then: <next command> `<path>`."*

The next phase starts from that file, not from a context that holds the whole debate.

## Execution

For a caller whose approved work is carried out by executor agents, in the fresh session the handoff opened. The caller keeps its step format, the brief its executors start from, and what a red batch does.

- **Start from the exec brief** (a plan, for team-council-plan) the handoff named. Don't read the record or an earlier run folder. Copy the caller's `templates.md`, and this skill's `SKILL.md` as `team-protocol.md`, into a fresh run folder first (§ *Dispatch*), before you or any agent reads a section of either: you read the copies too.
- **Batches.** Group the approved steps into batches: consecutive steps, in the brief's order, that touch overlapping files, at most 4 per batch. When the caller sizes its steps, only S steps share a batch; an M or L step is a batch of one.
- **A fresh executor per batch**, given its batch and the header its caller names, never the record. It commits each step on its own.
- **Diff guard.** Before each commit, the executor runs its exec brief's *Diff guard* (§ *Code scope*) on the staged change. A suppression comment added, a staged file the card's *Fence* rules out or one its card does not name, or the format check failing on a file not listed *Unformatted* → unstage, then revert the step or fix the hit, and reply `stopped — <the hit>`. Never work around it: the guard exists because a fence's words alone get ignored.
- **Known flakes.** A red that passes on an isolated rerun counts as green only when the exec brief's header lists that test as a known flake. Any other red follows the caller's rule for a red step.
- **Parallel runs.** Two exec briefs whose fences share no file may execute at once, each in its own worktree branched from the same commit (`superpowers:using-git-worktrees`, or `git -C <repo> worktree add`). When both are done, rebase each onto the target branch in the order their records were approved, rerun the header's gates after each rebase, then autosquash. A rebase conflict stops the later run: report it, don't resolve it.
- **A final reviewer on opus** reads the whole diff against the brief after the last batch, and tags each finding `fix` or `note`.
- **Fixes as `fixup!` commits.** Every `fix` finding goes to a fresh executor with the reviewer's report and the step it names. It commits the fix as a `fixup!` of that step's commit, so `git rebase --autosquash` folds it in before the push. A fixup that touches only formatting, comments or test names gets no re-check; its *Execution* line says so. Any other fixup gets a fresh opus re-check of that fixup's diff alone, against its finding.
- **Never patch code yourself.** Don't fix or dismiss a finding, and don't edit a file between batches: your context is the most expensive one in the run.

## Weakened checks

A change weakens a check when it brings any of these:
- a lowered threshold;
- a skipped or deleted test;
- a removed assertion;
- an existing test's expected value changed without the finding or step saying so;
- a new `@ts-ignore`, `eslint-disable` or coverage-ignore comment;
- a stub or an empty `catch` where the work should be.

A caller writes "no check weakened (`team-protocol` § *Weakened checks*)" and adds its own items. A final reviewer fails a diff that holds one.

## Sweep

When the human asks to review and refactor a whole branch or several zones at once (a phase end, a release), or picks the *all of them* option when a scope is narrowed:

1. **Review each zone** with team-review. Two zones may go through to their gates together, one run folder and one record each.
2. **Execute each zone's review fixes** before that zone is refactored. A refactor's Step 0 pins behavior as it is; it should pin the fixed one.
3. **Refactor only where a review asks:** `team-refactor <review record>` for each review record whose *For team-refactor* list is not empty. A zone with none is not refactored; say so in one line.
4. **One intake review**, once the refactors are executed, of every refactor record's *For team-review* list: `team-review <refactor record>…`.

Each step is its own run, with its own gate and handoff (§ *Handoff*); the records carry the sweep from one run to the next. Exec briefs whose fences share no file may execute in parallel (§ *Execution*). At the end of each step, the last message names the sweep's next command (e.g. `team-refactor <review record>`, or "zone X has no For team-refactor lines: next zone").

## Auto-accept

The human may invoke a run with `auto-accept` (e.g. `/team-refactor src/invoice.js auto-accept`). Every gate of that run then skips the page: `team-ceo-view` takes each recommendation and asks in chat only about what has none, what has an unmet `needs`, and what corrects a premise. It lasts that run only, and only the invocation turns it on: "just decide" mid-run, a profile line or a previous run's choice does not. Everything else stays: the question pause, the record, the handoff.

**No gate writer when the synthesis carries the options.** When a caller's synthesis gives every gate item its options with a default or recommended one (the caller's `templates.md` § *Synthesis* says so), an auto-accept run builds no gate JSON and no page. Read the synthesis and ask, in one chat message, about each item with neither a default nor a recommended option, each item tagged `corrects <premise>`, and each item whose `needs` lists an item that will not be taken. Then dispatch the record writer with the synthesis and the answers: it takes the human's answer where one was given, else the item's default, else its recommended option, as **Accept recommended** would for the rest. Any other caller's gate goes through `team-ceo-view` as above.

## Rationalizations

| Excuse | Reality |
|--------|---------|
| "I'll play the roles myself, it's faster" | One context gives one opinion wearing several costumes, and no tension. Dispatch them. |
| "Four roles back it, that's a clear majority" | Count only positions with checkable evidence. Four uncited agents on one model are one prior counted four times. |
| "I'll skim the transcripts to check the synthesis is fair" | Every file you read is re-read on every later turn. The synthesizer read them; you read its file. |
| "It's close, I'll pick a side and call it a decision" | No majority makes it a tension. The synthesizer suggests a side; the CEO takes it. |
| "We're on a roll, I'll keep going in this session" | The next phase would pay for this whole context on every turn. Write the record, then `/clear`. |
| "The user won't mind the brief going to codex" | Sending their code to another vendor needs their yes, from the profile or from them. |
| "It's a few edits, I'll patch the file myself" | Every edit lands in the most expensive context of the run. Send the fix lines to a fresh writer. |
| "I'll run them in the background and wait" | Each completion wakes you for a turn that re-reads everything. One foreground message returns them all at once. |
| "A new package is an implementation detail; the writer will shape it" | Its boundaries, dependencies and folders are expensive to undo, and an `approve` on one step line among forty is not a choice the human made (§ *Structural choices*). |
| "The fence says format only the changed lines; the executor will comply" | It didn't, seven times in one sweep. The *Diff guard* runs before every commit; words alone don't. |
| "The hand-off list is in the record; someone will pick it up" | Nobody reads it unless a run takes it in. Run the intake (§ *Lane hand-offs*), or the sweep's step for it. |
| "A writer should log the commits in the record" | You already hold the reply lines. One `cat >>` costs less than an agent that reloads everything to write ten lines. |
| "I'll just read the template from the skill folder, it's one file" | It sits outside the project: the Read stops the run on a permission prompt. Copy first, then read the run-folder copy. |

## Red Flags

- Writing a role's position, card or verdict yourself
- Writing or patching a gate JSON, record, exec brief or plan yourself (a `Status:` line and the *Execution* append aside)
- Fixing a reviewer's finding, or editing code between batches, yourself
- A turn spent only on "X is back, waiting for the others"
- An agent waiting on a permission prompt to read a skill file
- You reading a skill file from its base directory instead of the run-folder copy
- A counted position written before a CEO answer that contradicts it
- Every role agreeing on everything
- A count in `tags` that includes a position with no `file:line`, doc, output or measurement
- Opening a run-folder file other than the synthesis or a skill-file copy
- Starting the next phase in the session that ran the gate
- An external model CLI called without a yes on record
- A gate auto-accepted in a run the human did not invoke with `auto-accept`
- A template pointing an agent to a `team-protocol` section, with no `team-protocol.md` in its run folder
- A structural choice that reached the CEO only as a routine step, or not at all
- A commit made without its brief's *Diff guard* run
- A hand-off line with no scenario
- A card that restates a *Settled* line with no new evidence
- On an auto-accept run with no page, an item without a recommendation, a `corrects` item or an unmet `needs` that was never asked about
