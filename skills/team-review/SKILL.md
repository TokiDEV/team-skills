---
name: team-review
description: Use when a change needs reviewing before it merges — a merge or pull request, a branch (yours or a colleague's), or an audit of a path or module for bugs, security holes, swallowed errors, missing tests, slow paths or a gap with what was asked. Also when the user asks for a code review, a security review, or whether a branch is ready to merge. Not for restructuring code that works: team-refactor.
---

# team-review

A panel of four seats reviews a diff, a path or a module in **isolated contexts**, a verifier tries to refute every finding before it reaches the human, and the human (CEO) curates the findings on a gate page: then shares them as a review on the merge/pull request, or has them fixed test-first. Same family as `team-refactor`: evidence-backed, attributed, recorded under `.council/reviews/`.

**Core principle:** a finding reaches the human only after an agent other than its author tried to prove it wrong. A review that cries wolf gets ignored.

**REQUIRED BACKGROUND:** follow `team-protocol` for dispatch, writers, the run folder, the agent contract, counting positions, code scope, the handoff, execution and weakened checks.

## Lanes

| Skill | Question | When |
|-------|----------|------|
| `team-council` | Which way do we go? | Before the code exists |
| `team-council-plan` | How do we carry out the decision? | After a council decision, before the code |
| `team-refactor` | Is this code shaped for the next change? | Code exists; fixes preserve behavior |
| **`team-review`** | Can this change merge as is? | Code exists; fixes change behavior |

**The fix decides the lane, not the topic.** A fix that changes behavior (a bug, a hole, a swallowed error, a missing test for new or changed behavior, a gap with the request, a slow path) is review's; a characterization test of unchanged behavior is refactor's (its Step 0). A named, behavior-preserving refactoring is refactor's. A misleading name the diff introduces is review's (a one-click rename); moving or extracting code to fix it is refactor's.

**Hunting vs stumbling.** The seats hunt only in this lane. Structural trouble they stumble on goes to one *For team-refactor* list (≤ ~5 lines, unverified, no decision, no extra agent).

## Iron Laws

1. **A finding names a scenario, or it is not a finding.** The concrete input, state or call where it breaks, and what happens then.
2. **Only the verifier confirms.** A card its author alone believes is `med` at most, and only a `CONFIRMED` card reaches the gate.
3. **Diff scope flags only what the diff introduces or worsens.** A defect in untouched code is one line in *Not raised*, never a card.
4. **Structure is refactor's.** No card for duplication, dead code, cycles or design: one line under *For team-refactor*.
5. **Fix test-first, one finding per commit.** A test that reproduces the defect fails, the fix makes it pass, one commit carries both (exceptions: `templates.md` § *Fix card*).
6. **The human submits a review; Claude never posts one.** A shared review stays pending until the human submits it.

**Violating the letter of these laws is violating their spirit.**

Laws 3 and 4 are the master text of the diff-scope and structure lines every seat file repeats (a role file is its agent's whole prompt). Change them here first, then in each seat's `roles/role-*.md`.

## The Panel

Templates in `roles/` (overridable per project, see `team-protocol`). Each role is a *lens on a body of work*, not an impersonation.

| Role | Sources (a sample; all in the role file) | Signature question | Owns |
|------|-------|--------------------|------|
| **Correctness** (`role-correctness.md`) | Hoare, Dijkstra, Nygard, Armstrong | "Does it work, and when it fails, does it show?" | Correctness, error handling |
| **Security** (`role-security.md`) | OWASP, Saltzer & Schroeder, Shostack, CWE Top 25 | "Is it exploitable?" | Security |
| **Intent** (`role-intent.md`) | Adzic, North, Beck, DeMillo et al. | "Is it what was asked, and is it pinned?" | Intent conformance, tests |
| **Craft** (`role-craft.md`) | Minsky, King, Gregg, Knuth, Kernighan & Pike | "Does it fit this code?" | Types, performance, conventions |
| **Verifier** (`role-verifier.md`) | Popper, Feynman | "What would prove this card wrong?" | **The refutation** |

Card IDs carry the seat's prefix: CR, SE, IN, CF; the verifier's verdicts are keyed by card id.

## Separation of Context

Every agent gets the minimum it needs (`team-protocol` § *Dispatch*). `templates.md` (copied into the run folder, see `team-protocol`) holds what each one writes.

| Agent | Model | Tool budget | Receives | Writes by `templates.md` |
|-------|-------|-------------|----------|--------------------------|
| Recon | sonnet | ~30 | scope, profile | *Review Brief* |
| Seat ×4 (R1) | sonnet | ~15 | role file + Review Brief | *Finding Card* |
| Verifier | opus | ~25 | `{CARDS}` + read access to the code | *Verdict* |
| Synthesizer | sonnet | ~10 | cards + verdicts | *Synthesis* |
| Gate writer | sonnet | ~12 | the synthesis | *Gate page* |
| Record writer | sonnet | ~8 | the synthesis + the gate's fix briefs + the decisions or share block | *Record and exec brief* |
| Executor | sonnet | — | **one** batch of Fix cards + the exec brief's header | *Fix card* |
| Final reviewer | opus | — | full diff + exec brief | *Final review* |

The verifier receives each card's title, location, scenario and fix — never its Evidence or Refutation lines. Put this line first in each seat's *How to work* block: `- Start from the Review Brief. Open a file only to confirm or cite evidence.` Seats and the verifier also get `team-protocol`'s *leave the project tree as you found it* line.

## Flow

```
0. Preconditions   → scope, whose branch, profile
1. Recon           → Review Brief (one agent)
2. Round 1 (blind) → 4 seats in parallel → Finding Cards
3. Verification    → the verifier tries to refute each high/med card
4. Synthesis       → dedup, rank, cap, verdict
5. Gate            → team-ceo-view page (kind "review")
6. Deliver         → someone else's branch: share a review │ own branch, audit: fix test-first
```

### 0. Preconditions
- **Scope**: a diff (a branch, an MR/PR), a path or module, or the whole repo, sized by `team-protocol` § *Code scope*, counting changed lines. To narrow it, Recon ranks zones by churn × complexity × exposure, one option per zone. Review a diff at its head: check it out first. Someone else's branch goes in a separate worktree (`git -C <repo> worktree add <path> <branch>`), not by switching the user's checkout; a dirty tree is never stashed or touched.
- **Owner**: `git -C <checkout> log --format=%ae <base>..HEAD | sort -u` against `git -C <checkout> config user.email`. Only yours → own branch; none yours → someone else's; mixed, or a shared account → ask. A path or module → audit.
- **MR/PR**: take the host from `git -C <checkout> remote get-url origin` (`<origin URL>`). GitHub: `gh pr view <branch> -R <owner/repo> --json number,headRefOid,baseRefName`; GitLab: `glab mr view <branch> -R <origin URL> --output json` (the `iid`). Then get its refs and diff with the commands of team-ceo-view's SKILL.md, *Share* → `as: review` → *Refs and diff*, writing the diff to the run folder instead of `$TMPDIR`. Recon reads them from there.
- **Profile**: read `.council/project-profile.md` if present; offer `team-scan` if not (not required).
- **Red tests do not block.** Recon records them; they become a finding.

### 1. Recon → Review Brief
One agent writes the brief by `templates.md` § *Review Brief*, following the Recon rules of `team-protocol` § *Code scope*. If the brief says *Intent: none found*, ask the user what the change is for and append the answer to the brief before Round 1.

### 2. Round 1 — blind seats (parallel)
Dispatch all 4 in one message, agent ids `seat-correctness`, `seat-security`, `seat-intent`, `seat-craft`. In each prompt, resolve the role template's placeholders: `{PROJECT_PROFILE}` → the profile path (or "none"), `{SCOPE}` inline, `{REVIEW_BRIEF}` → the brief's path, `{FINDING_CARD_FORMAT}` → `templates.md` § *Finding Card*.

### 3. Verification
Strip the cards of their reasoning without reading them: one Bash call keeps each `high` and `med` card's title, *Scenario* and *Fix*, and drops `low` cards:
```bash
awk 'FNR==1{f=0} /^(```|~~~)/{f=!f} !f&&/^### [A-Z][A-Z]-[0-9]/{if(c!=""&&!low)print c "\n"; c=$0; low=0; keep=0; next} !f&&/^#{2,3} /{keep=0} !f&&/^- \*\*[A-Z][a-z]+(:\*\*|\*\*:)/{sub(/^- \*\*/,"- ");sub(/(:\*\*|\*\*:)/,":")} !f&&/^- [A-Z][a-z]+:/{keep=/^- (Scenario|Fix):/} !f&&/^- Confidence: *`?low/{low=1} keep{c=c "\n" $0} END{if(c!=""&&!low)print c}' <run folder>/seat-*.md > <run folder>/cards.md
R=<run folder>; h=$(grep -c '^### [A-Z][A-Z]-' $R/cards.md); s=$(grep -c '^- Scenario:' $R/cards.md); x=$(grep -c '^- Fix:' $R/cards.md); [ "$h" = "$s" ] && [ "$h" = "$x" ] && echo "cards ok: $h" || echo "MISMATCH: $h headings, $s Scenario, $x Fix"
```
Fences and bold fields are handled. On `MISMATCH`, stop: fix the seat file or re-dispatch that seat, then rerun both. On `cards ok: 0` there is nothing to verify: skip to Synthesis. Otherwise dispatch the verifier with `{PROJECT_PROFILE}`, `{SCOPE}` and `{CARDS}` → `cards.md`. It writes one verdict per card by § *Verdict*: `CONFIRMED`, `REFUTED` or `UNSURE`. It never proposes a finding.

### 4. Synthesis
A separate synthesizer agent writes the review by `templates.md` § *Synthesis*: dedup, rank, cap, verdict.

### 5. Gate
**REQUIRED SUB-SKILL:** `team-ceo-view`. The gate writer builds and renders the page by § *Gate page*; it is share-ready whoever owns the branch. Serve it with `--channels` as team-ceo-view's SKILL.md step 3 says.

### 6. Deliver
**Someone else's branch.** The human curates on the page (declines false positives, adds notes), then clicks **Share → Review**: follow team-ceo-view's *Share*. An `auto-accept` run (`team-protocol` § *Auto-accept*) does not change this: the gate still goes to its owner. A declined finding is not posted; the review body carries the verdict, *Not raised* and *For team-refactor*. When you tell the human to submit, suggest *Request changes* (a confirmed blocker or major) or *Comment* from the verdict. The record writer writes the record from the synthesis and the share block, `Status: shared`; no exec brief, no execution. Delete the run folder.

**Own branch, audit.** Read the decisions block (team-ceo-view steps 4–5). The record writer writes the record and the exec brief. When the page returns a share block instead of a decisions block, proceed as for someone else's branch: follow team-ceo-view's *Share*; the record writer records `Status: shared`; no exec brief, no execution. Otherwise hand off (`team-protocol` § *Handoff*), whatever the number of fixes: *"`/clear`, then: execute the review fixes in `<exec brief path>`."*

**Execute** by `team-protocol` § *Execution*, from the exec brief, on a clean tree. The steps are the Fix cards; each executor (sonnet) gets its batch's Fix cards and the exec brief's header. Each fix goes test-first (`superpowers:test-driven-development`, or the profile's TDD skill when it lists one), one commit per finding; the executor replies one line per finding: the commit hash, or `blocked — <reason>`. After each batch, run the exec brief's quality gates: red → `git revert` that fix's commit yourself (a revert is not a patch), report it, and go on with the next batch.

Last, the final reviewer runs § *Final review*. Its `fix` findings go to fresh executors as `fixup!` commits of their finding's commit (`team-protocol` § *Execution*), each with the Fix card it names. The record writer completes the record (`Status: executed`). Delete the exec brief and the run folder. Future reviews read past records first: an audit's known debt is not reopened.

## Proportionality

By `team-protocol` § *Code scope*, counting changed lines, the brief being the Review Brief (`templates.md` § *Review Brief*). The 4 seats and the verifier always run: a small diff is where a confident wrong finding costs the most trust.

## Rationalizations

The shared ones are in `team-protocol`. These are the review's own.

| Excuse | Reality |
|--------|---------|
| "The seat is sure, skip the verifier" | The author's certainty is the bias the verifier exists for. |
| "It's pre-existing but bad, flag it" | Diff scope: once in *Not raised*, never a card. |
| "This function does too much, it's a finding" | Structure is refactor's: *For team-refactor*. |
| "Post the review, the human will read it anyway" | The human submits; Claude never posts a review. |
| "Fix it while we're there" (someone else's branch) | Their branch, their call: share, don't push. |
| "The tests are red, stop the review" | Red is a finding, not a blocker for the review. |
| "The fix is obvious, the test can come after" | A test written after the fix never failed: it proves nothing about the defect. |
| "The verifier was unsure, but I'd keep it" | `UNSURE` goes to *Not raised*. The gate shows only what survived a refutation. |
| "Only two fixes, I'll run them here" | The gate's session holds the whole review, and every executor dispatch re-reads it. Own branch and audit always hand off. |

## Red Flags — stop and re-read the laws

- A card without a scenario
- A card marked `high` that the verifier never saw
- A thread on a line outside the diff
- A review posted (not pending)
- A fix commit carrying two findings, or a refactoring its finding did not ask for
- A behavior fix whose test passed before the fix
- Reading a seat's file to "help" the verifier
