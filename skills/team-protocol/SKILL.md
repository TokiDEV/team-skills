---
name: team-protocol
description: Use when running any team-* skill (team-council, team-council-plan, team-kickoff, team-refactor, team-review) — dispatching its role agents, settling what they disagree on, or handing off at a CEO gate.
---

# team-protocol

The rules every team-* skill shares. Each caller owns its roles, rounds and gate mapping; this skill owns how agents are dispatched, how their positions are counted, how a run hands off, and how approved work is executed and checked. When a caller and this skill disagree, the caller wins for its own flow.

## Dispatch

- **One agent per role, dispatched in parallel.** Never play the roles yourself in one context: one context gives one opinion wearing several costumes, and you'll get "everyone agrees" with no tension.
- **Separation of context.** Every agent gets the minimum it needs; none receives the conversation, the raw transcripts or another agent's output unless its caller says so. The caller's table says what each one receives.
- **A round is one message, in the foreground.** Send every agent of a round in a single message with `run_in_background: false`. The next step needs all the replies, and each background completion costs an orchestrator turn that re-reads its whole context.
- **Pass the model and budget** from the caller's table to every dispatch.
- **Skill files go into the run folder first.** The skill's base directory (`~/.claude/skills/…` or the plugin cache) is outside the project, so an agent's Read there waits on a permission prompt. Before the first dispatch, copy every skill file an agent will Read into the run folder with one Bash call: the caller's `templates.md`, the role files, this skill's `counting.md`, this skill's `SKILL.md` as `team-protocol.md` when the caller's `templates.md` points to a `team-protocol` section, and `team-ceo-view`'s `contract.md` and `figures.md` for any agent that builds a page or draws a sketch. E.g. `cp <base directory>/{templates.md,roles/role-*.md} <base directory>/../team-protocol/counting.md <base directory>/../team-ceo-view/{contract.md,figures.md} <run folder>/ && cp <base directory>/../team-protocol/SKILL.md <run folder>/team-protocol.md`. Adapt the paths to the caller: team-council-plan has no `roles/` and copies its role files from `<base directory>/../team-council/roles/`; team-kickoff has no `templates.md` and no `roles/` (its council run copies team-council's). Then point each agent to its copy; a template's pointer to a `team-protocol` section means that section of `team-protocol.md`. A script run through Bash (`render.js`) needs no copy, and a project override (`.council/role-overrides/`) is already inside the project.
- **Role overrides.** Templates live in the caller's `roles/`. A project may override any of them with `.council/role-overrides/role-<name>.md`; the project file wins. `<name>` is the role's file name.
- **Roles are lenses.** A role is named after what it looks at, never after a person. This holds for built-in roles, ad-hoc specialists and project overrides.
- **Sources.** Every role file has a `## Sources` section: 5–8 entries, one line each, a source and the question or test it brings. The list is varied on purpose, in gender, country, discipline and epoch. A source earns its place by changing what the agent does.
- **Pick and declare.** The agent picks the 2–3 sources that best fit the case and is not bound to the others. It names the ones it used, where its caller's output format says.
- **Ad-hoc specialists.** When you summon one, write it 3–5 sources by the same rule.
- **Attribution.** Every finding is credited to the role that made it, including what a role got from a specialist skill.

## Writers

Writers keep the orchestrator short. Gate JSON, decision and refactor records, exec briefs and plans are written by agents (from the synthesis file, the decisions block or a reviewer's lines). The orchestrator writes prompts and small run-folder notes, flips a `Status:` line, serves the page, and passes the decisions block on. Each caller's table gives these writers a model and a budget.

- **The synthesis** stays under ~300 lines and holds everything the gate page and the record need, since it is the only run-folder file the gate writer and the record writer read.
- **The exec brief** is for the executors and nothing else: a header (scope, the quality-gate commands copied verbatim, fences for the whole run), then the approved cards in order. No debate, no arguments, no declined or rejected items. Aim under ~150 lines.
- **After execution**, the record writer completes the record from the executors' and the final reviewer's reply lines: the commits (hash and item, one line each), the reverted or blocked items with their reason, and the reviewer's `note` findings where its caller says. Then it sets `Status: executed`.

## Off-model seat

The caller names the seat that can go off-model. Before the roster line that seats it, read `off-model.md` in this skill's base directory: why, when to offer it, and how to run it.

## Run folder

`.council/runs/YYYY-MM-DD-<topic>/`. Every agent writes its full output there, except a writer whose output is a project file (*Agent contract*). Later agents (Round 2, gate, synthesizer) read the files they need from it. The orchestrator reads only the synthesis file, or, in a flow with none, the reply lines its caller names.

## Agent contract

Append this block to every dispatch prompt, with the budget, run folder and agent id filled in. Every turn re-reads the whole context, so context size × turns is the bill, and the orchestrator is the longest-lived context of all.

```markdown
## How to work
- Budget: about <N> tool calls. Put several searches in one Bash call; Read a file once, whole.
- Tool rules: <the user's standing tool rules from CLAUDE.md, e.g. "absolute paths, never `cd`">
- Write your full output to <run folder>/<agent id>.md.
- Reply with: the file path, one line per position, card, verdict or defect (id + title), and any questions for the CEO. Nothing else.
```

Drop the *Tool rules* line when the user has none. A caller may add lines above the budget (team-refactor adds "Start from the Code Brief").

**A writer whose output is a project file** (a plan, a record, an exec brief, a gate JSON) writes it there: its project path replaces the run-folder line, as `- Write your full output to <project path>.` An off-model seat replaces that line too (`off-model.md`).

An agent whose job is not to change the project (a role, a reviewer, an evidence pass) also gets this line: `- Leave the project tree as you found it. Scratch files (a probe test, a script) go in <run folder>; if a tool only runs them from inside the tree, delete them before you reply and say so.`

## Counting positions

Every question the roles disagree on is settled by `counting.md` in this skill's base directory: only positions with checkable evidence count; a majority makes a **decision**, no majority a **tension**, never both; the count goes in `tags` (`3–1`). The synthesizer and the writers apply it from their copy.

**Confidence.** `counting.md` § *Confidence* is the only definition of `high`, `med` and `low`; panelists apply it from their copy. A caller says only where a `low` finding goes.

## Code scope

For a caller that reads existing code (team-refactor, team-review). The caller names its brief, which lines it counts, how Recon ranks a whole repo, and the seats that always run whatever the size.

- **Size.** Under ~150 lines, write the brief yourself by the caller's template instead of dispatching Recon. Above ~3,000 lines, or more than one package, narrow the scope before dispatching the panel.
- **Narrowing.** For the whole repo, or a scope over that cap, dispatch Recon first to rank zones by the caller's criteria. Then ask the user to pick, with the ranking in the question: each option carries its size and its main risk, and one is marked *(Recommended)*.
- **Recon writes its brief to a file.** Use a general-purpose agent, or a code-exploration agent from the profile's Technical domain that has Write. The built-in `Explore` has no Write; if you use it, save its reply to the run folder yourself.
- **The brief** stays under ~60 lines, plus the excerpts, at most ~200 lines in all. Its quality-gate commands go in **verbatim as Recon ran them**, each with its result. No placeholders: a command nobody ran is not a gate.

## Handoff

Each CEO gate ends a session. Write the record the next phase needs and delete the run folder (anything worth keeping is in the record by then). Then ask once: *"Commit <the files the next phase reads> now, as one docs commit?"* Worktree executors only see committed files, and a commit made after the handoff line costs turns at the session's largest context. Then tell the user:

*"`/clear`, then: <next command> `<path>`."*

The next phase starts from that file, not from a context that holds the whole debate.

## Execution

For a caller whose approved work is carried out by executor agents, in the fresh session the handoff opened. The caller keeps its step format, the brief its executors start from, and what a red batch does.

- **Start from the brief** the handoff named. Don't read the record or an earlier run folder. When the executors or the final reviewer read a `templates.md` section, copy the caller's `templates.md`, and this skill's `SKILL.md` as `team-protocol.md`, into a fresh run folder first (§ *Dispatch*).
- **Batches.** Group the approved steps into batches: consecutive steps, in the brief's order, that touch overlapping files, at most 4 per batch. When the caller sizes its steps, only S steps share a batch; an M or L step is a batch of one.
- **A fresh executor per batch**, given its batch and the header its caller names, never the record. It commits each step on its own.
- **A final reviewer on opus** reads the whole diff against the brief after the last batch, and tags each finding `fix` or `note`.
- **Fixes as `fixup!` commits.** Every `fix` finding goes to a fresh executor with the reviewer's report and the step it names. It commits the fix as a `fixup!` of that step's commit, so `git rebase --autosquash` folds it in before the push. The reviewer re-checks only a fix that changed logic.
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

## Auto-accept

The human may invoke a run with `auto-accept` (e.g. `/team-refactor src/invoice.js auto-accept`). Every gate of that run then skips the page: `team-ceo-view` takes each recommendation and asks in chat only about what has none, what relies on a declined item, and what corrects a premise. It lasts that run only, and only the invocation turns it on: "just decide" mid-run, a profile line or a previous run's choice does not. Everything else stays: the question pause, the record, the handoff.

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

## Red Flags

- Writing a role's position, card or verdict yourself
- Writing or patching a gate JSON, record, exec brief or plan yourself (a `Status:` line aside)
- Fixing a reviewer's finding, or editing code between batches, yourself
- A turn spent only on "X is back, waiting for the others"
- An agent waiting on a permission prompt to read a skill file
- A counted position written before a CEO answer that contradicts it
- Every role agreeing on everything
- A count in `tags` that includes a position with no `file:line`, doc, output or measurement
- Opening a run-folder file other than the synthesis
- Starting the next phase in the session that ran the gate
- An external model CLI called without a yes on record
- A gate auto-accepted in a run the human did not invoke with `auto-accept`
- A template pointing an agent to a `team-protocol` section, with no `team-protocol.md` in its run folder
