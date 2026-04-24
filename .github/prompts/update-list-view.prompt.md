---
description: "Edit the Rankings page (item list inside a single list) and item details."
agent: plan
argument-hint: "What to add or change on the list (item list) view"
---
Help me update the Rankings page (item list inside a list).

**Key files**
- [src/pages/Rankings.tsx](../../src/pages/Rankings.tsx).item list, sort/display controls, hero CTA, removed items
- [src/components/ItemDetailsDialog.tsx](../../src/components/ItemDetailsDialog.tsx).per-item details modal
- [src/components/RankChip.tsx](../../src/components/RankChip.tsx).shared podium chip
- [src/components/HelpHint.tsx](../../src/components/HelpHint.tsx).`?` icons next to ambiguous labels
- [src/lib/strings.ts](../../src/lib/strings.ts).copy under `S.ranking.*`

**Things to keep in mind**
- UI shows "Score" and "Rank". The persisted field is still `Item.eloScore` and `displayMode: 'elo' | 'rank'`.do NOT rename without a data migration. See storage caveats in [.github/copilot-instructions.md](../copilot-instructions.md).
- Display modes: `'rank'` shows ordinals (#1, #2, top-3 use `RankChip`); `'elo'` shows numeric score.
- Use `HelpHint` for any new ambiguous label and add the matching anchor to the Glossary.
- Terminology: "duel" = one comparison, "session" = a sitting. Avoid "match" / "round" / "comparison" in copy.
