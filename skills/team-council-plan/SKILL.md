---
name: team-council-plan
description: Turn a resolved council decision into a concrete implementation plan. Run AFTER team-council has reached a decision — it reads the recorded decision from `.council/decisions/`, drafts a step-by-step plan, and has the CTO/PO roles vet it before finalizing. Use when the council has decided WHAT to do and you now need the plan for HOW.
---

# team-council-plan

The second half of the council workflow. `team-council` decides **what**; `team-council-plan` produces the **how** — a reviewed implementation plan grounded in that decision.

**REQUIRED BACKGROUND:** follow `team-protocol` for dispatch, the run folder, the agent contract, counting positions and the handoff.

## Preconditions

- **A resolved decision**: read the most recent (or user-specified) file in `.council/decisions/YYYY-MM-DD-<topic>.md`. If none exists, the council hasn't run — stop and point the user to `team-council` first.
- **Project profile**: read `.council/project-profile.md` (run `team-scan` if missing).

## Flow

```
Load decision + profile
        ↓
Draft plan (uses writing-plans conventions if available)
        ↓
Role review (parallel): CTO (technical soundness, sequencing, risk) + system sketch
                        PO  (scope, value, priority ordering)
                        UX  (when a user sees a change) + screen mockup
                        + any specialist the decision implicates
        ↓
Reconcile review feedback → revised plan
        ↓
Write draft to docs/plans/YYYY-MM-DD-<topic>.md (or project's plan location)
        ↓
Present plan to CEO → approved: remove Status: draft, hand off
```

### 1. Load context
Read the decision file and the profile. The *Council Summary* and the CEO decisions are what the plan needs; the rest of the record is archive. Extract the accepted direction, the trade-offs the council explicitly accepted, and any dissenting views worth guarding against.

### 2. Draft the plan
Produce a step-by-step implementation plan. If `superpowers:writing-plans` (or the project's planning skill) is available, follow its conventions. The plan must honor the council's decision — it implements the chosen direction, it does not relitigate it.

### 3. Role review (parallel)
Dispatch focused review agents against the draft:
- **CTO** — technical soundness, correct sequencing, testability, risk, adherence to quality gates.
- **PO** — scope fidelity to the decision, value ordering, nothing smuggled in or dropped.
- **UX** — dispatched whenever the plan changes something a user sees: flow, states, accessibility, copy.
- **Ad-hoc specialist** — if the decision implicates another domain (e.g. a Performance Analyst for a perf change).

**Outcome sketches.** The CTO draws the `system` view: the architecture or workflow the plan delivers, and the same diagram for today. UX draws the `ui` view: a wireframe of the target screen, and a screenshot of today's screen when the app runs (a sketch of it otherwise). Each writes SVG files to `.council/gates/YYYY-MM-DD-<topic>/` (`system-before.svg`, `system-after.svg`, `ui-before.png|svg`, `ui-after.svg`), following the *Outcome* rules of `team-ceo-view`. A reviewer who cannot draw the result reports that as a plan defect: the plan doesn't say what it builds.

Each reviewer cites evidence and flags concrete plan defects, not vibes. Dispatch reviewers on `sonnet` with a budget of about 10 tool calls and the agent contract (agent id `review-<role>`); each replies with one line per defect.

### 4. Reconcile
Fold review feedback into a revised plan. Where a reviewer's concern conflicts with the council's accepted trade-off, keep the decision and note the tension explicitly rather than silently overriding it.

### 5. Approve & write
Write the revised plan to the project's plan location (`docs/plans/YYYY-MM-DD-<topic>.md` by default) with `Status: draft` at the top. Reference the source decision file there too, so the two stay linked.

**REQUIRED SUB-SKILL:** use `team-ceo-view` for approval (`kind: "plan"`, `source` = the draft plan). Map it like this:
- `summary` (labelled bullets): *Goal*, *Accepted trade-offs*, *Shape of the plan*.
- `outcome`: the reviewers' sketches from step 3, `system` and/or `ui`, each with `before` and `after`.
- **Each plan step**: a routine decision (Approve/Decline). Its `title` is the move; its `detail` gives only what the title lacks (impact, risk), or is omitted. The size goes in `tags` (`"S"`, `"M"`, `"L"`). Add `code` when a step changes an existing interface.
- **Each risk the reviewers raised that needs acceptance, with a majority** (*Counting positions* in `team-protocol`): a weighty decision with options such as *accept / mitigate as proposed / rework*, with the reviewers' points in `for`/`against`.
- `tensions`: reviewer concerns kept in tension with the council's accepted trade-off (from step 4), and risks the reviewers split on with no majority. A risk is either a decision or a tension, never both.
- No step dependency graph: the order is the executor's concern, and the human approves the destination.

Declines or notes → revise the draft and re-render. On full approval, remove `Status: draft` and hand off (`team-protocol`): *"`/clear`, then: execute `<plan path>` with superpowers:subagent-driven-development."* Execution starts from the plan file, not from a context holding the planning.

## Output: the plan
Follow the project's plan format if one exists. Otherwise, a solid default:

```markdown
# Plan — {topic}
_From council decision: .council/decisions/YYYY-MM-DD-<topic>.md_

## Goal
[The decided direction, in one or two sentences]

## Outcome
[Links to the approved sketches in .council/gates/YYYY-MM-DD-<topic>/, one line each on what changes. The executor builds towards these]

## Accepted Trade-offs
[Carried from the decision — what we knowingly gave up]

## Steps
1. [Concrete, verifiable step] — Size: S|M|L
2. ...

## Execution economy
- Implementers: sonnet for S and M steps, opus for L or design-heavy steps
- Batches: consecutive S steps on overlapping files, at most 4 per implementer, one commit each
- Reviews: sonnet for spec compliance, opus for the final whole-branch review; re-review only a fix that changed logic

## Risks & Mitigations
[From CTO/PO review]

## Verification
[How we confirm each step and the whole works]
```

## Execution

This skill plans; it does not implement. **REQUIRED SUB-SKILL for the executing session:** `superpowers:subagent-driven-development` (or the project's own execution workflow), following the plan's *Execution economy* section: models, batches, and when to re-review.

Without superpowers, execute from the plan file this way:
1. Group the steps into batches as *Execution economy* says. Dispatch a fresh implementer per batch with its steps and the plan's *Goal* and *Outcome*, never the decision record.
2. The implementer writes a failing test first when a step changes behavior, commits each step on its own, and replies with one line per step: commit hash, or `blocked — <reason>`.
3. After each batch, run the *Verification* commands yourself. Red → send the failure back to that batch's implementer once, then stop and ask the human.
4. Last, one reviewer (opus) reads the full diff against the plan: nothing smuggled in, nothing dropped, the *Outcome* reached.

Set `Status: executed` on the plan when done. Keep it traceable to the decision so future readers see both the "what" and the "how".
