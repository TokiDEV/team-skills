---
name: team-protocol
description: Use when running any team-* skill (team-council, team-council-plan, team-kickoff, team-refactor) — dispatching its role agents, settling what they disagree on, or handing off at a CEO gate.
---

# team-protocol

The rules every team-* skill shares. Each caller owns its roles, rounds and gate mapping; this skill owns how agents are dispatched, how their positions are counted, and how a run hands off. When a caller and this skill disagree, the caller wins for its own flow.

## Dispatch

- **One agent per role, dispatched in parallel.** Never play the roles yourself in one context: one context gives one opinion wearing several costumes, and you'll get "everyone agrees" with no tension.
- **Pass the model and budget** from the caller's table to every dispatch.
- **Role overrides.** Templates live in the caller's `roles/`. A project may override any of them with `.council/role-overrides/role-<name>.md`; the project file wins.
- **Attribution.** Every finding is credited to the role that made it, including what a role got from a specialist skill.

## Run folder

`.council/runs/YYYY-MM-DD-<topic>/`. Every agent writes its full output there. Later agents (Round 2, gate, synthesizer) read the files they need from it. The orchestrator reads only the synthesis file, plus the one-line replies.

## Agent contract

Append this block to every dispatch prompt, with the budget, run folder and agent id filled in. Every turn re-reads the whole context, so context size × turns is the bill, and the orchestrator is the longest-lived context of all.

```markdown
## How to work
- Budget: about <N> tool calls. Put several searches in one Bash call; Read a file once, whole.
- Write your full output to <run folder>/<agent id>.md.
- Reply with: the file path, one line per position, card or verdict (id + title), and any questions for the CEO. Nothing else.
```

A caller may add lines above the budget (team-refactor adds "Start from the Code Brief").

## Counting positions

Every question the roles disagree on is settled by their positions after the last round:

1. **A position counts only if it carries checkable evidence**: a `file:line`, a doc, a command's output, a measurement, or a quoted claim from another role that it refutes. The roles share one model and one brief, so a head count alone measures a shared prior, not independent evidence. An uncounted position is still shown, credited, on its card.
2. **Majority**: more than half of the counted positions back one option. The question becomes a **decision**: the majority's option is recommended, the minority's option stays among the options, and its strongest case goes in `against`.
3. **No majority** (1–1, 2–2, 1–1–1, 2–1–1, or nothing counted): the question becomes a **tension**, one side per position, with the synthesizer's suggested side recommended.
4. A question is a decision or a tension, never both. If a tension's outcome would answer a decision, merge the decision into the tension.
5. Put the count in the item's `tags`, counted positions only: `3–1`, or `2–1 (+1 unbacked)`.

## Handoff

Each CEO gate ends a session. Write the record the next phase needs, delete the run folder (anything worth keeping is in the record by then), and tell the user:

*"`/clear`, then: <next command> `<path>`."*

The next phase starts from that file, not from a context that holds the whole debate.
