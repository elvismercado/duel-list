---
description: "Edit the Welcome tour (first-run intro shown on /welcome)."
agent: plan
argument-hint: "What to add or change in the welcome tour"
---
Help me update the Welcome tour.

**Audit before planning**
Before proposing changes, read the key files below and produce a brief inventory of what currently exists: list every step in `TOUR_STEPS` with its heading and a one-line summary of its description, plus the buttons rendered on the first and last steps. Then base your plan on the gap between that inventory and my request. Do not assume features that may not be implemented; do not re-suggest things that already exist. If the inventory contradicts my request, flag it. Output the inventory before the plan.

**Key files**
- [src/pages/Welcome.tsx](../../src/pages/Welcome.tsx).page layout and step rendering
- [src/lib/strings.ts](../../src/lib/strings.ts).copy lives under `S.welcome.*`

**Things to keep in mind**
- All copy goes through `S.welcome.*`. Never hard-code strings in the component.
- Follow terminology in [.github/copilot-instructions.md](../copilot-instructions.md) (list / item / duel / session / score / rank / DuelList).
- Tour is mobile-first, single column, swipe-friendly. Keep step bodies short.
- If you add a new step, also add a matching `stepAria` entry and update step indexing.
