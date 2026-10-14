# team-refactor templates

What each agent writes. The orchestrator copies this file into the run folder and points each agent to its section.

A pointer to a `team-protocol` section means that section of `team-protocol.md`, and one to a `counting.md` section that section of `counting.md`: both are copied beside this file.

## Code Brief (Recon)

The *only* shared context for the panel, so six panelists don't each re-read the same files. Its length and its gate-command rule: `team-protocol` § *Code scope*. It holds:
- Files in scope with line counts; public API and its callers (outside-in)
- **Coverage map**: which branches/behaviors tests pin, which are unpinned
- Hotspots: `git log` churn for these files
- Quality-gate commands, each with its result (`team-protocol` § *Code scope*).
- Known flakes: any test that failed and then passed on a rerun during your runs, with its name
- Upcoming change, if the user named one (Sequencing orders toward it)
- For a diff scope: the changed line ranges per file (`git diff --unified=0`), so panelists can tell new code from old.
- Static-analysis leads: if the profile lists dead-code or import-cycle tools, run them on the scope and list their hits as leads. A lead is not a finding: static analysis misses dynamic imports, config references and codegen, so a panelist verifies each by hand before citing it.
- **Excerpts**: the hotspot code itself, with `file:line` headers

## Finding Card (panelists)

At most 5 cards: the cap forces prioritization. Then a *Leave alone* list and any *Behavior anomalies* spotted (for team-review). Safety Net also writes the **Step 0 safety-net spec**.

```markdown
### <ROLE>-<n>: <Smell name> in <file:lines>
- Principle: <SRP | OCP | DIP | Simple Design rule | Depth | KISS | YAGNI | ...> (<the source from your Sources it comes from>)
- Evidence: <cited lines, at least one opened in source, not only quoted from the Code Brief; what in the code shows it>
- Refutation: <what you checked that could have proved this wrong — the guard, the caller, the test — and what you found>
- Refactoring: <exactly one, named: Extract Function, Replace Conditional with Polymorphism, Guard Clause, Inline Class, Remove Dead Code, Sprout Method...>
- Payoff: <a concrete, present gain — "adding a customer type touches 1 place instead of 3". Not "cleaner", not "more extensible">
- Cost/risk: <S|M|L> — <what could break>
- Safety net: <pinned by <tests> | needs characterization of <behavior>>
- Confidence: <high|med|low> (by `counting.md` § *Confidence*; a low card goes to *Leave alone*, never a step)
```

## Synthesis (synthesizer)

Its length and its readers: `team-protocol` § *Writers*. It holds everything the gate page and the exec brief need.

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

### For team-review — suspected bugs, not fixed here
[One line each: the anomaly, file:line, and the Step 0 test that pins it
as-is. No decision, no fix: team-review owns behavior.]

### Considered and rejected
[Card id — gate reason. Kept so the next refactor doesn't relitigate it]

### Tensions for the CEO — at most 3
[Only conflicts with no majority that change what gets executed. Strongest
version of each side, each side's step as a Step Card, and a suggested default]

### Next run
[Kept steps beyond the cap of 8, ranked, one line each]
```

- **Gate verdicts.** `SHRINK` replaces the card with its smaller version. `KILL` sends it to *Considered and rejected*, unless the gate listed it as found by two or more independent panelists: then it is a tension, Minimalist against its authors.
- **Low cards.** A `low` card never becomes a step; it goes to *Leave alone*.
- **Conflicts.** A card the gate kept but two panelists conflict on is settled by `counting.md`; a card's `Evidence` line is its evidence. A majority's move is a step, with the dissent in its `against`. With no majority, it is a tension, neither side's step is in *Steps*, and the tension names the slot where the winning side's step goes. The record writer puts the chosen side's step in that slot once the CEO picks a side.
- **Caps are yours, not the CEO's.** At most 8 steps after Step 0; the rest go in *Next run*. A gate with 13 findings and 4 tensions gets rubber-stamped, and a long backlog turns a review into a weekend of execution.
- **Architecture-level questions** (new layers, a changed public contract): recommend `team-council` instead of deciding here.

## Gate page (gate writer)

Build the page by `team-ceo-view`'s `contract.md`, from the synthesis:
- `summary`: labelled bullets *Verdict*, *Weak spots*, *For team-review*, *Recommendation*. `source` is the refactor record. When a *For team-review* line touches money, data or a public contract, *Recommendation* says to run team-review on the scope before executing.
- **Steps**: routine decisions. Each takes its before/after `code` and credited `for`/`against` from its Step Card's gate material.
- `needs` on each step that relies on another: on Step 0 when its characterization tests are that step's safety net, or on the earlier step it builds on.
- Optional steps and tensions are major decisions.
- `tensions` and `rejected`: the synthesis's tensions and gate-rejected cards, so the CEO can side or revive. A tension's steps have no card of their own: put their `code` on the tension.
- `outcome` when module boundaries move: the `system` view, the module map today and after the approved steps.
- Each metric on the step it measures, each screenshot on the finding it shows.

## Record and exec brief (record writer)

From the synthesis and the decisions block, write two files:
- **The record**, `.council/refactors/YYYY-MM-DD-<topic>.md`, for humans and future refactors: `Status: approved, not executed`, the synthesis, the CEO decisions with their notes, rejected cards, tensions and the *Next run* list.
- **The exec brief**, `.council/refactors/YYYY-MM-DD-<topic>.exec.md`, by `team-protocol` § *Writers*: the header takes its quality-gate commands from the Code Brief and also lists the known flakes; then Safety Net's Step 0 spec, then the approved Step Cards in order.

After execution, complete the record by `team-protocol` § *Writers*; the reviewer's `note` findings go to *For team-review*.

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
- no check weakened (`team-protocol` § *Weakened checks*); here also no existing test's expected value changed at all, and no `TODO` where moved code used to be.

Tag each finding `fix` or `note`, with the step it belongs to.
