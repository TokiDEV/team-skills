---
name: team-council
description: 'Dispatch a multi-perspective agent team (PO, CTO, UX, Philosopher, Wildcard + ad-hoc specialists) to debate a decision, then synthesize consensus, majority calls, tensions, and a recommendation for the human to decide — and record the decision. Use at decision points: choosing an approach, reviewing an architecture, a pre-implementation "are we sure?", or a multi-perspective review of a completed feature.'
---

# team-council

A project-agnostic dispatcher that runs a structured, evidence-backed debate before the human (CEO/client) makes the final call. Complements brainstorming/planning/review — it does not replace them.

**REQUIRED BACKGROUND:** follow `team-protocol` for dispatch, the run folder, the agent contract, counting positions and the handoff.

## Preconditions

- **Project profile**: read `.council/project-profile.md`. If missing, run `team-scan` first (or offer to).
- **Decision context**: a clear statement of what is being decided. If the user hasn't framed it, ask one or two questions to sharpen it before dispatching.

## Roles

Templates live in `roles/` next to this file. Each role is a lens on a body of work, like the panel in `team-refactor`.

| Role | Canon | Signature question | Specialists (from the profile) |
|------|-------|--------------------|--------------------------------|
| **PO** (`role-po.md`) | Cagan, *Inspired*; Torres, *Continuous Discovery Habits* | "Which outcome does this move, and what is the cheapest way to learn if it will?" | Process domain, project docs, git history |
| **CTO** (`role-cto.md`) | Brooks, *No Silver Bullet*; Nygard, *Release It!*; one-way vs two-way doors | "What is expensive to undo, and what will this cost to run and change?" | Technical domain, lint/typecheck/test commands |
| **UX** (`role-ux.md`) | Norman, *The Design of Everyday Things*; Nielsen's heuristics; Krug | "Where does the user get stuck, and how do they know what happened?" | UX domain (e.g. `impeccable`) |
| **Philosopher** (`role-philosopher.md`) | Rodin's method; Popper; Kahneman | "What would prove this wrong, and has anyone looked?" | Read-only tools only |
| **Wildcard** (`role-wildcard.md`) | Munger's inversion; Klein's pre-mortem | "If this failed a year from now, why, and which option would have avoided it?" | Any specialist, read-only |

**Ad-hoc specialists**: summon extras when the decision warrants (e.g. a Performance Analyst for perf-heavy calls), or when the user requests specific ones.

**Scope control**: each role may invoke only its allowed specialists. Never let a role invoke a tool that modifies state during debate.

### Roster: who sits

PO, CTO and Philosopher always sit. Add:
- **UX** when the decision changes something a user sees or does: a screen, a flow, copy, an error, a public API's ergonomics.
- **Wildcard** when the question is open: the user hasn't named the options, or asks "how should we…". Skip it when the choice is between options already on the table.
- **Specialists** as above.

Tell the user the roster in one line before dispatching, with the reason for each role left out ("UX out: no user-facing change"). The user can add any role back. The page's *Decision* bullet names who sat.

### Depth: how many rounds

- **One round** when the decision is reversible: undone by reverting one commit, with no public contract, data migration or money involved. Round 1, then the synthesis on sonnet. No Round 2.
- **Two rounds** otherwise: the full flow below.

When unsure, it is two rounds.

## Flow

```
Round 1 (parallel)  → the roster: independent position + specialist evidence
Question pause      → PO curates agents' flagged questions, attributed → CEO answers
Round 2 (parallel)  → two-round depth only: Philosopher (sees all R1) + conflicting pairs
Synthesis           → PO synthesis agent → consensus / majority calls / tensions / recommendation
CEO decides         → record to .council/decisions/YYYY-MM-DD-<topic>.md
```

### Round 1 — independent positions (parallel)
Dispatch the roster simultaneously. Each agent receives: its role template, the project profile, the decision context, and the roster of other members (but not their output). Agents invoke domain specialists as relevant. Agents may flag questions for the human.

### Question pause
Collect flagged questions, present them grouped and attributed by role. If none were flagged, proceed straight on. Feed answers into Round 2 (or the synthesis at one-round depth).

### Round 2 — targeted debate (parallel)
Identify tensions from the Round 1 one-line positions:
- **Philosopher always participates** — sees all Round 1 output, applies Socratic analysis.
- **Conflicting pairs** see each other's positions and respond directly.
- **Agents in agreement skip Round 2.**

### Synthesis
A dedicated synthesis agent (separate call from the Round 1 PO) reads everything and produces the summary below. Each open question goes in exactly one section, settled by *Counting positions* in `team-protocol`.

```markdown
## Council Summary

### Decision: [what was being decided; who sat, and at which depth]

### Consensus Points
[Where every role that spoke agrees]

### Majority Calls
[One per question with a majority: the question, the majority's option and
who backs it, then the minority's option, who holds it and its strongest case]

### Key Tensions
[Only questions with no majority: each side's strongest version and who
holds it, then the PO's suggested side and why]

### PO Recommendation
[The overall direction and the trade-offs it accepts. Refer to Majority
Calls and Key Tensions by id; don't restate them]

### Dissenting Views Worth Noting
[Concerns not tied to a question above, and positions left uncounted for
lack of evidence. A minority on a Majority Call belongs in that call]
```

### CEO gate
**REQUIRED SUB-SKILL:** use `team-ceo-view` to present the synthesis as a local HTML decision page (`kind: "council"`). Map it like this:
- `summary` (labelled bullets): *Decision* (what is being decided, and who sat), *Consensus*, *Recommendation* (the PO's pick and the trade-offs it accepts).
- `outcome` (when the PO's pick changes a screen or the system's shape): the synthesizer sketches where the pick lands, `ui` and/or `system`, today beside the target, into `.council/gates/YYYY-MM-DD-<topic>/`. When another option would land somewhere visibly different, add its `after` sketch to `D1`'s `figures`, captioned with the option's label, so the human compares destinations.
- **`D1`**: the decision itself. Its `options` are the approaches on the table, with `recommended` on the PO's pick. Its `title` is the question, and its `detail` the facts every option shares (≤ 3 bullets); the consensus points go there too when they fit. Put the roles' strongest arguments in `for` (for the pick) and `against` (dissent, risks), each credited to its role.
- **More decisions**: one per Majority Call. The majority's option is `recommended`, and the minority's option stays in `options` with its case in `against`.
- `tensions`: one per Key Tension, each side attributed by role, with the PO's suggested side `recommended`. A Key Tension has no decision card. If D1 itself has no majority, it becomes `T1` and the page has no `D1`.
- Dissenting views worth noting go in the `against` of the decision they weigh on, or become a minor item if they concern none.
- **Figure** (only when there are 3+ options or the council split): a position map, roles × options, showing who backs what, in `D1`'s `figures`.
- `rejected`: approaches the council dropped, with the reason, so the CEO can revive one.

The Round 1 question pause stays in chat; those answers are free text.

### Decision recording
Write the CEO's decisions (notes included) under the synthesis in `.council/decisions/YYYY-MM-DD-<topic>.md` (create `.council/decisions/` if absent). This decision is later consumed by `team-council-plan`. Then hand off (`team-protocol`): *"`/clear`, then: run team-council-plan on `<decision path>`."*

## Dispatch mechanics

| Agent | Model | Tool budget |
|-------|-------|-------------|
| Round 1 roles, ad-hoc specialists | sonnet | ~12 |
| Round 2: Philosopher, conflicting pairs | sonnet | ~5 |
| Synthesis, two-round depth | opus | ~10 |
| Synthesis, one-round depth | sonnet | ~10 |

- Keep each agent's context lean: profile + decision + role template + (Round 2) the specific counterpart positions.
- Agent ids for the run folder: `r1-<role>`, `r2-<role>`, `synthesis`.
- The council is standalone — it needs only a decision context and a profile; it does not require superpowers or GSD to be installed.
