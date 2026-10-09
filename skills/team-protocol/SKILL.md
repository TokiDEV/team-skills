---
name: team-protocol
description: Use when running any team-* skill (team-council, team-council-plan, team-kickoff, team-refactor) — dispatching its role agents, settling what they disagree on, or handing off at a CEO gate.
---

# team-protocol

The rules every team-* skill shares. Each caller owns its roles, rounds and gate mapping; this skill owns how agents are dispatched, how their positions are counted, and how a run hands off. When a caller and this skill disagree, the caller wins for its own flow.

## Dispatch

- **One agent per role, dispatched in parallel.** Never play the roles yourself in one context: one context gives one opinion wearing several costumes, and you'll get "everyone agrees" with no tension.
- **Pass the model and budget** from the caller's table to every dispatch.
- **Role overrides.** Templates live in the caller's `roles/`. A project may override any of them with `.council/role-overrides/role-<name>.md`; the project file wins. `<name>` is the role's current file name: an override under a renamed role's old name is ignored (the README lists the renames).
- **Roles are lenses.** A role is named after what it looks at, never after a person. This holds for built-in roles, ad-hoc specialists and project overrides.
- **Sources.** Every role file has a `## Sources` section: 5–8 entries, one line each, a source and the question or test it brings. The list is varied on purpose, in gender, country, discipline and epoch. A source earns its place by changing what the agent does.
- **Pick and declare.** The agent picks the 2–3 sources that best fit the case and is not bound to the others. It names the ones it used, where its caller's output format says.
- **Ad-hoc specialists.** When you summon one, write it 3–5 sources by the same rule.
- **Attribution.** Every finding is credited to the role that made it, including what a role got from a specialist skill.

## Off-model seat

The roles share one model, so their agreement can be a shared prior (see *Counting positions*). A seat run on another vendor's model brings a different one. The caller names the seat that can go off-model; this section says how.

- **Consent first.** The profile's *Other Models* lists the CLIs found. Run the seat off-model when its *Team Preferences* says `Off-model seat: yes`, or when the user says yes to the offer in your roster line: *"Philosopher on codex? It sends the brief to OpenAI."* With `no`, no CLI, or no user to ask (CI, a loop), stay on-model and say so in one line. Never call an external CLI without one of those yeses.
- **Same inputs as on-model.** Write the role template, its brief and the agent contract to `<run folder>/<agent id>.prompt.md`. Replace the contract's "Write your full output" line with: `Your reply is your output; end it with a "## Summary" section of one line per position.`
- **Read-only, through stdin.** Check the binary first (`<cli> --version`), then pipe the prompt file in and redirect the reply to the run folder. The prompt holds quotes, backticks and `$(...)`, so it never goes into a shell argument:
  ```bash
  codex exec --sandbox read-only -C <repo> - < <run folder>/<id>.prompt.md > <run folder>/<id>.md
  gemini --approval-mode plan -p "" < <run folder>/<id>.prompt.md > <run folder>/<id>.md
  ```
  Flags change between versions: on an error, check `--help`. If it still fails, say so and run the seat on-model.
- **Read only its Summary.** The orchestrator reads that section, not the whole reply.
- **Counted like any other position**, by the same evidence rule. Credit it with its model, e.g. `Philosopher (codex)`, so the CEO can see where on-model and off-model positions part.

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

## Rationalizations

| Excuse | Reality |
|--------|---------|
| "I'll play the roles myself, it's faster" | One context gives one opinion wearing several costumes, and no tension. Dispatch them. |
| "Four roles back it, that's a clear majority" | Count only positions with checkable evidence. Four uncited agents on one model are one prior counted four times. |
| "I'll skim the transcripts to check the synthesis is fair" | Every file you read is re-read on every later turn. The synthesizer read them; you read its file. |
| "It's close, I'll pick a side and call it a decision" | No majority makes it a tension. The synthesizer suggests a side; the CEO takes it. |
| "We're on a roll, I'll keep going in this session" | The next phase would pay for this whole context on every turn. Write the record, then `/clear`. |
| "The user won't mind the brief going to codex" | Sending their code to another vendor needs their yes, from the profile or from them. |

## Red Flags

- Writing a role's position, card or verdict yourself
- Every role agreeing on everything
- A count in `tags` that includes a position with no `file:line`, doc, output or measurement
- Opening a run-folder file other than the synthesis
- Starting the next phase in the session that ran the gate
- An external model CLI called without a yes on record
