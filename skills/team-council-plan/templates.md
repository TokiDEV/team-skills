# team-council-plan templates

What each agent produces. The orchestrator copies this file into the run folder and points each agent to its section.

## Plan (writers)

Follow the project's plan format if one exists, adding `Status: draft`, the decision file's path, and the final-review bullet of *Verification* below. Otherwise:

```markdown
# Plan — {topic}
Status: draft
_From council decision: .council/decisions/YYYY-MM-DD-<topic>.md_

## Goal
[The decided direction, in one or two sentences]

## Outcome
[Links to the approved sketches (committed copies if .council/gates/ is gitignored), one line each on what changes. The executor builds towards these]

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
- Final whole-branch review (opus): nothing smuggled in or dropped, the *Outcome* reached, no check weakened (a lowered threshold, a skipped or deleted test, a new `@ts-ignore` or `eslint-disable`, a stub or empty `catch` where the work should be)
```

## Review (reviewers)

- **CTO** — technical soundness, correct sequencing, testability, risk, adherence to quality gates.
- **PO** — scope fidelity to the decision, value ordering, nothing smuggled in or dropped.
- **UX** — dispatched whenever the plan changes something a user sees: flow, states, accessibility, copy.
- **Ad-hoc specialist** — if the decision implicates another domain (e.g. a Performance Analyst for a perf change).

Pick 2–3 of your role's `## Sources` and end your verdict with `— via <sources>`. Cite evidence and flag concrete plan defects, not vibes.

**Outcome sketches.** The CTO draws the `system` view: the architecture or workflow the plan delivers, and the same diagram for today. UX draws the `ui` view: a wireframe of the target screen, and a screenshot of today's screen when the app runs (a sketch of it otherwise). Each writes SVG files to `.council/gates/YYYY-MM-DD-<topic>/` (`system-before.svg`, `system-after.svg`, `ui-before.png|svg`, `ui-after.svg`), following *Outcome* in `team-ceo-view`'s `contract.md` and `figures.md` (copies in the run folder). A reviewer who cannot draw the result reports that as a plan defect: the plan doesn't say what it builds.

## Gate page (gate writer)

Build the page (`kind: "plan"`, `source` = the draft plan) by `team-ceo-view`'s `contract.md`:
- `summary` (labelled bullets): *Goal*, *Accepted trade-offs*, *Shape of the plan*.
- `outcome`: the reviewers' sketches in `.council/gates/YYYY-MM-DD-<topic>/`, `system` and/or `ui`, each with `before` and `after`.
- **Each plan step**: a routine decision (Approve/Decline). Its `title` is the move; its `detail` gives only what the title lacks (impact, risk), or is omitted. The size goes in `tags` (`"S"`, `"M"`, `"L"`). Add `code` when a step changes an existing interface.
- **Each risk the reviewers raised that needs acceptance, with a majority** (`counting.md`): a weighty decision with options such as *accept / mitigate as proposed / rework*, with the reviewers' points in `for`/`against`. When the risk reopens a question the council decided, add the council's minority option too, labelled `reverses council D<n>` with the council record's id.
- `tensions`: reviewer concerns kept in tension with the council's accepted trade-off (your dispatch lists them), and risks the reviewers split on with no majority. A risk is either a decision or a tension, never both.
- No step dependency graph: the order is the executor's concern, and the human approves the destination.

If `.council/gates/` is gitignored, also copy the approved sketches next to the plan (e.g. `docs/plans/YYYY-MM-DD-<topic>/`) and link those copies from its `## Outcome`: executors in a worktree see only committed files.
