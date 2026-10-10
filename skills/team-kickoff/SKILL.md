---
name: team-kickoff
description: Use when starting a brand-new project or an empty directory, and the user wants several perspectives on its vision, scope, stack and conventions before the first line of code.
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
The council debates the vision you bring back, so get the one the user holds, not the one that sounds right.

1. **Hypothesize.** Write your read of the project in one sentence, plus your confidence in it (a percentage). Below ~70%, add what is missing.
2. **One question at a time, each with your guess attached.** The user corrects a wrong guess faster than they answer from scratch. Wait for the answer before the next question, since it often changes the next one.
3. **Listen for "should want".** Buzzwords as goals ("scalable", "modern"), deferring to convention ("the standard way"), "I should probably…". Then ask: *"If you didn't have to justify this to anyone, what would you build?"*
4. **Stop when you can predict their answers to your next three questions.** Several rounds without getting there means something basic is missing: say so and step back.
5. **Restate**, in their words, one line each, and ask *yes / no / refine?*
   - **What**: what is being built
   - **Who**: the users and their context
   - **Environment**: where they use it (platform, OS, language, keyboard layout), so no role assumes its own
   - **Why**: the problem, and why now
   - **Success**: how we will know it worked
   - **Constraint**: the binding limit (time, money, stack, team)
   - **Out of scope**: what v1 will not do. Always filled in: half of misalignment is silent disagreement about what is not being built.
6. **Get an explicit yes.** "Sounds good", "sure" and "whatever you think" are not one: ask which line they would change, or offer two concrete options. Fold corrections in and restate.

The confirmed restate is the council's decision context, and *Out of scope* is its fence.

### 2. Scan
Run `team-scan` on the target directory. On an empty directory it still detects globally available skills, agents, and MCP tools, and records the intended stack from the vision.

### 3. Council on the vision
Invoke `team-council` with the confirmed restate as its decision framing (the user already said yes to it, so skip the council's framing questions), with every role seated and at two-round depth: a vision is open and not cheap to reverse. The roles debate the shape of the project — scope, architecture direction, UX principles, first-principles soundness, and ambitious alternatives — before anything is committed. Run the council through its synthesis but **skip its CEO gate**: step 5 is the single gate for kickoff.

### 4. Synthesis → brief
The PO synthesis produces a project brief: the agreed vision, the initial scope, the technical and UX direction, and the tensions to revisit later. A gate writer (sonnet, ~15) then sketches v1 into `.council/gates/YYYY-MM-DD-kickoff/`: the `system` view (components, data flow, external services) and, if the project has a UI, the `ui` view (a wireframe of the core screen). Both are `after` only, since nothing exists yet. Copy `team-ceo-view`'s `contract.md` and `figures.md` into the run folder first (`team-protocol`); the writer draws by `figures.md` and builds the page by `contract.md` and the mapping in step 5.

### 5. CEO approval
A record writer (sonnet, ~8) writes the brief to `.council/decisions/YYYY-MM-DD-kickoff.md`. **REQUIRED SUB-SKILL:** use `team-ceo-view` (`kind: "kickoff"`, `source` = the brief); the gate writer builds and renders the page. Map it like this:
- `summary` (labelled bullets): *What*, *Who*, *Why*, *v1 in one line*.
- `outcome`: the v1 sketches from step 4.
- **Each scope item**: a routine decision with options *In v1 / Later / Out*.
- **Each direction choice with a majority** (stack, architecture, UX principles): a weighty decision whose options are the council's alternatives, with the majority's option marked and the roles' arguments in `for`/`against`.
- `tensions`: direction choices with no majority, and the tensions to revisit later. A choice is either a decision or a tension, never both.

Iterate: notes or changed choices → the record writer revises the brief, the gate writer re-renders. The CEO is satisfied when a decisions block comes back with nothing to revise; the record writer then sets `Status: decided YYYY-MM-DD` on the brief.

### 6. Write foundations
- `.council/project-profile.md` — the profile (from team-scan, enriched by the council's conclusions about intended stack and conventions).
- `CLAUDE.md` — initial project instructions: quality gates, design context, principles, conventions the council agreed on.

### 7. Hand off
Delete the council's run folder (its own handoff was skipped with its gate), then hand off (`team-protocol`) to the project's setup/scaffolding workflow, or to `team-council-plan` on the kickoff record if the next step is planning the first milestone.

## Notes
- team-kickoff is the only council skill that expects to run before code exists; the others assume a project.
- Everything it writes is a starting point — `team-scan` re-runs and the profile evolves as the project matures.
