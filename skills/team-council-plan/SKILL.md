---
name: team-council-plan
description: Turn a resolved council decision into a concrete implementation plan. Run AFTER team-council has reached a decision — it reads the recorded decision from `.council/decisions/`, drafts a step-by-step plan, and has the CTO/PO roles vet it before finalizing. Use when the council has decided WHAT to do and you now need the plan for HOW.
---

# team-council-plan

The second half of the council workflow. `team-council` decides **what**; `team-council-plan` produces the **how** — a reviewed implementation plan grounded in that decision.

## Preconditions

- **A resolved decision**: read the most recent (or user-specified) file in `.council/decisions/YYYY-MM-DD-<topic>.md`. If none exists, the council hasn't run — stop and point the user to `team-council` first.
- **Project profile**: read `.council/project-profile.md` (run `team-scan` if missing).

## Flow

```
Load decision + profile
        ↓
Draft plan (uses writing-plans conventions if available)
        ↓
Role review (parallel): CTO (technical soundness, sequencing, risk)
                        PO  (scope, value, priority ordering)
                        + any specialist the decision implicates
        ↓
Reconcile review feedback → revised plan
        ↓
Present plan to CEO for approval
        ↓
Write plan to docs/plans/YYYY-MM-DD-<topic>.md (or project's plan location)
```

### 1. Load context
Read the decision file and the profile. Extract the accepted direction, the trade-offs the council explicitly accepted, and any dissenting views worth guarding against.

### 2. Draft the plan
Produce a step-by-step implementation plan. If `superpowers:writing-plans` (or the project's planning skill) is available, follow its conventions. The plan must honor the council's decision — it implements the chosen direction, it does not relitigate it.

### 3. Role review (parallel)
Dispatch focused review agents against the draft:
- **CTO** — technical soundness, correct sequencing, testability, risk, adherence to quality gates.
- **PO** — scope fidelity to the decision, value ordering, nothing smuggled in or dropped.
- **Ad-hoc specialist** — if the decision implicates a domain (e.g. UX for a UI change, a Performance Analyst for a perf change).

Each reviewer cites evidence and flags concrete plan defects, not vibes.

### 4. Reconcile
Fold review feedback into a revised plan. Where a reviewer's concern conflicts with the council's accepted trade-off, keep the decision and note the tension explicitly rather than silently overriding it.

### 5. Approve & write
Write the revised plan to the project's plan location (`docs/plans/YYYY-MM-DD-<topic>.md` by default) with `Status: draft` at the top. Reference the source decision file there too, so the two stay linked.

**REQUIRED SUB-SKILL:** use `team-ceo-view` for approval (`kind: "plan"`, `source` = the draft plan). Map it like this:
- `summary` (labelled bullets): *Goal*, *Accepted trade-offs*, *Shape of the plan*.
- **Each plan step**: a routine decision (Approve/Decline). Add `code` when a step changes an existing interface.
- **Each risk the reviewers raised that needs acceptance**: a weighty decision with options such as *accept / mitigate as proposed / rework*, with the reviewers' points in `for`/`against`.
- `tensions`: reviewer concerns kept in tension with the council's accepted trade-off (from step 4).
- **Figure** (only when the steps aren't a straight line): the step dependency graph.

Declines or notes → revise the draft and re-render. On full approval, remove `Status: draft`.

## Output: the plan
Follow the project's plan format if one exists. Otherwise, a solid default:

```markdown
# Plan — {topic}
_From council decision: .council/decisions/YYYY-MM-DD-<topic>.md_

## Goal
[The decided direction, in one or two sentences]

## Accepted Trade-offs
[Carried from the decision — what we knowingly gave up]

## Steps
1. [Concrete, verifiable step]
2. ...

## Risks & Mitigations
[From CTO/PO review]

## Verification
[How we confirm each step and the whole works]
```

## Notes
- This skill plans; it does not implement. Hand off to `superpowers:executing-plans` / `subagent-driven-development` or the project's execution workflow.
- Keep the plan traceable to the decision so future readers see both the "what" and the "how".
