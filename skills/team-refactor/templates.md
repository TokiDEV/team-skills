# team-refactor templates

What each agent writes. The orchestrator copies this file into the run folder and points each agent to its section.

## Code Brief (Recon)

The *only* shared context for the panel, so six panelists don't each re-read the same files. Under ~60 lines, plus the excerpts:
- Files in scope with line counts; public API and its callers (outside-in)
- **Coverage map**: which branches/behaviors tests pin, which are unpinned
- Hotspots: `git log` churn for these files
- Quality-gate commands, **verbatim as you ran them**, each with its result. No placeholders: a command nobody ran is not a gate.
- Known flakes: any test that failed and then passed on a rerun during your runs, with its name
- Upcoming change, if the user named one (Sequencing orders toward it)
- **Excerpts**: the hotspot code itself, with `file:line` headers, at most ~200 lines in all

## Finding Card (panelists)

At most 5 cards: the cap forces prioritization. Then a *Leave alone* list and any *Behavior anomalies* spotted. Safety Net also writes the **Step 0 safety-net spec**.

```markdown
### <ROLE>-<n>: <Smell name> in <file:lines>
- Principle: <SRP | OCP | DIP | Simple Design rule | Depth | KISS | YAGNI | ...> (<the source from your Sources it comes from>)
- Evidence: <cited lines, at least one opened in source, not only quoted from the Code Brief; what in the code shows it>
- Refactoring: <exactly one, named: Extract Function, Replace Conditional with Polymorphism, Guard Clause, Inline Class, Remove Dead Code, Sprout Method...>
- Payoff: <a concrete, present gain — "adding a customer type touches 1 place instead of 3". Not "cleaner", not "more extensible">
- Cost/risk: <S|M|L> — <what could break>
- Safety net: <pinned by <tests> | needs characterization of <behavior>>
- Confidence: <high|med|low>
```

## Synthesis (synthesizer)

Under ~300 lines. The gate writer and the record writer read only this file, so it holds everything the gate page and the exec brief need.

```markdown
## Refactoring Backlog — <scope>

### Steps (in order)
Step 0 is always the safety net. Then Sequencing's order: tidyings that make
the next change easy → structural moves → deletions.
Each step names exactly one refactoring. A card that needs two
("Parameterize + Move Function") becomes two steps.
| # | Named refactoring | Target | From cards | Size |

### Step 0 — safety net
[Safety Net's spec, copied in full]

### Step Cards
[One per step, in the Step Card format below, followed by its gate
material: before/after code (≤ ~15 lines each), and `for`/`against`
points from the cards and the Minimalist's verdict, each credited]

### Found, not fixed — top 5 by stakes (CEO decides each; default = leave as-is)
[Money, public contract, user-visible output, data. Anything the user asked
about goes first. Each: current behavior, concrete impact, options]

### Minor quirks (pinned as-is by Step 0, no decision needed)
[One line each: edge-case coercions, cosmetic output, stub behavior]

### Considered and rejected
[Card id — gate reason. Kept so the next refactor doesn't relitigate it]

### Tensions for the CEO — at most 3
[Only conflicts with no majority that change what gets executed. Strongest
version of each side, each side's step as a Step Card, and a suggested default]

### Next run
[Kept steps beyond the cap of 8, ranked, one line each]
```

- **Gate verdicts.** `SHRINK` replaces the card with its smaller version. `KILL` sends it to *Considered and rejected*, unless the gate listed it as found by two or more independent panelists: then it is a tension, Minimalist against its authors.
- **Conflicts.** A card the gate kept but two panelists conflict on is settled by `counting.md`; a card's `Evidence` line is its evidence. A majority's move is a step, with the dissent in its `against`. With no majority, it is a tension, neither side's step is in *Steps*, and the tension names the slot where the winning side's step goes. The record writer puts the chosen side's step in that slot once the CEO picks a side.
- **Caps are yours, not the CEO's.** At most 8 steps after Step 0; the rest go in *Next run*. A gate with 13 findings and 4 tensions gets rubber-stamped, and a long backlog turns a review into a weekend of execution.
- **Architecture-level questions** (new layers, a changed public contract): recommend `team-council` instead of deciding here.

## Gate page (gate writer)

Build the page by `team-ceo-view`'s `contract.md`, from the synthesis:
- `summary`: labelled bullets *Verdict*, *Weak spots*, *Found, not fixed*, *Recommendation*. `source` is the refactor record.
- **Steps**: routine decisions. Each takes its before/after `code` and credited `for`/`against` from its Step Card's gate material.
- **Found, not fixed** items, optional steps and tensions are major decisions. Minor quirks are `minor: true, default: "leave"`.
- `tensions` and `rejected`: the synthesis's tensions and gate-rejected cards, so the CEO can side or revive. A tension's steps have no card of their own: put their `code` on the tension.
- `outcome` when module boundaries move: the `system` view, the module map today and after the approved steps.
- Each metric on the step it measures, each screenshot on the finding it shows.

## Record and exec brief (record writer)

From the synthesis and the decisions block, write two files:
- **The record**, `.council/refactors/YYYY-MM-DD-<topic>.md`, for humans and future refactors: `Status: approved, not executed`, the synthesis, the CEO decisions with their notes, rejected cards, tensions and the *Next run* list.
- **The exec brief**, `.council/refactors/YYYY-MM-DD-<topic>.exec.md`, for the executors and nothing else: a header (scope, the quality-gate commands copied verbatim from the Code Brief, known flakes, fences for the whole run), Safety Net's Step 0 spec, the approved Step Cards in order, and the approved `fix:` items. No debate, no arguments, no rejected items. Aim under ~150 lines.

After execution, from the executors' and the reviewer's reply lines: add the commits (hash and step, one line each), the reverted steps with their reason, and the reviewer's `note` findings as open anomalies. Set `Status: executed`.

## Step Card (synthesizer, executors)

```markdown
## Step <n>: <Named refactoring> — <target>
Why: <card ids + principle>
Do: <1–5 bullets of mechanics>
Fence: <files and behaviors not to touch>. Format only the lines you change.
Verify: <exact test/lint/typecheck commands>
Commit: refactor(<scope>): <Named refactoring> in <target>
On red: revert the step, report why, stop.
```

Executors run the steps in order, run *Verify* and commit after each one. Reply with one line per step: commit hash, or `reverted — <reason>`. A red that passes on an isolated rerun counts as green only when the exec brief's header lists that test as a known flake.

## Final review (reviewer)

Rerun the *Verify* commands, then read the full diff against the exec brief:
- nothing smuggled in, nothing behavioral, no step skipped;
- one named refactoring per commit: a subject naming two refactorings, or joined by "and", fails;
- no formatting outside the changed lines;
- no check weakened: a lowered threshold, a skipped or deleted test, an assertion removed, a new `@ts-ignore`, `eslint-disable` or coverage ignore, a stub or empty `catch` where moved code used to be.

Tag each finding `fix` or `note`, with the step it belongs to.
