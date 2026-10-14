# team-review templates

What each agent writes. The orchestrator copies this file into the run folder and points each agent to its section.

## Review Brief (Recon)

The *only* shared context for the seats, so four seats don't each re-read the same files. Under ~60 lines, plus the excerpts:
- **Scope**: the changed line ranges per file (`git diff --unified=0`), so seats can tell new code from old; the reviewed commit's full SHA; for an MR/PR, its refs (base, start, head SHAs) from the run folder.
- **Intent**, from the first that exists, with its source named: the MR/PR title and description and its linked ticket (`gh pr view <n> --json title,body`, `glab mr view <iid>`); the commit messages; a matching `.council/decisions/` record and its plan. None → write `Intent: none found`; the orchestrator asks the user.
- Quality-gate commands, **verbatim as you ran them**, each with its result. No placeholders: a command nobody ran is not a gate. Red is a result to report, not a reason to stop.
- **Coverage of the changed lines**: which are exercised by a test, which are not.
- Leads from the profile's tools (type checker, `npm audit`, `osv-scanner`, `semgrep`, `gitleaks`, dead-code tools), run on the scope. A lead is not a finding: a seat verifies each by hand before citing it.
- **Audit scope only**: the attack surface — entry points, authn/authz, input parsing, outbound calls.
- **Excerpts**: the changed code itself, with `file:line` headers, at most ~200 lines in all.

## Finding Card (seats)

At most 5 cards: the cap forces prioritization. Then a *For team-refactor* list (≤ 3 lines: what, where) of structural trouble you stumbled on, never a card.

```markdown
### <SEAT>-<n>: <defect> in <file:line>
- Lens: <correctness | error-handling | security | intent | tests | types | performance | conventions> (<the source from your Sources it comes from>)
- In diff: <yes | no (audit)>
- Scenario: <the concrete input, state or call where it breaks, and what happens>
- Evidence: <cited lines, opened in source, not only quoted from the Review Brief>
- Refutation: <what you checked that could have proved this wrong — the guard, the caller, the test — and what you found>
- Fix: <the fix; when it is an exact replacement of ≤ ~10 lines at one place, the line range and the new text verbatim: it becomes a one-click suggestion>
- Severity: <blocker | major | minor>
- Confidence: <high|med|low> (high only if you traced the path, can name where it bites, and the refutation failed; low never reaches the verifier)
```

- **Severity.** `blocker`: merging it loses money or data, opens a hole, or breaks a main path. `major`: wrong behavior on a real path, a swallowed error, new logic with no test. `minor`: names, conventions, a cost with no hot path.
- **Diff scope.** Only what the diff introduces or worsens. A defect in untouched code is one line under *Not raised*, after *For team-refactor*, never a card.

## Verdict (verifier)

One block per card in `{CARDS}`, in its order:

```markdown
### <card id>: CONFIRMED | REFUTED | UNSURE
- Checked: <what you looked at or ran>
- Found: <what it showed>
- Scenario: <for CONFIRMED: the concrete input and outcome>
```

- `CONFIRMED`: the refutation failed; name the scenario you traced or ran.
- `REFUTED`: name what contradicts the card (the guard, the caller's contract, the type, the test, the framework behavior, the config), with `file:line` or the command's output.
- `UNSURE`: neither. Say what would settle it.
- Never a new finding, even one you are sure of.

## Synthesis (synthesizer)

Under ~300 lines. The gate writer and the record writer read only this file, so it holds everything the gate page and the exec brief need.

```markdown
## Review — <scope>
Owner: <own branch | someone else's (<author>) | audit>. Reviewed commit: <full SHA>. Refs: <base, start, head SHAs, for an MR/PR>.
Intent: <source> — <one line>
Quality gates: <commands verbatim, each with its result>

### Verdict
<not mergeable | mergeable after fixes | mergeable> — <the rule that decided it, with the card ids>

### Findings
[Ranked blocker → major → minor, at most ~15. Each: the card's fields in full
(title, Lens, In diff, Scenario, Evidence, Fix, Severity), its seat, and the
verifier's verdict with its Checked, Found and Scenario lines]

### Refuted
[<card id> — what refuted it, from the verdict]

### Not raised
[One line each: UNSURE cards (now med), low cards, findings over the cap,
the seats' *Not raised* lines (defects outside the diff)]

### For team-refactor
[The seats' lines merged, at most ~5: what, where]
```

- **Verdicts.** `CONFIRMED` → *Findings*. `REFUTED` → *Refuted*. `UNSURE` → `med`, *Not raised*. `low` cards skip verification → *Not raised*.
- **Dedup.** Two cards on the same line → keep the more specific (error handling beats correctness for a swallowed catch), and credit both seats.
- **Rank** blocker → major → minor; within a severity, the scenario with the widest reach first.
- **Cap** at ~15 findings; the rest goes to *Not raised*. A gate with 30 findings gets rubber-stamped.
- **Verdict.** **Not mergeable** if any confirmed blocker; **mergeable after fixes** if any confirmed major; else **mergeable**.
- Copy the cards' fields; don't reword a scenario or re-rate a severity.

## Gate page (gate writer)

Build the page by `team-ceo-view`'s `contract.md`, from the synthesis, `kind: "review"`:
- `summary`: labelled bullets *Verdict*, *Blockers*, *Not raised*, *For team-refactor*, *Recommendation*. `source` is the review record, `.council/reviews/YYYY-MM-DD-<topic>.md`.
- **Each finding is a decision**, `id` its card id, `tags` its lens and severity, `detail` its evidence and scenario, `why` its stakes. Two options: **fix** (`recommended: true`, with its `brief`) and **leave** (`negative: true`, no brief: the human's note gives the reason).
- Blocker and major: major decisions, default fix. Minor: `minor: true, default: "fix"`.
- `at` on each finding: its file and line at the reviewed commit, as in its card.
- `suggestion` on a blocker or major finding whose card's fix is exact and ≤ ~10 lines at `at`. Never on a minor: a minor lands in the review body, where no suggestion applies.
- `needs` on a finding whose fix assumes another finding is fixed first.
- Refuted cards stay off the page: the record lists them.

Write the share fields by contract.md § *Share fields* on every review gate, whoever owns the branch. The record does not exist yet: the synthesis stands in for the review record that section says to read first. The fix briefs feed the exec brief too, so write each one as an executor would need it. Render the page until it passes.

## Record and exec brief (record writer)

From the synthesis, the gate JSON's fix briefs, and the decisions block or the share block:
- **The record**, `.council/reviews/YYYY-MM-DD-<topic>.md`, for humans and future reviews: scope, owner, intent source, status, every finding with its verifier verdict and the human's decision and note, the refuted cards with what refuted them, *Not raised*, *For team-refactor*. For an audit, each finding left is known debt with its reason, so the next audit does not reopen it.
  - Someone else's branch: from the synthesis and the share block, the human's curation (declined findings with their notes) and the share line from `team-ceo-view`'s *Share*. `Status: shared`. No exec brief.
  - Own branch, audit: `Status: approved, not executed`.
- **The exec brief**, `.council/reviews/YYYY-MM-DD-<topic>.exec.md`, for the executors and nothing else: a header (scope, the quality-gate commands copied verbatim, fences for the whole run), then one Fix card per approved finding, in order: blockers first, and a finding after any finding it `needs`. Each card comes from the finding's brief and the human's note. No debate, no declined items. Aim under ~150 lines.

After execution, from the executors' and the reviewer's reply lines: add the commits (hash and finding, one line each), the reverted or blocked fixes with their reason, and the reviewer's `note` findings under *Not raised*, for the next review. Set `Status: executed`.

## Fix card (record writer, executors)

```markdown
## Fix <id>: <defect> — <file:line>
Why: <scenario>
Test first: <the failing test to write, and the command that shows it red>
Do: <the brief's How>
Fence: <files and behaviors not to touch>. Format only the lines you change.
Verify: <commands>
Commit: fix(<scope>): <defect>
On red: revert the fix, report why, go on.
```

Executors run the cards in order. For each: write the test, run it and see it fail, fix, see it pass, run *Verify*, commit test and fix together. A test that passes before the fix means the scenario does not reproduce: don't fix, reply `blocked — does not reproduce`. Two exceptions, named in the card's *Test first*: a *tests* finding, where the test is the fix and may pass at once (`Commit: test(<scope>): …`); a finding with no behavior to pin (a rename, a type annotation), `Test first: none — <why>`, where *Verify* carries the type check. Commits follow the repo's convention when it differs. Reply with one line per finding: commit hash, or `blocked — <reason>`.

## Final review (reviewer)

Rerun the quality gates from the exec brief's header, then read the full diff against the exec brief:
- each commit fixes exactly its finding, with a test that failed before it (or the exception its card names);
- nothing smuggled in: no second finding in a commit, no refactoring its finding did not ask for, no formatting outside the changed lines;
- no check weakened: a lowered threshold, a skipped or deleted test, an assertion removed, an existing test's expected value changed without its finding saying so, a new `@ts-ignore`, `eslint-disable` or coverage ignore, a stub or empty `catch`.

Tag each finding `fix` or `note`, with the finding it belongs to.
