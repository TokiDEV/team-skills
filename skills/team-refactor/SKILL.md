---
name: team-refactor
description: Use when code needs refactoring, cleanup, or a design-quality review — god functions, tangled responsibilities, duplication, over-engineering, legacy code without tests, or code that resists the next change. Also when the user invokes Uncle Bob, Fowler, Beck, SOLID, KISS, YAGNI or clean code on existing code. Panel of refactoring masters with a KISS/YAGNI gate and a human approval gate.
---

# team-refactor

A panel of refactoring masters reviews a scoped piece of code in **isolated contexts**, a KISS/YAGNI gate kills speculative work, the human (CEO) approves a backlog, then execution happens in tiny behavior-preserving steps. Same family as `team-council`: evidence-backed, attributed, recorded under `.council/`.

**Core principle:** refactoring changes structure, never behavior. Everything else in this skill protects that line or keeps the refactoring from becoming its own over-engineering.

## Iron Laws

1. **Behavior-preserving only.** Any observable change — outputs, rounding, error types, side effects, call order, emails, logs relied on — is a *Found, not fixed* item for the CEO. It is never a backlog step, even if the user said "fix it while you're there" or "whatever, make it clean".
2. **No safety net, no refactor.** Code the step touches must be pinned by tests first, and the tests must be proven to bite (see Step 0).
3. **One named refactoring per commit.** Structure and behavior never share a commit (Beck, *Tidy First*).
4. **Red means revert.** A failing gate after a step → `git checkout` the step, shrink it, retry. Never debug forward.
5. **An abstraction needs a present second case.** Roadmap talk ("we plan to add providers"), TODOs, and "might" are not cases. Two real call sites today, or it doesn't exist.
6. **Stay inside the approved scope.** No drive-by edits outside the files and steps the CEO approved.

**Violating the letter of these laws is violating their spirit.**

## The Panel

Templates in `roles/`. A project may override any role via `.council/role-overrides/role-<name>.md` (project wins). Each role is a *lens on a body of work*, not an impersonation.

| Role | Canon | Signature question | Owns |
|------|-------|--------------------|------|
| **Uncle Bob** (`role-uncle-bob.md`) | Clean Code, Clean Architecture, SOLID | "How many reasons does this have to change?" | Responsibilities, naming, dependency direction |
| **Fowler** (`role-fowler.md`) | *Refactoring* (2nd ed.), smell catalog | "Which smell, and which named refactoring removes it?" | Vocabulary, mechanics |
| **Beck** (`role-beck.md`) | Simple Design, *Tidy First*, TDD | "What change is coming, and what tidying makes it easy?" | Sequencing, step size |
| **Feathers** (`role-feathers.md`) | *Working Effectively with Legacy Code* | "How do we get this under test before we touch it?" | Safety net, seams |
| **Ousterhout** (`role-ousterhout.md`) | *A Philosophy of Software Design* | "Is the interface simpler than what it hides?" | Depth; counterweight to over-splitting |
| **Minimalist** (`role-minimalist.md`) | KISS, YAGNI, Metz, Rule of Three, Gall | "What breaks if we don't do this?" | **The gate** |

Built-in tensions worth surfacing, not smoothing: Uncle Bob's small functions ↔ Ousterhout's deep modules; Uncle Bob/Fowler's abstractions ↔ Minimalist's deletion.

## Separation of Context

Every agent gets the minimum it needs and nothing else. This is what makes the panel a panel instead of one opinion wearing six costumes.

| Agent | Receives | Never receives |
|-------|----------|----------------|
| Recon | scope, profile | — |
| Panelist (R1) | role template + Code Brief + Finding Card format | other panelists' output, conversation history |
| Minimalist gate (R2) | all Finding Cards | full R1 transcripts |
| Tension pair (R2) | own + counterpart's cards only | the rest |
| Synthesizer | cards + verdicts + tension replies | raw transcripts |
| Executor | **one** Step Card + brief | other steps, the debate |

Never play the roles yourself in one context. Dispatch them.

## Flow

```
0. Preconditions   → scope, clean tree, green tests, profile
1. Recon           → Code Brief (one agent)
2. Round 1 (blind) → 6 panelists in parallel → Finding Cards
3. Round 2         → Minimalist gate on every card + tension pairs
4. Synthesis       → Backlog + Found-not-fixed + Rejected + Tensions
5. CEO gate        → approves steps, decides each anomaly
6. Execute         → Step 0 safety net, then one step per fresh executor, gated
7. Record          → .council/refactors/YYYY-MM-DD-<topic>.md
```

### 0. Preconditions
- **Scope**: a path, module, or diff. "The whole repo" → ask the user to narrow it, or have Recon rank hotspots (churn × complexity) and propose the top one.
- **Clean working tree** (`.council/` excepted; the record is committed alongside Step 0) and a **green test run**. Record the exact test/lint/typecheck commands.
- **Profile**: read `.council/project-profile.md` if present; offer `team-scan` if not (not required).
- **Proportionality**: for a scope under ~150 lines, the orchestrator writes the Code Brief itself instead of dispatching Recon, and runs at most 2 tension pairs. The panel and the gate always run.

### 1. Recon → Code Brief
One read-only agent (`deep-explore`/`Explore` if available) writes the brief — the *only* shared context for the panel. Keep it under ~60 lines:
- Files in scope with line counts; public API and its callers (outside-in)
- **Coverage map**: which branches/behaviors tests pin, which are unpinned
- Hotspots: `git log` churn for these files
- Quality-gate commands
- Upcoming change, if the user named one (Beck sequences toward it)

### 2. Round 1 — blind panel (parallel)
Dispatch all 6 in one message. Fill each template's placeholders: `{PROJECT_PROFILE}` (or "none"), `{SCOPE}`, `{CODE_BRIEF}`, `{FINDING_CARD_FORMAT}` (the block below). Each reads the code itself (read-only) and returns **at most 5 Finding Cards**, plus a *Leave alone* list and any *Behavior anomalies* spotted. The cap forces prioritization. Feathers also returns the **Step 0 safety-net spec**.

```markdown
### <ROLE>-<n>: <Smell name> in <file:lines>
- Principle: <SRP | OCP | DIP | Simple Design rule | Depth | KISS | YAGNI | ...>
- Evidence: <cited lines; what in the code shows it>
- Refactoring: <named: Extract Function, Replace Conditional with Polymorphism, Guard Clause, Inline Class, Remove Dead Code, Sprout Method...>
- Payoff: <a concrete, present gain — "adding a customer type touches 1 place instead of 3". Not "cleaner", not "more extensible">
- Cost/risk: <S|M|L> — <what could break>
- Safety net: <pinned by <tests> | needs characterization of <behavior>>
- Confidence: <high|med|low>
```

### 3. Round 2 — gate and tensions (parallel)
- **Minimalist gate** (its Round 2 job, `{ALL_FINDING_CARDS}` filled) sees every card and returns one line each: `KEEP` | `SHRINK → <smaller version>` | `KILL — <reason>`. Kill test: no present pain removed, no second real use today, no faster read afterwards, not deeper than what it replaces.
- **Tension pairs**: where two cards conflict (same code, opposite moves), send each side the other's card for one direct reply. Agreeing roles skip.

### 4. Synthesis
A separate synthesizer agent produces:

```markdown
## Refactoring Backlog — <scope>

### Steps (in order)
Step 0 is always the safety net. Then Beck's order: tidyings that make
the next change easy → structural moves → deletions.
| # | Named refactoring | Target | From cards | Size |

### Found, not fixed — top 5 by stakes (CEO decides each; default = leave as-is)
[Money, public contract, user-visible output, data. Anything the user asked
about goes first. Each: current behavior, concrete impact, options]

### Minor quirks (pinned as-is by Step 0, no decision needed)
[One line each: edge-case coercions, cosmetic output, stub behavior]

### Considered and rejected
[Card id — gate reason. Kept so the next refactor doesn't relitigate it]

### Tensions for the CEO — at most 3
[Only tensions that change what gets executed. Strongest version of each side, and a suggested default]
```

The caps are the synthesizer's job, not the CEO's: a gate with 13 findings and 4 tensions gets rubber-stamped.

Architecture-level questions (new layers, changing a public contract) → recommend `team-council` instead of deciding here.

### 5. CEO gate
**REQUIRED SUB-SKILL:** use `team-ceo-view` to present the backlog as a local HTML decision page. The *Found, not fixed* items, optional steps and tensions are major decisions; minor quirks are `minor: true, default: "leave"`. Include before/after `code` for every step. Give each weighty item `for`/`against` drawn from the panelists' cards and the Minimalist's verdict, with each point credited to its author. Put each metric on the step it measures, and each screenshot on the finding it shows. Tensions and gate-rejected cards go in `tensions` and `rejected`, so the CEO can side or revive. Write `summary` as labelled bullets: *Verdict*, *Weak spots*, *Found, not fixed*, *Recommendation*. Set `source` to the refactor record. Record the pasted decisions in the `.md`. The CEO approves steps (all, some, or edits) and decides every *Found, not fixed* item. An approved behavior fix is **not** a refactoring step: it runs after the refactor, as its own `fix:` commit, test-first (superpowers:test-driven-development).

### 6. Execute
**Step 0 — safety net** (Feathers): add characterization tests for every unpinned behavior the approved steps touch, run them green against the *untouched* code, then prove they bite: break the code deliberately (flip a rounding, a comparison, a constant), confirm a test fails, restore. Commit `test: characterize <scope>`.

Then, for each approved step, dispatch a **fresh executor** with this Step Card:

```markdown
## Step <n>: <Named refactoring> — <target>
Why: <card ids + principle>
Do: <1–5 bullets of mechanics>
Fence: <files and behaviors not to touch>
Verify: <exact test/lint/typecheck commands>
Commit: refactor(<scope>): <Named refactoring> in <target>
On red: revert the step, report why, stop.
```

Between steps, the orchestrator runs the gates itself. Last, one reviewer agent reads the full diff against the approved backlog: nothing smuggled in, nothing behavioral, no step skipped.

### 7. Record
Write `.council/refactors/YYYY-MM-DD-<topic>.md`: brief, backlog, CEO decisions, commits, rejected items, open anomalies. Future refactors read past records first.

## Rationalizations

| Excuse | Reality |
|--------|---------|
| "The user plans more providers, so an interface now is cheap" | One data point is a guess at an API. When the second one arrives you'll know its shape; adding the seam then costs the same. |
| "One file per concern is SRP" | Splitting 50 lines into 4 files creates shallow modules. SRP is about reasons to change, not file count. |
| "They said 'whatever, make it clean', so I can fix the rounding" | A vague aside isn't a decision on customer-facing money. Surface it, don't make the call. |
| "I'll play the roles myself, it's faster" | One context gives one opinion. You'll get "all three agree" and no tension. |
| "The tests pass, so it's safe" | Two tests on one branch pin nothing. Check the coverage map. |
| "This step is tiny, I'll batch it with the next" | Batched steps lose the ability to revert one cleanly. |
| "It went red, I'll just fix the test" | The test is the spec. Revert the step. |

## Red Flags — stop and return to the flow

- Writing an interface, base class, registry or plugin point with one implementation
- A commit message containing "and"
- Changing an expected value in an existing test
- Editing a file outside the fence
- Reasoning "they'll need this later"
- Panel output where every role agrees on everything
