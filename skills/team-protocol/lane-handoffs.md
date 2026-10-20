# Lane hand-offs

For team-refactor and team-review, which each hunt in one lane (`team-review` § *Lanes*) and hand what they stumble on in the other to a list named for the receiver: *For team-review*, *For team-refactor*.

- **One line each:** `- <file:line> — <what> — <scenario> — <high|med> — pinned by <test | none>`. The scenario says where it bites: for a suspected bug, the input and what goes wrong; for structure, the change it makes hard and how. *Pinned by* names a test that pins the behavior as it is today (a refactor's Step 0 test), or `none`.
- **Only what could become a card.** Leave out a line with no scenario, a `low` one (`counting.md` § *Confidence*), a design question the scope's plan or decision record already answers, and anything the brief lists as *Settled*.
- **Unverified, no decision.** The run that writes a line never verifies or decides it. The record keeps the list, and the receiving skill takes it in from the record: `team-review <refactor record>…` (`team-review` § *Intake*) and `team-refactor <review record>…` (`team-refactor` § *Intake*).
