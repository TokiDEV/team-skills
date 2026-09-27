---
name: team-ceo-view
description: Use when a team-* skill (team-refactor, team-council, team-council-plan, team-kickoff) reaches a CEO gate and the human must approve, decline, or choose between options. Also when the user asks for a visual, HTML, or browser view of a decision, backlog, or plan.
---

# team-ceo-view

Turns a CEO gate into a local HTML decision page. Every decision, tension and rejected idea is a card the human decides on. Each card carries its own evidence: arguments for and against, metrics, before/after code, figures and screenshots. A sidebar holds search, filters and an overview whose item chips jump to their cards. The human decides in the browser and pastes the decisions back.

**Markdown stays the source of truth.** Agents read and git diffs the `.md` record. The HTML is the human's view of the same gate, and never holds a decision the `.md` doesn't get.

## Procedure

1. **Write the gate JSON** to `.council/gates/YYYY-MM-DD-<topic>.ceo.json` (create the folder if absent), with `source` set to the record it belongs to. Contract below.
   **Evidence goes on the item it supports.** Arguments, metrics, code and figures belong to the decision, tension or rejected item they concern, never to a page-level section. Copy every screenshot an item relies on into `.council/gates/YYYY-MM-DD-<topic>/`: scratchpad and `/tmp` are wiped after the session.
2. **Render:** `node <this skill's directory>/render.js .council/gates/<file>.ceo.json` (`~/.claude/skills/team-ceo-view/` for a manual install; the plugin cache when installed as a plugin). It prints the `.html` path and rejects invalid JSON with a list of errors. It also rejects any item whose text mentions a screenshot or "figure N" but carries no `figures`. Re-rendering after the JSON changes gives the human a fresh set of decisions, so stale choices don't carry over onto edited items.
3. **Open it:** `xdg-open <html>` (Linux) or `open <html>` (macOS). Tell the human the path, that the page has a **Copy decisions** button, and that `?` lists the keyboard shortcuts (`←`/`→` between cards, `Tab` through options, `Enter` to choose).
4. **Wait** for the pasted block:
   ```
   CEO DECISIONS — <title>
   record: <path>
   S1 = approve
   F1 = keep | note: add a comment explaining why
   T1 = Minimalist
   UB-1a = revive
   S9 = UNDECIDED
   ```
   `T*` lines are tension verdicts (the side the human took, or `defer`). A rejected item comes back as `keep-rejected` or `revive`, and a revived one re-enters the calling skill's flow as a new candidate.
   Any `UNDECIDED` → ask about just those, in chat.
5. **Record** the decisions (with notes) into the `.md` record, then continue the calling skill's flow.

The files stay local; nothing is uploaded. `.council/gates/` can be committed or gitignored: the decisions live in the `.md` record, and the page regenerates from its JSON.

## Who calls this

| Skill | Gate | Mapping lives in |
|-------|------|------------------|
| `team-refactor` | Refactoring backlog | its step 5 |
| `team-council` | Council decision | its *CEO gate* section |
| `team-council-plan` | Plan approval | its step 5 |
| `team-kickoff` | Project brief (the single kickoff gate) | its step 5 |

Each caller owns *what* goes on the page; this skill owns *how* it's rendered and returned.

## Triage before you render

The page is for decisions, not an inventory. Before writing the JSON:
- **One question, one card.** Sort every open question by the positions the roles hold after the last round. Only roles that took a side count.
  - **Majority:** more than half of those roles back one option (2 of 3, 3 of 5). The question goes in `decisions` (the backlog), and the majority's option is `recommended`. The minority's case goes in `against`, and its option stays in `options` so the human can still pick it.
  - **No majority** (1–1, 2–2, 1–1–1, 2–1–1): the question goes in `tensions` only, with one side per position. The synthesizer's suggested side is `recommended`.
  - A question is never both a decision and a tension. If a tension's outcome would answer a decision, merge the two into the tension.
- **At most ~7 weighty decisions.** These are what the human must actually weigh: anything touching money, contracts or users, and tensions. Routine items with a clear recommendation (backlog steps, plan steps) don't count toward the cap; **Accept recommended** handles them in one click.
- **Everything else is `minor: true` with a `default`.** Edge-case quirks and cosmetic items fold into a collapsed block with their default already applied.
- **Order by stakes.** The item the human explicitly asked about goes first.

## JSON contract

```json
{
  "kind": "refactor | council | plan | kickoff",
  "title": "Refactoring backlog — src/invoice.js",
  "date": "2026-09-26",
  "source": ".council/refactors/2026-09-26-invoice.md",
  "summary": [
    { "label": "Verdict", "text": "One line: what is being decided and the overall call." },
    { "label": "Weak spots", "points": ["Three copies of the tax rule", "Dead exportCsv()"] },
    { "label": "Recommendation", "points": ["Approve S1–S4", "Fix F1 as its own fix: commit"] }
  ],
  "decisions": [
    {
      "id": "F1", "group": "Found, not fixed", "title": "Gold discount rounds down",
      "tags": ["money", "behavior change"],
      "detail": "What it is and its impact, with concrete numbers (screenshot 3).",
      "why": "Why it needs a human decision.",
      "for": [ { "who": "Fowler", "point": "One rounding rule for every tier." } ],
      "against": [ { "who": "Minimalist", "point": "Changes invoices already sent; finance must sign off." } ],
      "metrics": [ { "label": "Tiers using floor", "before": 1, "after": 0, "better": "lower" } ],
      "code": { "before": "Math.floor(total * 0.1)", "after": "Math.round(total * 0.1)" },
      "figures": [ { "src": "2026-09-26-invoice/03-receipt.png", "caption": "Screenshot 3 — receipt shows 4.99 € discount" } ],
      "options": [
        { "value": "keep", "label": "Keep floor + comment", "recommended": true },
        { "value": "round", "label": "Round like other tiers" },
        { "value": "defer", "label": "Ask finance", "negative": true }
      ]
    },
    { "id": "S3", "group": "Backlog", "title": "Rename Variable: grand → total" },
    { "id": "F9", "title": "'Discount: -0.00' always printed", "minor": true, "default": "decline" }
  ],
  "tensions": [
    { "id": "T1", "topic": "Extract buildInvoice?", "sides": [
      { "who": "Uncle Bob + Ousterhout", "position": "Strongest case for…" },
      { "who": "Minimalist", "position": "Strongest case against…", "recommended": true } ] }
  ],
  "rejected": [ { "id": "JO-3", "title": "Per-type rule table", "reason": "One use; hides the floor quirk" } ],
  "figures": [ { "title": "Module map", "svg": "<svg viewBox='0 0 800 160'>…</svg>" } ]
}
```

Field rules:
- Only `title` and `decisions` (each with `id` and `title`) are required. Ids are unique across decisions, tensions and rejected items.
- `summary` is a list of bullets, never a paragraph. Each bullet is a string or a `{ "label", "text" }` / `{ "label", "points": [...] }` object. Aim for 3–5 labelled bullets, and end with the recommendation. The renderer rejects a string summary.
- **Every item** (decision, tension, rejected) accepts `detail`, `why`, `tags`, `for`, `against`, `metrics`, `code`, `figures`, `options` and `default`.
- `for` / `against`: the arguments, each attributed to the role that made it, as `{ "who", "point" }`, one concrete sentence each. Give every weighty item both columns. An empty `against` shows as "No argument raised", which is itself information. Only use arguments the panel actually made.
- `options` defaults to Approve/Decline. Set `"recommended": "decline"` on the decision to recommend declining.
- **Tensions** hold only questions with no majority (see *Triage*). They get their id from their position (`T1`, `T2`…) unless you set `id`. Their default options are "Side with <who>" for each side, plus Defer. Mark the recommended side with `"recommended": true` on that side.
- **Rejected** items default to *Keep rejected* (pre-applied) or *Revive*, and `reason` is shown on the card.
- `metrics` show as before→after chips on their card. `better` (`higher` or `lower`) colors the change green or red. Page-level `metrics` are rejected by the renderer.
- `code` is shown as before/after panes. Include it for every step that moves code, and keep each pane to about 15 lines.
- `figures` entries take either `svg` or `src`:
  - `src` points to an image such as a screenshot. It must be **relative to the JSON file**; absolute, `/tmp` and URL paths are rejected. The renderer embeds the image, so the `.html` stays one file. A click opens it full size. The caption says what to look at, e.g. "knob 17.6 kHz, graph still at 1 kHz". (`images` is accepted as an old name for `figures`.)
  - `svg` is trusted inline SVG. The page is dark: use `currentColor` for strokes and text, and no light fills. Make the `viewBox` about 700–900 units wide with `font-size` 12–13, so the text renders at reading size; a narrower viewBox gets scaled up. A diagram earns its place when structure matters: module dependencies before and after, a sequence, a vote spread.
- Page-level `figures` are only for a diagram that spans many items (it shows under the overview). Anything about one item goes on that item.
