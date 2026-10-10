---
name: team-protocol
description: Use when running any team-* skill (team-council, team-council-plan, team-kickoff, team-refactor) — dispatching its role agents, settling what they disagree on, or handing off at a CEO gate.
---

# team-protocol

The rules every team-* skill shares. Each caller owns its roles, rounds and gate mapping; this skill owns how agents are dispatched, how their positions are counted, and how a run hands off. When a caller and this skill disagree, the caller wins for its own flow.

## Dispatch

- **One agent per role, dispatched in parallel.** Never play the roles yourself in one context: one context gives one opinion wearing several costumes, and you'll get "everyone agrees" with no tension.
- **A round is one message, in the foreground.** Send every agent of a round in a single message with `run_in_background: false`. The next step needs all the replies, and each background completion costs an orchestrator turn that re-reads its whole context.
- **Pass the model and budget** from the caller's table to every dispatch.
- **Skill files go into the run folder first.** The skill's base directory (`~/.claude/skills/…` or the plugin cache) is outside the project, so an agent's Read there waits on a permission prompt. Before the first dispatch, copy every skill file an agent will Read into the run folder with one Bash call: the caller's `templates.md`, the role files (the caller's `roles/`, or `team-council/roles/` for plan reviewers), this skill's `counting.md`, and `team-ceo-view`'s `contract.md` and `figures.md` for any agent that builds a page or draws a sketch. E.g. `cp <base directory>/{templates.md,roles/role-*.md} <base directory>/../team-protocol/counting.md <base directory>/../team-ceo-view/{contract.md,figures.md} <run folder>/`. Then point each agent to its copy. A script run through Bash (`render.js`) needs no copy, and a project override (`.council/role-overrides/`) is already inside the project.
- **Writers keep the orchestrator short.** Gate JSON, decision and refactor records, exec briefs and plans are written by agents (from the synthesis file, the decisions block or a reviewer's lines). The orchestrator writes prompts and small run-folder notes, serves the page, and passes the decisions block on. Each caller's table gives these writers a model and a budget.
- **Role overrides.** Templates live in the caller's `roles/`. A project may override any of them with `.council/role-overrides/role-<name>.md`; the project file wins. `<name>` is the role's current file name: an override under a renamed role's old name is ignored (the README lists the renames).
- **Roles are lenses.** A role is named after what it looks at, never after a person. This holds for built-in roles, ad-hoc specialists and project overrides.
- **Sources.** Every role file has a `## Sources` section: 5–8 entries, one line each, a source and the question or test it brings. The list is varied on purpose, in gender, country, discipline and epoch. A source earns its place by changing what the agent does.
- **Pick and declare.** The agent picks the 2–3 sources that best fit the case and is not bound to the others. It names the ones it used, where its caller's output format says.
- **Ad-hoc specialists.** When you summon one, write it 3–5 sources by the same rule.
- **Attribution.** Every finding is credited to the role that made it, including what a role got from a specialist skill.

## Off-model seat

The roles share one model, so their agreement can be a shared prior. A seat run on another vendor's model brings a different one. The caller names the seat that can go off-model. When the profile's *Other Models* lists a CLI, read `off-model.md` in this skill's base directory before offering it; otherwise say in one line that the seat stays on-model. A profile with no *Other Models* section predates it: offer `team-scan` first.

## Run folder

`.council/runs/YYYY-MM-DD-<topic>/`. Every agent writes its full output there. Later agents (Round 2, gate, synthesizer) read the files they need from it. The orchestrator reads only the synthesis file, plus the one-line replies.

## Agent contract

Append this block to every dispatch prompt, with the budget, run folder and agent id filled in. Every turn re-reads the whole context, so context size × turns is the bill, and the orchestrator is the longest-lived context of all.

```markdown
## How to work
- Budget: about <N> tool calls. Put several searches in one Bash call; Read a file once, whole.
- Tool rules: <the user's standing tool rules from CLAUDE.md, e.g. "absolute paths, never `cd`">
- Write your full output to <run folder>/<agent id>.md.
- Reply with: the file path, one line per position, card or verdict (id + title), and any questions for the CEO. Nothing else.
```

Drop the *Tool rules* line when the user has none. A caller may add lines above the budget (team-refactor adds "Start from the Code Brief").

An agent whose job is not to change the project (a role, a reviewer, an evidence pass) also gets this line: `- Leave the project tree as you found it. Scratch files (a probe test, a script) go in <run folder>; if a tool only runs them from inside the tree, delete them before you reply and say so.`

## Counting positions

Every question the roles disagree on is settled by `counting.md` in this skill's base directory: only positions with checkable evidence count; a majority makes a **decision**, no majority a **tension**, never both; the count goes in `tags` (`3–1`). The synthesizer and the writers apply it from their copy.

## Handoff

Each CEO gate ends a session. Write the record the next phase needs and delete the run folder (anything worth keeping is in the record by then). Then ask once: *"Commit <the files the next phase reads> now, as one docs commit?"* Worktree executors only see committed files, and a commit made after the handoff line costs turns at the session's largest context. Then tell the user:

*"`/clear`, then: <next command> `<path>`."*

The next phase starts from that file, not from a context that holds the whole debate.

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
- Writing or patching a gate JSON, record, exec brief or plan yourself
- A turn spent only on "X is back, waiting for the others"
- An agent waiting on a permission prompt to read a skill file
- A counted position written before a CEO answer that contradicts it
- Every role agreeing on everything
- A count in `tags` that includes a position with no `file:line`, doc, output or measurement
- Opening a run-folder file other than the synthesis
- Starting the next phase in the session that ran the gate
- An external model CLI called without a yes on record
