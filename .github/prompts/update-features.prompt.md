---
description: "Edit the Features page (full feature catalogue at /features)."
agent: plan
argument-hint: "What to add or change in the features catalogue"
---
Help me update the Features page.

**Audit before planning**
Before proposing changes, read the key files below and produce a brief inventory of what currently exists: list every entry in `S.features.list` with its title and the matching `FEATURE_ICONS[idx]` lucide icon. Then base your plan on the gap between that inventory and my request. Do not assume features that may not be implemented; do not re-suggest cards that already exist. If the inventory contradicts my request, flag it. Output the inventory before the plan.

**Key files**
- [src/pages/Features.tsx](../../src/pages/Features.tsx).page layout, card grid, and `FEATURE_ICONS` array
- [src/lib/strings.ts](../../src/lib/strings.ts).copy lives under `S.features.*` (cards are `S.features.list: { title, body }[]`)

**Things to keep in mind**
- All copy goes through `S.features.*`. Never hard-code strings in the component.
- The `FEATURE_ICONS` array in `Features.tsx` is index-aligned with `S.features.list`. If you add, remove, or reorder a feature, update both in lockstep.
- Icons come from `lucide-react`. Pick one that already fits the visual language of the page.
- Follow terminology in [.github/copilot-instructions.md](../copilot-instructions.md) (list / item / duel / session / score / rank / DuelList).
- Mobile-first, single column on small screens; `sm:grid-cols-2` on wider. Keep card bodies short (1.2 sentences).
- This page is linked from the footer and from the last step of the Welcome tour.it's the long-form reference, not the first-run intro.
