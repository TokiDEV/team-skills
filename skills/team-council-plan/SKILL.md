---
name: team-council-plan
description: Use when a council decision is recorded under `.council/decisions/` and the next step is planning how to carry it out, or when the user asks to plan the council's decision. Not for planning work the council never decided.
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
Settle open questions and human-only inputs
        ↓
Draft plan (the profile's planning skill conventions, if any); keystone first
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

### 1b. Settle before drafting
Writers type in a settled design. Before any draft, list:
- **Open design questions**: what the decision leaves open that would change the plan's shape (which path a call takes, where a type lives, whether two entry points share one route). Settle each with the user (AskUserQuestion, a recommendation first), or with a spike agent that writes its numbers into the brief.
- **Human-only inputs**: captures, probes, credentials, measurements on the user's machine. Collect them now. A writer that needs one waits for it, never guesses it.
- **Unobserved facts**: when the plan rests on what the code does today, one evidence-pass agent gathers them first (agent id `evidence`).

### 2. Draft the plan
Writers produce a step-by-step implementation plan in the project's plan format, or the conventions of the planning skill the profile's Process domain lists, or else `templates.md` § *Plan*. The plan must honor the council's decision — it implements the chosen direction, it does not relitigate it.

Writers and fixers write the plan files at the project's plan location (`docs/plans/YYYY-MM-DD-<topic>.md` by default, sub-plans beside it), not in the run folder, and reply by the agent contract. Agent ids: `evidence`, `spike-<n>`, `index`, `plan-<part>`, `fix-<part>`, `review-<role>`, `gate`, `record`.

A plan that fits one file is drafted by one writer. A plan large enough to split into sub-plans splits along interfaces, in this order:
1. **The index** (one writer): the sub-plans, their order, and the **cross-plan contract**: every name, signature, id and type one sub-plan exports and another uses.
2. **The keystone sub-plan** (the one the others build on), written against that contract. Its *Interfaces* block is then frozen.
3. **The consumers**, in parallel, each given the frozen contract, never a guess at it.

A writer that needs to change the contract stops and reports. A fresh `fix-index` writer amends the contract and the keystone before any consumer adapts.

### 3. Role review (parallel)
Dispatch the reviewers by `templates.md` § *Review*: CTO and PO always, UX whenever the plan changes something a user sees, and an ad-hoc specialist when the decision implicates another domain (write it 3–5 sources, `team-protocol`). Each gets its council role's `## Sources` (`../team-council/roles/role-<role>.md` from this skill's base directory, copied into the run folder), and the CTO and UX also the copies of `contract.md` and `figures.md` for their sketches. Each replies with one line per defect.

| Agent | Model | Tool budget |
|-------|-------|-------------|
| Evidence pass, spike | sonnet (opus for a design spike) | ~20 |
| Keystone writer | opus | ~30 |
| Other writers | sonnet | ~25 |
| Fixers (review defects, CEO rulings) | sonnet | ~20 |
| Reviewers: CTO, PO, UX, specialists | sonnet | ~10 |
| Gate writer | sonnet | ~12 |
| Record writer (amendments) | sonnet | ~8 |

### 4. Reconcile
Fold review feedback into a revised plan through fresh fixers, each given the defect lines for its file. Where a reviewer's concern conflicts with the council's accepted trade-off, keep the decision and note the tension explicitly rather than silently overriding it.

### 5. Approve & write
The revised plan sits at the project's plan location (`docs/plans/YYYY-MM-DD-<topic>.md` by default) with `Status: draft` at the top. Reference the source decision file there too, so the two stay linked.

**REQUIRED SUB-SKILL:** `team-ceo-view`. The gate writer builds and renders the page by `templates.md` § *Gate page*; you serve it and read the decisions block.

Declines or notes → revise the draft through fixers and re-render.

**The CEO amends the decision at the gate** (picks a `reverses council D<n>` option, or says so in a note):
1. A record writer (sonnet, ~8) records the amendment under `## Plan gate` in the decision record: the item, the new direction, the CEO's words.
2. Revise only the sub-plans or steps it changes.
3. One CTO reviewer (sonnet, ~10) checks the changed steps.
4. Re-gate only those steps, in `<topic>-plan-r<N>.ceo.json`. The earlier `.decisions.txt` stays on record.

On full approval, remove `Status: draft` and hand off (`team-protocol`): *"`/clear`, then: execute `<plan path>` with `<plan-execution skill>`."* Name the skill the profile lists (see *Execution*); if it lists none, drop the "with" part. Execution starts from the plan file, not from a context holding the planning.

## Execution

This skill plans; it does not implement. The executing session uses the plan-execution skill from the profile's Process domain (e.g. `superpowers:subagent-driven-development`), or the project's own execution workflow, and follows the plan's *Execution economy* section: models, batches, and when to re-review.

When the profile lists none, execute from the plan file this way:
1. Group the steps into batches as *Execution economy* says (if the plan has none: consecutive S steps on overlapping files, at most 4 per batch, sonnet implementers, opus for L steps). Dispatch a fresh implementer per batch with its steps and the plan's *Goal* and *Outcome*, never the decision record.
2. The implementer writes a failing test first when a step changes behavior, commits each step on its own, and replies with one line per step: commit hash, or `blocked — <reason>`.
3. After each batch, run the *Verification* commands yourself. Red → send the failure back to that batch's implementer once, then stop and ask the human.
4. Last, one reviewer (opus) reads the full diff against the plan: nothing smuggled in, nothing dropped, the *Outcome* reached, no check weakened (a lowered threshold, a skipped or deleted test, a new `@ts-ignore` or `eslint-disable`, a stub or empty `catch` where the work should be).

Set `Status: executed` on the plan when done. Keep it traceable to the decision so future readers see both the "what" and the "how".

## Rationalizations

The shared ones are in `team-protocol`. These are the planner's own.

| Excuse | Reality |
|--------|---------|
| "The council's pick has a flaw; the plan can quietly route around it" | The plan implements the decision. Note the concern as a tension, or put the minority option on the gate as `reverses council D<n>`. Only the CEO amends the decision; a wholly different direction is a new council. |
| "The writers can start now and align on names later" | Consumers that guess the keystone's API get rewritten. Freeze the contract first. |
| "I'll leave that design question to the writer" | A writer who meets an open question guesses, and the gate undoes the guess. Settle it before drafting. |
| "This extra step is small and useful" | Nothing smuggled in, nothing dropped: that is what the PO reviewer checks. Raise it at the gate instead. |
| "The reviewer can't sketch the outcome, so skip the figure" | A plan whose result can't be drawn doesn't say what it builds. Fix the plan. |
| "It's approved, I'll start executing here" | Execution starts from the plan file, in a fresh session. |

## Red Flags

- A step that traces to nothing in the decision
- A consumer writer dispatched before the contract it codes against is frozen
- A writer guessing a human-only input (a capture, a probe result)
- An amended step re-gated without a review
- A reviewer concern that is in neither the revised plan nor `tensions`
- An accepted trade-off overridden without a note
- Code written during planning
