# The bridge

How business and tech meet on one decision. What every agent that writes a position, a synthesis, a gate or a record applies. A copy sits in the run folder.

## Lenses

Two: `business` (outcome, users, money, legal, time to market, UX) and `tech` (cost to build, run and change, risk, debt). Each line carries its own lens.
- **Defaults.** PO and UX lines are `business`, CTO lines `tech`. The Philosopher, the Wildcard and ad-hoc specialists label every line.
- **On a card,** the item may set a default lens that its lines override. Code is always `tech`.

## Constraint

A limit that removes options: a deadline, a regulation, "no new database in production".
- **Test before recording one:** *"what happens if we break it?"* If the answer is "not much", it is a preference: it becomes a criterion in the trade-offs instead.
- **Each constraint has** an id (`K1`…; the profile's standing ones are `KS1`…), a lens, a source (a file, a record, or "CEO, framing") and a status:

| Status | Set by | Means |
|---|---|---|
| `confirmed` | the human at framing, or a source the human did not contest | binds every option |
| `assumed` | a role or the orchestrator, not yet confirmed | goes to the question pause with a guess attached |
| `contested` | a role that brings evidence a confirmed constraint can move | stays binding; the gate shows the violating option so the CEO can lift it |

A role never confirms a constraint; it suspects one. Only the CEO lifts a constraint, by choosing an option that violates it at the gate; the record says `K<n> lifted by the CEO, <their words>`. A recommendation never violates a constraint, whatever its status: auto-accept takes the recommendations, and must never lift one. A standing constraint marked `lifted by <record path>` in the profile no longer binds: framings, syntheses, gates and plans leave it out.

## Trade-off

What an option gains and costs, one line per lens. A cost with no evidence (`counting.md`: a `file:line`, a doc, an output, a measurement) is shown as an *estimate*.

**Accepted trade-off.** The costs of the option the CEO chose, recorded with who accepted them (`the CEO`, or `auto-accept`) and, when the council named one, the condition to revisit them.

A trade-off is a cost knowingly taken on. It is neither a tension (a question with no majority, `counting.md`) nor a dissent (a minority view, which goes in `against`).

## Structural choices and constraints

A settled structural choice (`team-protocol` § *Structural choices*) that later work could break becomes a `tech` constraint, `confirmed`: a dependency direction or import rule, a public contract, a folder convention. Its source is where the CEO settled it: the council gate (`<record path>, D<n>`) or the plan's *Structure* (`<plan path>, Structure`). A new package, module or layer is a decision, not a constraint: it stays in the plan's *Structure*, and only the rules it comes with become constraints.
