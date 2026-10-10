---
name: team-ceo-view
description: Use when a team-* skill (team-refactor, team-council, team-council-plan, team-kickoff) reaches a CEO gate and the human must approve, decline, or choose between options. Also when the user asks for a visual, HTML, or browser view of a decision, backlog, or plan.
---

# team-ceo-view

Turns a CEO gate into a local HTML decision page: where the work lands beside today's state, then one card per decision, tension and rejected idea, each carrying its own evidence. The human decides in the browser and sends the decisions back with one click.

**Markdown stays the source of truth.** The `.md` record gets every decision; the HTML is the human's view of the same gate.

## Procedure

1. **The gate JSON** goes to `.council/gates/YYYY-MM-DD-<topic>.ceo.json` (create the folder if absent), written by `contract.md` in this skill's base directory: what goes on the page, how to write an item, the fields. In a team-* run the caller's gate writer writes it from copies of `contract.md` and `figures.md` in the run folder, and renders it until it passes. Outside a run, read `contract.md` and write it yourself.
2. **Check it:** `node <base directory>/render.js .council/gates/<file>.ceo.json`, where `<base directory>` is the one shown when this skill loaded, for a manual and a plugin install alike. It writes the `.html` and prints its path, or lists what to fix. Re-rendering after the JSON changes gives the human a fresh set of decisions, so stale choices don't carry over onto edited items.
3. **Serve it:** run the same command with `--serve`, **in the background** (Bash `run_in_background`, timeout 7200000). It serves the page on `127.0.0.1` and opens it in the browser. When the human clicks **Send to Claude**, it saves the block to `<gate>.decisions.txt`, prints it, and exits, which re-invokes you with the block as its output; the page then closes its tab. Tell the human the page is open, and that `?` lists the keyboard shortcuts (`←`/`→` between cards, `Tab` through options, `Enter` to choose).
   No background commands, or the server can't start → open the `.html` itself (`xdg-open` on Linux, `open` on macOS) and wait for the human to paste the block from **Copy decisions**.
4. **Read the block** (the server's output, or the paste):
   ```
   CEO DECISIONS — <title>
   record: <path>
   S1 = approve
   F1 = keep | note: add a comment explaining why
   T1 = Minimalist
   RS-1a = revive
   S9 = UNDECIDED
   ```
   `T*` lines are tension verdicts (the side the human took, or `defer`). A rejected item comes back as `keep-rejected` or `revive`, and a revived one re-enters the calling skill's flow as a new candidate.
   Any `UNDECIDED` → ask about just those, in chat.
   A choice on an item tagged `corrects <premise>` that is not its recommended option → before recording it, ask once, in plain words and without code identifiers: what the page found, and whether the human still wants that option.
5. **Record** the decisions (with notes) into the `.md` record through the calling skill's record writer, then continue the calling skill's flow.

The files stay local; nothing is uploaded. `.council/gates/` can be committed or gitignored: the decisions live in the `.md` record, and the page regenerates from its JSON.

## Who calls this

| Skill | Gate | Mapping lives in |
|-------|------|------------------|
| `team-refactor` | Refactoring backlog | its `templates.md` § *Gate page* |
| `team-council` | Council decision | its `templates.md` § *Gate page* |
| `team-council-plan` | Plan approval | its `templates.md` § *Gate page* |
| `team-kickoff` | Project brief (the single kickoff gate) | its step 5 |

Each caller owns *what* goes on the page; this skill owns *how* it's rendered and returned.
