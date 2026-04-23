---
description: "Edit the Home page (lists view) and the per-list card."
agent: plan
argument-hint: "What to add or change on the home/lists view"
---
Help me update the Home page (lists view).

**Key files**
- [src/pages/Home.tsx](../../src/pages/Home.tsx) — page layout, hero CTA, sort/reorder controls
- [src/components/ListCard.tsx](../../src/components/ListCard.tsx) — per-list card (activity dot, top-3, quick-duel)
- [src/components/RankChip.tsx](../../src/components/RankChip.tsx) — shared podium chip
- [src/lib/strings.ts](../../src/lib/strings.ts) — copy under `S.home.*` and `S.list.*`

**Things to keep in mind**
- Mobile-first, single-column. No splitter/sidebar layouts.
- Hero "Random duel" CTA pattern: gradient bg + Swords badge — reuse classes from existing hero block.
- Activity dot meanings are documented in the Glossary; don't change semantics without updating it too.
- Terminology: "list" = home-page collection; "item" = thing inside a list. See [.github/copilot-instructions.md](../copilot-instructions.md).
- Cross-page persistence goes through `src/lib/storage.ts` and `src/hooks/useListRegistry.ts`.
