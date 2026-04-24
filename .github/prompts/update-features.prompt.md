---
description: "Edit the Welcome page features (intro tour shown on first run)."
agent: plan
argument-hint: "What to add or change in the features tour"
---
Help me update the Welcome / features tour.

**Key files**
- [src/pages/Welcome.tsx](../../src/pages/Welcome.tsx).page layout and step rendering
- [src/lib/strings.ts](../../src/lib/strings.ts).copy lives under `S.welcome.*`

**Things to keep in mind**
- All copy goes through `S.welcome.*`. Never hard-code strings in the component.
- Follow terminology in [.github/copilot-instructions.md](../copilot-instructions.md) (list / item / duel / session / score / rank / DuelList).
- Tour is mobile-first, single column, swipe-friendly. Keep step bodies short.
- If you add a new step, also add a matching `stepAria` entry and update step indexing.
