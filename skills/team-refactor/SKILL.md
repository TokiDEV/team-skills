---
name: team-refactor
description: Use when code needs refactoring, cleanup, or a design-quality review — god functions, tangled responsibilities, duplication, over-engineering, legacy code without tests, or code that resists the next change. Also when the user invokes Uncle Bob, Fowler, Beck, Feathers, Ousterhout, SOLID, KISS, YAGNI or clean code on existing code.
---

# team-refactor

A panel of refactoring lenses reviews a scoped piece of code in **isolated contexts**, a KISS/YAGNI gate kills speculative work, the human (CEO) approves a backlog, then execution happens in tiny behavior-preserving steps. Same family as `team-council`: evidence-backed, attributed, recorded under `.council/`.

**Core principle:** refactoring changes structure, never behavior. Everything else in this skill protects that line or keeps the refactoring from becoming its own over-engineering.

**REQUIRED BACKGROUND:** follow `team-protocol` for dispatch, the run folder, the agent contract, counting positions and the handoff.

## Iron Laws

1. **Behavior-preserving only.** Any observable change — outputs, rounding, error types, side effects, call order, emails, logs relied on — is a *Found, not fixed* item for the CEO. It is never a backlog step, even if the user said "fix it while you're there" or "whatever, make it clean".
2. **No safety net, no refactor.** Code the step touches must be pinned by tests first, and the tests must be proven to bite (see Step 0).
3. **One named refactoring per commit.** Structure and behavior never share a commit (Beck, *Tidy First*).
4. **Red means revert.** A failing gate after a step → `git checkout` the step, shrink it, retry. Never debug forward.
5. **An abstraction needs a present second case.** Roadmap talk ("we plan to add providers"), TODOs, and "might" are not cases. Two real call sites today, or it doesn't exist.
6. **Stay inside the approved scope.** No drive-by edits outside the files and steps the CEO approved.

**Violating the letter of these laws is violating their spirit.**

## The Panel

Templates in `roles/` (overridable per project, see `team-protocol`). Each role is a *lens on a body of work*, not an impersonation.

| Role | Sources (a sample; all in the role file) | Signature question | Owns |
|------|-------|--------------------|------|
| **Responsibilities** (`role-responsibilities.md`) | Martin, Liskov, Meyer, Wirfs-Brock | "How many reasons does this have to change?" | Responsibilities, naming, contracts, dependency direction |
| **Mechanics** (`role-mechanics.md`) | Fowler, Opdyke, Metz & Owen, Lawall | "Which smell, and which named refactoring removes it?" | Vocabulary, mechanics |
| **Sequencing** (`role-sequencing.md`) | Beck, Descartes, Ohno, the Mikado Method | "What change is coming, and what tidying makes it easy?" | Sequencing, step size |
| **Safety Net** (`role-safety-net.md`) | Feathers, Bache, mutation testing, Claude Bernard | "How do we get this under test before we touch it?" | Safety net, seams |
| **Depth** (`role-depth.md`) | Ousterhout, Parnas, Hermans, Simondon | "Is the interface simpler than what it hides?" | Depth; counterweight to over-splitting |
| **Minimalist** (`role-minimalist.md`) | Jeffries, Metz, Saint-Exupéry, Wirth, Ockham | "What breaks if we don't do this?" | **The gate** |

Card IDs carry the seat's prefix: RS, MC, SQ, SN, DP, and MN for the Minimalist.

Built-in tensions worth surfacing, not smoothing: Responsibilities' small functions ↔ Depth's deep modules; Responsibilities/Mechanics' abstractions ↔ Minimalist's deletion.

## Separation of Context

Every agent gets the minimum it needs and nothing else. This is what makes the panel a panel instead of one opinion wearing six costumes.

| Agent | Model | Tool budget | Receives | Never receives |
|-------|-------|-------------|----------|----------------|
| Recon | sonnet | ~30 | scope, profile | — |
| Panelist (R1) | sonnet | ~15 | role template + Code Brief + Finding Card format | other panelists' output, conversation history |
| Minimalist gate (R2) | opus | ~10 | all Finding Cards | full R1 transcripts |
| Tension pair (R2) | sonnet | ~5 | own + counterpart's cards only | the rest |
| Synthesizer | opus | ~10 | cards + verdicts + tension replies | raw transcripts |
| Executor | sonnet | — | **one** Step Batch + the exec brief's header | other steps, the record, the debate |
| Final reviewer | opus | — | full diff + exec brief | the debate |

Never play the roles yourself in one context. Dispatch them, passing the model from the table, with the `team-protocol` agent contract. Put this line first in its *How to work* block: `- Start from the Code Brief. Open a file only to confirm or cite evidence.`

## Flow

```
0. Preconditions   → scope, clean tree, green tests, profile
1. Recon           → Code Brief (one agent)
2. Round 1 (blind) → 6 panelists in parallel → Finding Cards
3. Round 2         → Minimalist gate on every card + tension pairs
4. Synthesis       → Backlog + Found-not-fixed + Rejected + Tensions
5. CEO gate        → approves steps, decides each anomaly; write record + exec brief
   ── fresh session ──
6. Execute         → from the exec brief: Step 0 safety net, then one Step Batch per fresh executor, gated
7. Record          → .council/refactors/YYYY-MM-DD-<topic>.md
```

### 0. Preconditions
- **Scope**: a path, module, or diff. "The whole repo" → ask the user to narrow it, or have Recon rank hotspots (churn × complexity) and propose the top one.
- **Clean working tree** (`.council/` excepted; the record is committed alongside Step 0) and a **green test run**. Record the exact test/lint/typecheck commands.
- **Profile**: read `.council/project-profile.md` if present; offer `team-scan` if not (not required).
- **Proportionality**: for a scope under ~150 lines, the orchestrator writes the Code Brief itself instead of dispatching Recon, and runs at most 2 tension pairs. The panel and the gate always run. Above ~3,000 lines, or more than one package, narrow the scope before dispatching the panel.

### 1. Recon → Code Brief
One read-only agent (a code-exploration agent from the profile's Technical domain, or the built-in `Explore`) writes the brief — the *only* shared context for the panel, so six panelists don't each re-read the same files. Keep it under ~60 lines, plus the excerpts:
- Files in scope with line counts; public API and its callers (outside-in)
- **Coverage map**: which branches/behaviors tests pin, which are unpinned
- Hotspots: `git log` churn for these files
- Quality-gate commands
- Upcoming change, if the user named one (Sequencing orders toward it)
- **Excerpts**: the hotspot code itself, with `file:line` headers, at most ~200 lines in all

### 2. Round 1 — blind panel (parallel)
Dispatch all 6 in one message. Fill each template's placeholders: `{PROJECT_PROFILE}` (or "none"), `{SCOPE}`, `{CODE_BRIEF}`, `{FINDING_CARD_FORMAT}` (the block below), and append the agent contract. Each checks the code itself (read-only) within its budget and writes **at most 5 Finding Cards**, plus a *Leave alone* list and any *Behavior anomalies* spotted. The cap forces prioritization. Safety Net also returns the **Step 0 safety-net spec**.

```markdown
### <ROLE>-<n>: <Smell name> in <file:lines>
- Principle: <SRP | OCP | DIP | Simple Design rule | Depth | KISS | YAGNI | ...> (<the source from your Sources it comes from>)
- Evidence: <cited lines; what in the code shows it>
- Refactoring: <named: Extract Function, Replace Conditional with Polymorphism, Guard Clause, Inline Class, Remove Dead Code, Sprout Method...>
- Payoff: <a concrete, present gain — "adding a customer type touches 1 place instead of 3". Not "cleaner", not "more extensible">
- Cost/risk: <S|M|L> — <what could break>
- Safety net: <pinned by <tests> | needs characterization of <behavior>>
- Confidence: <high|med|low>
```

### 3. Round 2 — gate and tensions (parallel)
- **Minimalist gate** (its Round 2 job, `{ALL_FINDING_CARDS}` filled) sees every card and returns one line each: `KEEP` | `SHRINK → <smaller version>` | `KILL — <reason>`. Kill test: no present pain removed, no second real use today, no faster read afterwards, not deeper than what it replaces.
  The verdict is a gate, not a vote. `SHRINK` replaces the card with its smaller version. `KILL` sends the card to *Considered and rejected*, except when the card was proposed independently by two or more panelists (the gate lists these duplicates): blind convergence is evidence, so that card becomes a tension, Minimalist against its authors, for the CEO.
- **Tension pairs**: where two cards conflict (same code, opposite moves), send each side the other's card for one direct reply. Agreeing roles skip.

### 4. Synthesis
A separate synthesizer agent produces the following. The orchestrator reads only this file, so it holds everything the gate page and the exec brief need:

```markdown
## Refactoring Backlog — <scope>

### Steps (in order)
Step 0 is always the safety net. Then Sequencing's order: tidyings that make
the next change easy → structural moves → deletions.
| # | Named refactoring | Target | From cards | Size |

### Step 0 — safety net
[Safety Net's spec, copied in full]

### Step Cards
[One per step, in the Step Card format of step 6, followed by its gate
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

A card the gate kept but two panelists conflict on is settled by *Counting positions* (`team-protocol`); a Finding Card's `Evidence` line is its evidence. A majority's move is a backlog step, with the dissent in its `against`. With no majority, the conflict is a tension, and neither side's step is in *Steps*. The tension names the slot where the winning side's step goes, and the step joins the backlog there once the CEO picks a side.

The backlog holds at most 8 steps after Step 0. The rest go in *Next run*, ranked, and from there into the record. Each step costs a context load and a gate run, and a long backlog is how a review turns into a weekend of execution.

The caps are the synthesizer's job, not the CEO's: a gate with 13 findings and 4 tensions gets rubber-stamped.

Architecture-level questions (new layers, changing a public contract) → recommend `team-council` instead of deciding here.

### 5. CEO gate
**REQUIRED SUB-SKILL:** use `team-ceo-view` to present the backlog as a local HTML decision page. The *Found, not fixed* items, optional steps and tensions are major decisions; minor quirks are `minor: true, default: "leave"`. Take each step's before/after `code` and its credited `for`/`against` from its Step Card's gate material in the synthesis. When module boundaries move, add an `outcome` (`system` view: the module map today and after the approved steps). Put each metric on the step it measures, and each screenshot on the finding it shows. Tensions and gate-rejected cards go in `tensions` and `rejected`, so the CEO can side or revive. A tension's steps have no card of their own. Put their `code` on the tension. Write `summary` as labelled bullets: *Verdict*, *Weak spots*, *Found, not fixed*, *Recommendation*. Set `source` to the refactor record. Record the returned decisions in the `.md`. The CEO approves steps (all, some, or edits) and decides every *Found, not fixed* item. An approved behavior fix is **not** a refactoring step: it runs after the refactor, as its own `fix:` commit, test-first (with the profile's TDD skill, if it lists one).

**Hand off to a fresh session.** Write two files now:
- **The record**, `.council/refactors/YYYY-MM-DD-<topic>.md`, for humans and future refactors: `Status: approved, not executed`, the synthesis, the CEO decisions with their notes, rejected cards, tensions and the *Next run* list.
- **The exec brief**, `.council/refactors/YYYY-MM-DD-<topic>.exec.md`, for the executors and nothing else: a header (scope, quality-gate commands, fences for the whole run), Safety Net's Step 0 spec, the approved Step Cards in order, and the approved `fix:` items. No debate, no arguments, no rejected items. Aim under ~150 lines.

Then hand off (`team-protocol`): *"`/clear`, then: execute the refactor in `<exec brief path>`."*

### 6. Execute
Start from the exec brief. Don't read the record or the run folder.

**Step 0 — safety net** (Safety Net): add characterization tests for every unpinned behavior the approved steps touch, run them green against the *untouched* code, then prove they bite: break the code deliberately (flip a rounding, a comparison, a constant), confirm a test fails, restore. Commit `test: characterize <scope>`.

Then group the approved steps into **Step Batches**: consecutive steps in backlog order, size S, touching overlapping files, at most 4 per batch. Any M or L step is a batch of one. Dispatch a **fresh executor** per batch with its Step Cards and the exec brief's header:

```markdown
## Step <n>: <Named refactoring> — <target>
Why: <card ids + principle>
Do: <1–5 bullets of mechanics>
Fence: <files and behaviors not to touch>
Verify: <exact test/lint/typecheck commands>
Commit: refactor(<scope>): <Named refactoring> in <target>
On red: revert the step, report why, stop.
```

The executor runs the steps in order and commits after each one, so Iron Laws 3 and 4 still hold per step. It replies with one line per step: commit hash, or `reverted — <reason>`. Between batches, the orchestrator runs the gates itself. Last, one reviewer agent (opus) reads the full diff against the exec brief: nothing smuggled in, nothing behavioral, no step skipped, no check weakened (a lowered threshold, a skipped or deleted test, an assertion removed, a new `@ts-ignore`, `eslint-disable` or coverage ignore, a stub or empty `catch` where moved code used to be). Findings go to a fresh executor with the reviewer's report and the Step Cards it names. It commits each fix as a `fixup!` of the step it belongs to, so `git rebase --autosquash` folds it in before the push, and the reviewer re-checks only a fix that changed logic. Don't fix them in the orchestrator: its context is the most expensive one in the run.

### 7. Record
Complete `.council/refactors/YYYY-MM-DD-<topic>.md`: add the commits (hash and step, one line each), the reverted steps with their reason, and any open anomalies, and set `Status: executed`. Delete the exec brief: anything worth keeping is in the record by now (the run folder went at the gate). Future refactors read past records first.

## Rationalizations

| Excuse | Reality |
|--------|---------|
| "The user plans more providers, so an interface now is cheap" | One data point is a guess at an API. When the second one arrives you'll know its shape; adding the seam then costs the same. |
| "One file per concern is SRP" | Splitting 50 lines into 4 files creates shallow modules. SRP is about reasons to change, not file count. |
| "They said 'whatever, make it clean', so I can fix the rounding" | A vague aside isn't a decision on customer-facing money. Surface it, don't make the call. |
| "I'll play the roles myself, it's faster" | One context gives one opinion. You'll get "all three agree" and no tension. |
| "The tests pass, so it's safe" | Two tests on one branch pin nothing. Check the coverage map. |
| "This step is tiny, I'll fold it into the next commit" | Folded steps lose the ability to revert one cleanly. Batch steps in one executor, never in one commit. |
| "It went red, I'll just fix the test" | The test is the spec. Revert the step. |
| "The linter trips on the moved code; one `eslint-disable` and it's green" | A silenced check lowers the bar the step is measured against. Revert, shrink the step, retry. |

## Red Flags — stop and return to the flow

- Writing an interface, base class, registry or plugin point with one implementation
- A commit message containing "and"
- Changing an expected value in an existing test
- A new `.skip`, `@ts-ignore`, `eslint-disable` or coverage ignore, or a threshold lowered in config
- A stub, an empty `catch` or a `TODO` where moved code used to be
- Editing a file outside the fence
- Reasoning "they'll need this later"
- Panel output where every role agrees on everything
