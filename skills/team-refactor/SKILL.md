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

## Separation of Context

Every agent gets the minimum it needs and nothing else. This is what makes the panel a panel instead of one opinion wearing six costumes. `templates.md` (copied into the run folder, see `team-protocol`) holds what each one writes.

| Agent | Model | Tool budget | Receives | Writes by `templates.md` |
|-------|-------|-------------|----------|--------------------------|
| Recon | sonnet | ~30 | scope, profile | *Code Brief* |
| Panelist (R1) | sonnet | ~15 | role template + Code Brief | *Finding Card* |
| Minimalist gate (R2) | opus | ~10 | all Finding Cards | its role file's *Round 2 Job* |
| Tension pair (R2) | sonnet | ~5 | own + counterpart's cards only | one direct reply |
| Synthesizer | opus | ~10 | cards + verdicts + tension replies | *Synthesis* |
| Gate writer | sonnet | ~12 | the synthesis | *Gate page* |
| Record writer | sonnet | ~8 | the synthesis + the decisions block | *Record and exec brief* |
| Executor | sonnet | — | **one** Step Batch + the exec brief's header | *Step Card* |
| Final reviewer | opus | — | full diff + exec brief | *Final review* |

No agent receives the conversation, the raw transcripts or another panelist's Round 1 output. Put this line first in each panelist's *How to work* block: `- Start from the Code Brief. Open a file only to confirm or cite evidence.`

## Flow

```
0. Preconditions   → scope, clean tree, green tests, profile
1. Recon           → Code Brief (one agent)
2. Round 1 (blind) → 6 panelists in parallel → Finding Cards
3. Round 2         → Minimalist gate on every card + tension pairs
4. Synthesis       → Backlog + Found-not-fixed + Rejected + Tensions
5. CEO gate        → approves steps, decides each anomaly; record + exec brief
   ── fresh session ──
6. Execute         → from the exec brief: Step 0 safety net, then one Step Batch per fresh executor
7. Record          → .council/refactors/YYYY-MM-DD-<topic>.md
```

### 0. Preconditions
- **Scope**: a path, module, or diff. "The whole repo", or a branch over the size cap below → dispatch Recon first to rank hotspots (churn × complexity, with the smells it sees). Then ask the user to pick, with Recon's ranking in the question: each option carries its size, its main smell and its risk, one option is marked *(Recommended)*, and one is "all of them, one run each".
- **Clean working tree** (`.council/` excepted; the record is committed alongside Step 0) and a **green test run**.
- **Profile**: read `.council/project-profile.md` if present; offer `team-scan` if not (not required).
- **Proportionality**: for a scope under ~150 lines, write the Code Brief yourself (`templates.md` § *Code Brief*) instead of dispatching Recon, and run at most 2 tension pairs. The panel and the gate always run. Above ~3,000 lines, or more than one package, narrow the scope before dispatching the panel.

### 1. Recon → Code Brief
One agent writes the brief by `templates.md` § *Code Brief*. It must be able to write files: a general-purpose agent, or a code-exploration agent from the profile's Technical domain that has Write. The built-in `Explore` has no Write; if you use it, save its reply to the run folder yourself.

### 2. Round 1 — blind panel (parallel)
Dispatch all 6 in one message. In each prompt, resolve the role template's placeholders: `{PROJECT_PROFILE}` → the profile path (or "none"), `{SCOPE}` inline, `{CODE_BRIEF}` → the brief's path, `{FINDING_CARD_FORMAT}` → `templates.md` § *Finding Card*.

### 3. Round 2 — gate and tensions (parallel)
- **Minimalist gate**: `{ALL_FINDING_CARDS}` → the panelists' files. It returns `KEEP`, `SHRINK` or `KILL` per card and lists the cards independent panelists found. Its `KILL` is a gate, not a vote.
- **Tension pairs**: where two cards conflict (same code, opposite moves), send each side the other's card for one direct reply. Agreeing roles skip.

### 4. Synthesis
A separate synthesizer agent writes the backlog by `templates.md` § *Synthesis*, caps included.

### 5. CEO gate
**REQUIRED SUB-SKILL:** `team-ceo-view`. The gate writer builds and renders the page by § *Gate page*; you serve it and read the decisions block. The CEO approves steps (all, some, or edits) and decides every *Found, not fixed* item. An approved behavior fix is **not** a refactoring step: it runs after the refactor, as its own `fix:` commit, test-first (with the profile's TDD skill, if it lists one).

Then the record writer writes the record and the exec brief, and you hand off (`team-protocol`): *"`/clear`, then: execute the refactor in `<exec brief path>`."*

### 6. Execute
Start from the exec brief. Don't read the record or the run folder. Copy `templates.md` into a fresh run folder for the executors and the reviewer.

**Step 0 — safety net** (Safety Net): add characterization tests for every unpinned behavior the approved steps touch, run them green against the *untouched* code, then prove they bite: break the code deliberately (flip a rounding, a comparison, a constant), confirm a test fails, restore. Commit `test: characterize <scope>`.

Then group the approved steps into **Step Batches**: consecutive steps in backlog order, size S, touching overlapping files, at most 4 per batch. Any M or L step is a batch of one. Dispatch a **fresh executor** per batch with its Step Cards and the exec brief's header. It commits each step on its own, so Iron Laws 3 and 4 still hold per step.

Last, one reviewer agent runs § *Final review*. Every `fix` finding goes to a fresh executor with the reviewer's report and the Step Cards it names. It commits each fix as a `fixup!` of its step, so `git rebase --autosquash` folds it in before the push, and the reviewer re-checks only a fix that changed logic. Don't fix or dismiss findings yourself: your context is the most expensive one in the run.

### 7. Record
The record writer completes the record (§ *Record and exec brief*). Delete the exec brief and the run folder: anything worth keeping is in the record by now. Future refactors read past records first.

## Rationalizations

The shared ones are in `team-protocol`. These are the refactor's own.

| Excuse | Reality |
|--------|---------|
| "The user plans more providers, so an interface now is cheap" | One data point is a guess at an API. When the second one arrives you'll know its shape; adding the seam then costs the same. |
| "One file per concern is SRP" | Splitting 50 lines into 4 files creates shallow modules. SRP is about reasons to change, not file count. |
| "They said 'whatever, make it clean', so I can fix the rounding" | A vague aside isn't a decision on customer-facing money. Surface it, don't make the call. |
| "The tests pass, so it's safe" | Two tests on one branch pin nothing. Check the coverage map. |
| "This step is tiny, I'll fold it into the next commit" | Folded steps lose the ability to revert one cleanly. Batch steps in one executor, never in one commit. |
| "Parameterize and move are one gesture" | Two refactorings are two steps and two commits, so each one can be reverted alone. |
| "It went red, I'll just fix the test" | The test is the spec. Revert the step. |
| "It passed on a rerun, it's a flake" | Only a test the exec brief lists as a known flake. Any other red reverts. |
| "The linter trips on the moved code; one `eslint-disable` and it's green" | A silenced check lowers the bar the step is measured against. Revert, shrink the step, retry. |

## Red Flags — stop and return to the flow

- Writing an interface, base class, registry or plugin point with one implementation
- A commit message containing "and"
- Changing an expected value in an existing test
- A new `.skip`, `@ts-ignore`, `eslint-disable` or coverage ignore, or a threshold lowered in config
- A stub, an empty `catch` or a `TODO` where moved code used to be
- Editing a file outside the fence
- Reasoning "they'll need this later"
