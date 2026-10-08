---
name: team-kickoff
description: Bootstrap a brand-new project with the full agent council from day zero — gather the vision, scan the (possibly empty) directory, run the council on the vision, and write an initial `.council/project-profile.md` and CLAUDE.md. Use when starting a new project and you want multi-perspective input before the first line of code.
---

# team-kickoff

New-project bootstrap. Brings the council in before there's any code, so the project's direction and conventions are shaped by the full team rather than defaulted. Reuses `team-council` internally.

**REQUIRED BACKGROUND:** follow `team-protocol` for dispatch, the run folder, the agent contract, counting positions and the handoff.

## Flow

```
1. Gather vision      → ask the user: what, who, why
2. team-scan          → run on the directory (even if empty — detects global tools)
3. Dispatch council   → full council with the vision as decision context
4. PO synthesis       → team input → project brief
5. CEO approval       → present brief, iterate
6. Write foundations  → .council/project-profile.md + initial CLAUDE.md
7. Hand off           → existing project setup / scaffolding workflow
```

### 1. Gather vision
Ask the user for the project vision if not already given:
- **What** — what is being built, in one or two sentences.
- **Who** — the users and their context.
- **Why** — the problem, the value, the ambition.

### 2. Scan
Run `team-scan` on the target directory. On an empty directory it still detects globally available skills, agents, and MCP tools, and records the intended stack from the vision.

### 3. Council on the vision
Invoke `team-council` with the vision as the decision context, with every role seated and at two-round depth: a vision is open and not cheap to reverse. The roles debate the shape of the project — scope, architecture direction, UX principles, first-principles soundness, and ambitious alternatives — before anything is committed. Run the council through its synthesis but **skip its CEO gate**: step 5 is the single gate for kickoff.

### 4. Synthesis → brief
The PO synthesis produces a project brief: the agreed vision, the initial scope, the technical and UX direction, and the tensions to revisit later. It also sketches v1 into `.council/gates/YYYY-MM-DD-kickoff/`: the `system` view (components, data flow, external services) and, if the project has a UI, the `ui` view (a wireframe of the core screen). Both are `after` only, since nothing exists yet. Draw them by `figures.md` of `team-ceo-view` (`../team-ceo-view/figures.md` from this skill's base directory).

### 5. CEO approval
Write the brief to `.council/decisions/YYYY-MM-DD-kickoff.md`. **REQUIRED SUB-SKILL:** use `team-ceo-view` (`kind: "kickoff"`, `source` = the brief). Map it like this:
- `summary` (labelled bullets): *What*, *Who*, *Why*, *v1 in one line*.
- `outcome`: the v1 sketches from step 4.
- **Each scope item**: a routine decision with options *In v1 / Later / Out*.
- **Each direction choice with a majority** (stack, architecture, UX principles): a weighty decision whose options are the council's alternatives, with the majority's option marked and the roles' arguments in `for`/`against`.
- `tensions`: direction choices with no majority, and the tensions to revisit later. A choice is either a decision or a tension, never both.

Iterate: notes or changed choices → revise the brief and re-render. The CEO is satisfied when a decisions block comes back with nothing to revise.

### 6. Write foundations
- `.council/project-profile.md` — the profile (from team-scan, enriched by the council's conclusions about intended stack and conventions).
- `CLAUDE.md` — initial project instructions: quality gates, design context, principles, conventions the council agreed on.

### 7. Hand off
Delete the council's run folder (its own handoff was skipped with its gate), then hand off (`team-protocol`) to the project's setup/scaffolding workflow, or to `team-council-plan` on the kickoff record if the next step is planning the first milestone.

## Notes
- team-kickoff is the only council skill that expects to run before code exists; the others assume a project.
- Everything it writes is a starting point — `team-scan` re-runs and the profile evolves as the project matures.
