---
name: team-council
description: 'Dispatch a multi-perspective agent team (PO, CTO, UX, Philosopher, Wildcard + ad-hoc specialists) to debate a decision in two rounds, then synthesize consensus, majority calls, tensions, and a recommendation for the human to decide — and record the decision. Use at decision points: choosing an approach, reviewing an architecture, a pre-implementation "are we sure?", or a multi-perspective review of a completed feature.'
---

# team-council

A project-agnostic dispatcher that runs a structured, evidence-backed debate before the human (CEO/client) makes the final call. Complements brainstorming/planning/review — it does not replace them.

## Preconditions

- **Project profile**: read `.council/project-profile.md`. If missing, run `team-scan` first (or offer to).
- **Decision context**: a clear statement of what is being decided. If the user hasn't framed it, ask one or two questions to sharpen it before dispatching.

## Roles

The core 5 are always dispatched. Templates live in `roles/` next to this file; a project may override any role via `.council/role-overrides/role-<name>.md` (project override wins).

| Role | Lens | Specialist access |
|------|------|-------------------|
| **PO** (`role-po.md`) | User value, scope, priorities, feasibility | Process skills, project docs, git history |
| **CTO** (`role-cto.md`) | Architecture, maintainability, tech debt, standards | Technical skills (TDD, debugging, lint, typecheck) |
| **UX** (`role-ux.md`) | Experience, accessibility, interaction, aesthetics | `impeccable` skill (`init`, `critique`, `audit`, `craft`) |
| **Philosopher** (`role-philosopher.md`) | Assumptions, first principles, coherence, hidden bias | Read-only tools only |
| **Wildcard** (`role-wildcard.md`) | What-if, disruption, ambition, alternatives | Any specialist, read-only |

**Ad-hoc specialists**: summon extras when the decision warrants (e.g. a Performance Analyst for perf-heavy calls), or when the user requests specific ones.

**Scope control**: each role may invoke only its allowed specialists, and only Philosopher/Wildcard are constrained to read-only. Never let a role invoke a tool that modifies state during debate.

## Flow (two-round debate)

```
Round 1 (parallel)  → all 5 agents: independent position + specialist evidence
Question pause      → PO curates agents' flagged questions, attributed → CEO answers
Round 2 (parallel)  → Philosopher (sees all R1) + conflicting pairs (see each other); agreeing agents skip
Round 3             → PO synthesis agent → consensus / majority calls / tensions / recommendation
CEO decides         → record to .council/decisions/YYYY-MM-DD-<topic>.md
```

### Round 1 — independent positions (parallel)
Dispatch all 5 simultaneously. Each agent receives: its role template, the project profile, the decision context, and the roster of other members (but not their output). Agents invoke domain specialists as relevant; **all evidence must be attributed** in output. Agents may flag questions for the human.

### Question pause
Collect flagged questions, present them grouped and attributed by role. If none were flagged, proceed straight to Round 2. Feed answers into Round 2.

### Round 2 — targeted debate (parallel)
Identify tensions from Round 1:
- **Philosopher always participates** — sees all Round 1 output, applies Socratic analysis.
- **Conflicting pairs** see each other's positions and respond directly.
- **Agents in agreement skip Round 2.**

### Round 3 — PO synthesis
A dedicated synthesis agent (separate call from the Round 1 PO) reads everything and produces the summary below. Each open question goes in exactly one section, chosen by its vote after Round 2. Only roles that took a side count. A majority means more than half of them back one option.

```markdown
## Council Summary

### Decision: [what was being decided]

### Consensus Points
[Where every role that spoke agrees]

### Majority Calls
[One per question with a majority: the question, the majority's option and
who backs it, then the minority's option, who holds it and its strongest case]

### Key Tensions
[Only questions with no majority (1–1, 1–1–1, 2–2, 2–1–1): each side's
strongest version and who holds it, then the PO's suggested side and why]

### PO Recommendation
[The overall direction and the trade-offs it accepts. Refer to Majority
Calls and Key Tensions by id; don't restate them]

### Dissenting Views Worth Noting
[Concerns not tied to a question above. A minority on a Majority Call
belongs in that call, not here]
```

### CEO gate
**REQUIRED SUB-SKILL:** use `team-ceo-view` to present the synthesis as a local HTML decision page (`kind: "council"`). Map it like this:
- `summary` (labelled bullets): *Decision* (what is being decided), *Consensus*, *Recommendation* (the PO's pick and the trade-offs it accepts).
- **`D1`**: the decision itself. Its `options` are the approaches on the table, with `recommended` on the PO's pick. Put the consensus points in its `detail`, and the roles' strongest arguments in `for` (for the pick) and `against` (dissent, risks), each credited to its role.
- **More decisions**: one per Majority Call. The majority's option is `recommended`, and the minority's option stays in `options` with its case in `against`.
- `tensions`: one per Key Tension, each side attributed by role, with the PO's suggested side `recommended`. A Key Tension has no decision card. If D1 itself has no majority, it becomes `T1` and the page has no `D1`.
- Dissenting views worth noting go in the `against` of the decision they weigh on, or become a minor item if they concern none.
- **Figure** (only when there are 3+ options or the council split): a position map, roles × options, showing who backs what, in `D1`'s `figures`.
- `rejected`: approaches the council dropped, with the reason, so the CEO can revive one.

The Round 1 question pause stays in chat; those answers are free text.

### Decision recording
Write the CEO's pasted decisions (notes included) under the synthesis in `.council/decisions/YYYY-MM-DD-<topic>.md` (create `.council/decisions/` if absent). This decision is later consumed by `team-council-plan`.

## Dispatch mechanics
- Use parallel agent dispatch for each round (one agent per role). Keep each agent's context lean: profile + decision + role template + (round 2) the specific counterpart positions.
- **Models and budgets.** Pass the model to every dispatch:

  | Agent | Model | Tool budget |
  |-------|-------|-------------|
  | Round 1 roles, ad-hoc specialists | sonnet | ~12 |
  | Round 2: Philosopher, conflicting pairs | sonnet | ~5 |
  | Round 3: PO synthesis | opus | ~10 |

- **Agent contract.** Append this block to every dispatch prompt, with its budget and run folder filled in. Every turn re-reads the whole context, so context size × turns is the bill, and the orchestrator is the longest-lived context of all.

  ```markdown
  ## How to work
  - Budget: about <N> tool calls. Put several searches in one Bash call; Read a file once, whole.
  - Write your full output to <run folder>/<round>-<role>.md.
  - Reply with: the file path, your position in one line, and any questions for the CEO. Nothing else.
  ```

  The run folder is `.council/runs/YYYY-MM-DD-<topic>/`. Round 2 agents and the synthesizer read the Round 1 files themselves. The orchestrator reads only the synthesis file, and uses the one-line positions to find the conflicting pairs.
- **After the decision is recorded**, delete the run folder and tell the user: *"`/clear`, then: run team-council-plan on `<decision path>`."* The plan starts from the record, not from a context holding the whole debate.
- Attribute every specialist finding to the invoking role so evidence is traceable.
- The council is standalone — it needs only a decision context and a profile; it does not require superpowers or GSD to be installed.
