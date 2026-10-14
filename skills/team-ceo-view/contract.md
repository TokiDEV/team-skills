# CEO page contract

For the agent that writes a gate's JSON. Your dispatch gives the gate's path, its `source` record, the calling skill's mapping (what each part of the synthesis becomes on the page), and the `render.js` command.

- **Show the destination.** Fill `outcome` (see *Outcome*) before the cards: the human approves where the work lands, not a list of steps.
- **Evidence goes on the item it supports.** Arguments, metrics, code and figures belong to the decision, tension or rejected item they concern, never to a page-level section. Copy every screenshot an item relies on into `.council/gates/YYYY-MM-DD-<topic>/`: scratchpad and `/tmp` are wiped after the session.
- **Render until it passes.** Run the `render.js` command you were given. It rejects invalid JSON with a list of errors. It also rejects any item whose text mentions a screenshot or "figure N" but carries no `figures`. Fix and re-run until it passes.

## Triage before you render

The page is for decisions, not an inventory. Before writing the JSON:
- **One question, one card.** Settle every open question by `counting.md`: a majority goes in `decisions`, no majority goes in `tensions`, never both. The count goes in the item's `tags`. Two cards where a choice on one makes the other moot are one question: merge them into one card whose options are the coherent combinations. Cards that only rely on each other stay separate and carry `needs`.
- **At most ~7 weighty decisions.** These are what the human must actually weigh: anything touching money, contracts or users, and tensions. Routine items with a clear recommendation (backlog steps, plan steps) don't count toward the cap; **Accept recommended** handles them in one click. On a review gate, a finding whose recommended fix no seat and no verifier contests is routine, whatever its severity: it stays a decision card, which **Accept recommended** handles like any routine item, and does not count toward the cap.
- **Everything else is `minor: true` with a `default`.** Edge-case quirks and cosmetic items fold into a collapsed block with their default already applied.
- **Order by stakes.** The item the human explicitly asked about goes first.

## Outcome

`outcome` is one entry per view the work changes. The renderer rejects a `plan` or `kickoff` page without it. Include it on a `council` page when the recommended direction changes a screen or the system's shape, and on a `refactor` page when module boundaries move.

| `view` | Use it when | `after` is | `before` is |
|--------|-------------|------------|-------------|
| `ui` | a user sees something different | a wireframe of the target screen: real layout, real labels, sample data from the domain | a screenshot of today's screen |
| `system` | components, APIs, data flow, jobs or a workflow change | the target architecture (boxes = components, arrows = calls or data), or the target workflow as a sequence | the same diagram, today |

- `after` is required. `before` goes in whenever something exists today; a kickoff has none.
- `caption` (required): one line naming what changed, e.g. "Discount line moves under the subtotal; nothing else moves".
- Both views when both change. A figure is `{ "svg" }` or `{ "src" }` (rules below). A `.svg` file given as `src` is inlined, so an agent can write the sketch to the gate folder and point to it.

**Before drawing any figure** (an outcome or an item's), read `figures.md` (your dispatch says where). It says whether to draw at all, picks the diagram type for what the figure shows, and holds the drawing rules, including the before/after grammar for a pair.

## Writing an item

Each field has one job, so no two say the same thing:

| Field | Its job | Shape |
|-------|---------|-------|
| `title` | The question (when `options` are custom) or the move (Approve/Decline) | ≤ 8 words |
| `detail` | The facts the title lacks: what is true today and what it costs | ≤ 3 bullets (4 is the hard limit), ≤ 120 characters each, or one sentence; ≤ 240 characters in all |
| `why` | Why a human must decide it | One line; ≤ 160 characters |
| `options` | The answers, each a different outcome | ≤ 5 words each |

**An item that corrects a premise** (something the human answered, or an earlier record states) carries the tag `corrects <premise>`, e.g. `corrects answer 9`. Its `why` reads: *"You said <premise>; the code shows <fact>."* In plain words, no identifiers, a few words each so it fits the 160-character `why`; the rest goes in `detail`.

`detail` and `why` take an array of bullets, or a string whose `- ` lines become bullets. Inline `` `code` `` and `**bold**` are rendered; put the key number in bold.

```json
{ "id": "F1", "title": "Gold discount rounding",
  "detail": ["Gold floors the 10 % discount; other tiers round", "49.95 € order: **4.99 €** off instead of **5.00 €**"],
  "why": "Changes invoices customers already received.",
  "options": [ { "value": "keep", "label": "Keep floor + comment" }, { "value": "round", "label": "Round like other tiers" } ] }
```

The renderer rejects a `detail` or `why` over its length, with more than 4 bullets or a bullet over 120 characters, a `detail` that opens with the title, an option label that repeats the title, and a `detail` that holds every word of an option label.

## JSON contract

```json
{
  "kind": "refactor | council | plan | kickoff | review",
  "title": "Refactoring backlog — src/invoice.js",
  "date": "2026-09-26",
  "source": ".council/refactors/2026-09-26-invoice.md",
  "summary": [
    { "label": "Verdict", "text": "One line: what is being decided and the overall call." },
    { "label": "Weak spots", "points": ["Three copies of the tax rule", "Dead exportCsv()"] },
    { "label": "Recommendation", "points": ["Approve S1–S4", "Run team-review on src/invoice.js before executing"] }
  ],
  "outcome": [
    { "view": "system", "title": "invoice.js after the steps", "caption": "Tier switch leaves as computeDiscount(); tax is one constant",
      "before": { "src": "2026-09-26-invoice/system-before.svg" }, "after": { "src": "2026-09-26-invoice/system-after.svg" } }
  ],
  "decisions": [
    {
      "id": "S1", "group": "Backlog", "title": "Extract Function: computeDiscount(tier, total)",
      "at": { "path": "src/invoice.js", "line": 42 },
      "tags": ["structure", "no behavior change"],
      "detail": ["The tier switch sits inline in `buildInvoice`, 28 lines deep", "Extracting it leaves **3** branches to read (figure 1)"],
      "why": "Every later step reads the discount rule from one place.",
      "for": [ { "who": "Mechanics", "point": "A named function can be tested without building a whole invoice." } ],
      "against": [ { "who": "Minimalist", "point": "One caller today; the inline switch is still readable." } ],
      "metrics": [ { "label": "buildInvoice length", "before": 64, "after": 36, "better": "lower" } ],
      "code": { "before": "switch (tier) { case 'gold': … }", "after": "const discount = computeDiscount(tier, total)" },
      "figures": [ { "src": "2026-09-26-invoice/s1-calls.svg", "caption": "Figure 1 — buildInvoice calls computeDiscount once" } ],
      "needs": ["S0"],
      "options": [
        { "value": "extract", "label": "Extract now", "recommended": true },
        { "value": "later", "label": "Leave for the next run", "negative": true }
      ]
    },
    { "id": "S3", "group": "Backlog", "title": "Rename Variable: grand → total", "needs": ["S0"], "minor": true, "default": "approve" }
  ],
  "tensions": [
    { "id": "T1", "topic": "Extract buildInvoice?", "sides": [
      { "who": "Responsibilities + Depth", "position": "Strongest case for…" },
      { "who": "Minimalist", "position": "Strongest case against…", "recommended": true } ] }
  ],
  "rejected": [ { "id": "DP-3", "title": "Per-type rule table", "reason": "One use; hides the floor quirk" } ],
  "figures": [ { "title": "Vote spread", "svg": "<svg viewBox='0 0 800 160'>…</svg>" } ]
}
```

## Field rules
- Only `title` and `decisions` (each with `id` and `title`) are required, plus `outcome` for `plan` and `kickoff`. Ids are unique across decisions, tensions and rejected items.
- `summary` is a list of bullets, never a paragraph. Each bullet is a string or a `{ "label", "text" }` / `{ "label", "points": [...] }` object. Aim for 3–5 labelled bullets, and end with the recommendation. The renderer rejects a string summary.
- **Every item** (decision, tension, rejected) accepts `detail`, `why`, `tags`, `for`, `against`, `metrics`, `code`, `figures`, `options` and `default`.
- `for` / `against`: the arguments, each attributed to the role that made it, as `{ "who", "point" }`, one concrete sentence each. Give every weighty item both columns. An empty `against` shows as "No argument raised", which is itself information. Only use arguments the panel actually made.
- `needs`: ids of the items this one relies on, such as refactoring steps that rely on the characterization tests, or a step built on an earlier one. A reliance, not a hard requirement: the page shows the link both ways and flags a chosen item whose needs are not chosen, and Claude asks about it before acting. Unknown ids are rejected.
- `at`: `{ "path", "line" }`, where the card's code is (repo-relative path, line at the reviewed commit), on decisions and tensions. It anchors the card when the gate is shared as a review on the merge/pull request; a card without it goes in the review's body.
- `suggestion`: `{ "lines", "text" }`, on an item or one of its options: the exact replacement for the `lines` lines starting at `at.line`, up to ~10 lines. Only for a small, certain fix on lines the change touches (a rename, a constant, a guard), written from the reviewed commit: the reader applies it in one click from the review, as written, so never guess. Anything bigger stays in the brief.
- `options` defaults to Approve/Decline. Set `"recommended": "decline"` on the decision to recommend declining.
- **Tensions** hold only questions with no majority (see *Triage*). They get their id from their position (`T1`, `T2`…) unless you set `id`. Their default options are "Side with <who>" for each side, plus Defer. Mark the recommended side with `"recommended": true` on that side.
- **Rejected** items default to *Keep rejected* (pre-applied) or *Revive*, and `reason` is shown on the card.
- `metrics` show as before→after chips on their card. `better` (`higher` or `lower`) colors the change green or red. Page-level `metrics` are rejected by the renderer.
- `code` is shown as before/after panes. Include it for every step that moves code, and keep each pane to about 15 lines.
- `figures` entries take either `svg` or `src`:
  - `src` points to an image such as a screenshot. It must be **relative to the JSON file**; absolute, `/tmp` and URL paths are rejected. The renderer embeds the image, so the `.html` stays one file. A click opens it full size. The caption says what to look at, e.g. "knob 17.6 kHz, graph still at 1 kHz". (`images` is accepted as an old name for `figures`.)
  - `svg` is trusted inline SVG. The page is dark: use `currentColor` for strokes and text, and no light fills. Make the `viewBox` about 700–900 units wide with `font-size` 12–13, so the text renders at reading size; a narrower viewBox gets scaled up.
- A figure shows what the human decides on: the result (`outcome`), or evidence for one item (a screenshot, a before/after of one module, a vote spread). Draw it by `figures.md`. The order the work runs in is the executor's concern, so a step dependency graph or a timeline has no place on the page.
- Page-level `figures` are only for evidence that spans many items (it shows under the outcome). Anything about one item goes on that item.

## Share fields

A review gate (kind "review") is always share-ready: its gate writer writes these fields with the rest of the page. Other gates leave them out; the local page ignores them.

The reader is someone else, typically the owner of the branch the review looked at. They may not have team-skills, they saw none of the review, and they paste the page's prompt into their own coding agent (Claude Code, Codex, Cursor…). Write every field for them.

**Read first**
- The review record: it holds the mechanics (files, lines, verify commands) that the cards leave out.
- `git -C <checkout> rev-parse --abbrev-ref HEAD` and `git -C <checkout> rev-parse HEAD`.
- The checkout's agent instructions (`AGENTS.md`, `CLAUDE.md` or similar) and contributing docs, for the commit convention and the test commands. Don't assume the reader's agent is Claude.

**`lang`**: `"fr"` or `"en"`, the conversation's language. Write `preamble` and every brief in it.

**`preamble`** (Markdown), in this order:
- Only what holds whatever the reader chooses. A rule about one finding ("run the Docker test for F3") goes in that finding's brief, or in `needs`.
- `# Mission:` one line.
- **Context**: the repo, the branch, the reviewed commit's full SHA, and the scope as a list of files relative to the repo root.
- **Baseline**: which tests are green and how many, the command for each, known failures that come from the environment.
- **Rules**: each fix gets a failing test first that reproduces the finding, then the fix; one finding per commit, in the repo's commit convention; never change an existing test's expected value unless the finding says so; don't push.
- Last line: "If `HEAD` is not `<short SHA>`, the branch has moved since the review: find code by symbol, not by line number, and tell me what differs."

**`brief`** (Markdown), on the `fix` option of each finding. The `leave` option is `"negative": true` and has no brief. Each brief is written for someone who saw none of the review:
- **What**: the fix, by name.
- **Where**: files relative to the repo root, symbols, lines at the reviewed commit.
- **How**: the mechanics, as steps.
- **Leave alone**: what must not change.
- **Verify**: the exact command, and what green looks like.
- **Commit**: the message, in the repo's convention.

**`needs`, `at`, `suggestion`**: by *Field rules*. What sharing adds: when the reader keeps a finding but not what it `needs`, the prompt tells their agent to ask first.

**Rules**
- **Only what the review found.** Where the review left the *how* open (a fix whose mechanics nobody settled), the brief says so and ends: "Ask me before doing this, with the options you see."
- **No paths the reader lacks.** No absolute paths (`/home/…`, `/Users/…`, `/tmp/…`, `C:\…`), no `<REPO>`-style placeholders, nothing under `.council/`. Name files relative to the repo root.
- **Same outcome, one option.** If two options of a finding lead to the same change, write one.
- **No customer data.** No names, emails, phone numbers, amounts tied to a person or tokens in any brief, code pane, figure or screenshot. When the review touched such data, describe it ("a customer's email") instead.

**Checks.** `render.js --share` rejects a `kind` other than `review`, a missing preamble, a preamble without a commit SHA, an option that leads to work without a brief, a local path, an unknown `lang`, and an `at` that is not repo-relative. Fix the JSON and re-run until it passes. Never edit the `.html`.
