---
name: team-council
description: 'Use at a decision point that deserves more than one perspective: choosing between approaches, reviewing an architecture, an "are we sure?" before implementing, or reviewing a finished feature from several angles. Also when the user asks for the council, a debate, or a PO, CTO or UX view on a choice.'
---

# team-council

A project-agnostic dispatcher that runs a structured, evidence-backed debate before the human (CEO/client) makes the final call. Complements brainstorming/planning/review — it does not replace them.

**REQUIRED BACKGROUND:** follow `team-protocol` for dispatch, the run folder, the agent contract, counting positions and the handoff.

## Preconditions

- **Project profile**: read `.council/project-profile.md`. If missing, run `team-scan` first (or offer to).
- **Decision framing**: every role gets the same framing, so a skewed one skews them all. Write your read of it:
  - the question, the options on the table, what is out of scope, and whether it is reversible;
  - **the facts every role will assume**: who the user is, their platform and locale (OS, language, keyboard layout), and what the work may add: fixes only, or new features too. Back each one with a file or the profile, or mark it *unchecked*;
  - the answer you expect from the user to each open sub-question;
  - your confidence in that read (a percentage).

  Every *unchecked* fact and every expected answer you can't fill is a question. Below ~70%, or with any such question left, ask the user one question at a time, each with your guess attached, until you could predict their next answers. Then restate the framing and get an explicit yes. "Sounds good" and "whatever you think" are not a yes: ask which line they would change, or offer two framings to pick from.
- **Earlier decisions**: look in `.council/decisions/`, and in the project's decision records the profile lists, for one on the same question. If there is one, every role gets it as context, and the new record supersedes it.

## Roles

Templates live in `roles/` next to this file. Each role is a lens with its own `## Sources`, like the panel in `team-refactor`.

| Role | Sources (a sample; all in the role file) | Signature question | Specialists (from the profile) |
|------|-------|--------------------|--------------------------------|
| **PO** (`role-po.md`) | Cagan, Torres, Perri, Adžić, Osterwalder & Pigneur | "Which outcome does this move, and what is the cheapest way to learn if it will?" | Process domain, project docs, git history |
| **CTO** (`role-cto.md`) | Brooks, Nygard, Kruchten & Ozkaya, Majors, Hamilton | "What is expensive to undo, and what will this cost to run and change?" | Technical domain, lint/typecheck/test commands |
| **UX** (`role-ux.md`) | Norman, Nielsen, Holmes, Suchman, Bertin | "Where does the user get stuck, and how do they know what happened?" | UX domain (e.g. `impeccable`) |
| **Philosopher** (`role-philosopher.md`) | Ibn al-Haytham, Popper, Bachelard, Longino, Gigerenzer | "What would prove this wrong, and has anyone looked?" | Read-only tools only |
| **Wildcard** (`role-wildcard.md`) | Munger, Klein, Altshuller, Meadows, Queneau | "If this failed a year from now, why, and which option would have avoided it?" | Any specialist, read-only |

**Ad-hoc specialists**: summon extras when the decision warrants (e.g. a Performance Analyst for perf-heavy calls), or when the user requests specific ones. Write each one 3–5 sources (see `team-protocol`).

**Evidence pass**: when the question rests on facts nobody has observed (what the app does today, which commands exist, what a measurement gives), one agent gathers them before Round 1 (agent id `evidence`). Its file goes to every role as a shared input, and its open questions join the question pause. It leaves the project tree as it found it (`team-protocol` agent contract).

**Scope control**: each role may invoke only its allowed specialists. Never let a role invoke a tool that modifies state during debate.

### Roster: who sits

PO, CTO and Philosopher always sit. Add:
- **UX** when the decision changes something a user sees or does: a screen, a flow, copy, an error, a public API's ergonomics.
- **Wildcard** when the question is open: the user hasn't named the options, or asks "how should we…". Skip it when the choice is between options already on the table.
- **Specialists** as above.

Tell the user the roster in one line before dispatching, with the reason for each role left out ("UX out: no user-facing change"). The user can add any role back. The page's *Decision* bullet names who sat.

**Off-model seat**: the Philosopher, whose job is to test what everyone else assumed. When the profile lists a model CLI, follow *Off-model seat* in `team-protocol` and add its offer to the roster line. The seat stays off-model in both rounds.

### Depth: how many rounds

- **One round** when the decision is reversible: undone by reverting one commit, with no public contract, data migration or money involved. Round 1, then the synthesis on sonnet. No Round 2, except for a seat a CEO answer contradicts: it alone sits again (sonnet, ~5) before the synthesis.
- **Two rounds** otherwise: the full flow below.

When unsure, it is two rounds.

## Flow

```
Evidence pass       → only when the question rests on unobserved facts
Round 1 (parallel)  → the roster: independent position + specialist evidence
Question pause      → orchestrator groups agents' flagged questions, attributed → CEO answers
Round 2 (parallel)  → two-round depth only: Philosopher (sees all R1) + conflicting pairs
                      + every seat a CEO answer contradicts
Synthesis           → PO synthesis agent → consensus / majority calls / tensions / recommendation
Gate page           → gate writer builds and renders it from the synthesis
CEO decides         → record to .council/decisions/YYYY-MM-DD-<topic>.md
```

### Round 1 — independent positions (parallel)
Dispatch the roster simultaneously. Each agent receives: its role template, the project profile, the decision context, and the roster of other members (but not their output). Agents invoke domain specialists as relevant. Agents may flag questions for the human.

### Question pause
Collect flagged questions, present them grouped and attributed by role. If none were flagged, proceed straight on.

Save the answers to `<run folder>/ceo-answers.md` in this shape, and feed that file into Round 2 (or the synthesis at one-round depth):

```markdown
## Q<n>: <the question, as asked>
Answer: <the user's words, verbatim>
Reading: <your interpretation, if any — a reading, not a fact>
Claims to check: <any fact about the code or the product the answer asserts>
```

An answer binds as the user's preference. A claim it makes about the code is something for Round 2 to check, not a fact.

### Round 2 — targeted debate (parallel)
Identify tensions from the Round 1 one-line positions:
- **Philosopher always participates** — sees all Round 1 output, applies Socratic analysis.
- **Conflicting pairs** see each other's positions and respond directly.
- **Every seat a CEO answer contradicts** sits again, with the answers file. So does a seat whose agreement you can't confirm from its one-line replies.
- **The other seats skip Round 2.**

Round 2 prompts repeat the role file's *Output Format*, sources line included. Questions Round 2 raises for the CEO go on the gate page as decisions or minor items, not into a second pause.

### Synthesis
A dedicated synthesis agent (separate call from the Round 1 PO) writes the *Council Summary* by `templates.md` § *Synthesis*.

### CEO gate
**REQUIRED SUB-SKILL:** `team-ceo-view`. The gate writer builds and renders the page by `templates.md` § *Gate page*; you serve it and read the decisions block. The Round 1 question pause stays in chat; those answers are free text.

### Decision recording
The record writer records the CEO's decisions by `templates.md` § *Decision record*, including supersession, corrections and the project's own decision records. `team-council-plan` reads this record next.

Then hand off (`team-protocol`): *"`/clear`, then: run team-council-plan on `<decision path>`."*

## Dispatch mechanics

| Agent | Model | Tool budget |
|-------|-------|-------------|
| Evidence pass | sonnet | ~15 |
| Round 1 roles, ad-hoc specialists | sonnet | ~12 |
| Round 2: Philosopher, conflicting pairs, contradicted seats | sonnet | ~5 |
| Synthesis, two-round depth | opus | ~10 |
| Synthesis, one-round depth | sonnet | ~10 |
| Gate writer (JSON, sketches, render) | sonnet | ~15 |
| Record writer | sonnet | ~8 |

- Keep each agent's context lean: profile + decision + role template + (Round 2) the specific counterpart positions. Writers get their `templates.md` section, and the gate writer also `team-ceo-view`'s `contract.md` and `figures.md`.
- Agent ids for the run folder: `evidence`, `r1-<role>`, `r2-<role>`, `synthesis`, `gate`, `record`.
- The council is standalone — it needs only a decision context and a profile; it requires no companion skill, and the roles use whatever specialists the profile lists.

## Rationalizations

The shared ones are in `team-protocol`. These are the council's own.

| Excuse | Reality |
|--------|---------|
| "The answer is obvious, one round will do" | Depth follows reversibility, not confidence. Unsure means two rounds. |
| "No screen changes, so UX sits out" | An API's ergonomics, an error message or a line of copy is something a user meets. UX sits. |
| "The user already knows what they want, the council is a formality" | Then the council's job is to find what would prove them wrong. That is the Philosopher's question. |
| "The framing is clear enough, I'll skip the restate" | Every role inherits the framing. A one-line restate and a yes cost less than a debate on the wrong question. |
| "Everyone uses QWERTY / English / a Mac" | That is an environment fact every role will build on. Check it or ask. |
| "Their answer settles it, I'll record it as fact" | The answer binds as a preference. What it says about the code goes to Round 2 to check. |
| "The user said 'just decide'" | Recommend clearly. *Accept recommended* is one click, and the record holds the CEO's call, not yours. |

## Red Flags

- Dispatching before the framing got an explicit yes
- A framing with an *unchecked* environment fact nobody asked about
- A seat whose Round 1 position a CEO answer contradicts, counted without sitting again
- A record whose `Status:` still says it awaits the CEO
- UX left out of a change that users or API callers will meet
- A recommendation that names no trade-off it accepts
- An earlier decision on the same question that no role was given
- A role editing files during the debate
- A decision recorded that the CEO didn't take
