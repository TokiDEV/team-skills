# team-council templates

What each writing agent produces. The orchestrator copies this file into the run folder and points each agent to its section.

## Synthesis (synthesizer)

Read every role's file and the CEO's answers. Each open question goes in exactly one section, settled by `counting.md`.

```markdown
## Council Summary

### Decision: [what was being decided; who sat, and at which depth]

### Consensus Points
[Where every role that spoke agrees]

### Majority Calls
[One per question with a majority: the question, the majority's option and
who backs it, then the minority's option, who holds it and its strongest case]

### Key Tensions
[Only questions with no majority: each side's strongest version and who
holds it, then the PO's suggested side and why]

### PO Recommendation
[The overall direction and the trade-offs it accepts. Refer to Majority
Calls and Key Tensions by id; don't restate them]

### Dissenting Views Worth Noting
[Concerns not tied to a question above, and positions left uncounted for
lack of evidence. A minority on a Majority Call belongs in that call]
```

## Gate page (gate writer)

Build the page (`kind: "council"`) by `team-ceo-view`'s `contract.md`, from the synthesis:
- `summary` (labelled bullets): *Decision* (what is being decided, and who sat), *Consensus*, *Recommendation* (the PO's pick and the trade-offs it accepts).
- `outcome` (when the PO's pick changes a screen or the system's shape): sketch where the pick lands, `ui` and/or `system`, today beside the target, into `.council/gates/YYYY-MM-DD-<topic>/`, drawn by `figures.md`. When another option would land somewhere visibly different, add its `after` sketch to `D1`'s `figures`, captioned with the option's label, so the human compares destinations.
- **`D1`**: the decision itself. Its `options` are the approaches on the table, with `recommended` on the PO's pick. Its `title` is the question, and its `detail` the facts every option shares (≤ 3 bullets); the consensus points go there too when they fit. Put the roles' strongest arguments in `for` (for the pick) and `against` (dissent, risks), each credited to its role.
- **More decisions**: one per Majority Call. The majority's option is `recommended`, and the minority's option stays in `options` with its case in `against`.
- `tensions`: one per Key Tension, each side attributed by role, with the PO's suggested side `recommended`. A Key Tension has no decision card. If D1 itself has no majority, it becomes `T1` and the page has no `D1`.
- Dissenting views worth noting go in the `against` of the decision they weigh on, or become a minor item if they concern none.
- **Figure** (only when there are 3+ options or the council split): a position map, roles × options, showing who backs what, in `D1`'s `figures`.
- `rejected`: approaches the council dropped, with the reason, so the CEO can revive one.

## Decision record (record writer)

Write the CEO's decisions (notes included) under the synthesis in `.council/decisions/YYYY-MM-DD-<topic>.md` (create `.council/decisions/` if absent), and set the header to `Status: decided YYYY-MM-DD`.
- **Supersession**: when it replaces an earlier decision, put `Supersedes: <path>` at the top and add `Superseded by: <path>` to the old record. Never delete or rewrite the old one: it says why the project once chose otherwise.
- **Correction**: when it corrects a fact in an earlier record without replacing its decision, add `Corrected by: <path> — <the line it corrects>` to the old record.
- **The project's decision records**: when the profile lists them, also add one there in their format (location, numbering, headings), holding the context, the decision, its consequences and a link to the council record. `.council/decisions/` stays the record `team-council-plan` reads.
