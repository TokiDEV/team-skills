#!/bin/sh
# team-review step 3: keep each high or med card's heading, Scenario and Fix from the seat files, so the
# verifier never sees a card's Evidence or Refutation. Drops low cards. It lives here, not in SKILL.md,
# because skill argument substitution rewrites awk's field variables in a skill's text.
# Usage: sh cards.sh <run folder>   reads <run folder>/seat-*.md, writes <run folder>/cards.md.
# Prints "cards ok: <n>" and exits 0, or "MISMATCH: ..." and exits 1.
R=${1:?usage: sh cards.sh <run folder>}
awk '
FNR == 1 { f = 0; keep = 0 }
/^(```|~~~)/ { f = !f }
!f && /^### [A-Z][A-Z]+-[0-9]/ { if (c != "" && !low) print c "\n"; c = $0; low = 0; keep = 0; next }
!f && /^###? / { keep = 0 }
!f && /^- \*\*[A-Z][a-z]+(:\*\*|\*\*:)/ { sub(/^- \*\*/, "- "); sub(/(:\*\*|\*\*:)/, ":") }
!f && /^- [A-Z][a-z]+:/ { keep = /^- (Scenario|Fix):/ }
!f && /^- Confidence: *`?low/ { low = 1 }
keep { c = c "\n" $0 }
END { if (c != "" && !low) print c }
' "$R"/seat-*.md > "$R/cards.md" || exit 1
h=$(grep -c '^### [A-Z][A-Z]*-[0-9]' "$R/cards.md")
s=$(grep -c '^- Scenario:' "$R/cards.md")
x=$(grep -c '^- Fix:' "$R/cards.md")
if [ "$h" = "$s" ] && [ "$h" = "$x" ]; then echo "cards ok: $h"; else echo "MISMATCH: $h headings, $s Scenario, $x Fix"; exit 1; fi
