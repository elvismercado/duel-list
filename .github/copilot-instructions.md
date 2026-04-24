# DuelList.Copilot instructions

## Terminology (use these terms consistently in UI strings, comments, and discussion)

- **List / lists**.top-level container shown on Home (e.g. "Movies to rank").
- **Item / items**.members of a list. The things you compare.
- **Item list**.disambiguation phrase when both lists and items are in scope (e.g. "the item list inside this list").
- **Duel**.one head-to-head comparison between two items.
- **Session**.a sequence of duels in one sitting. Length is `list.sessionLength`.
- **Score**.primary user-facing label for the per-item ranking number. Powered by the ELO algorithm under the hood.
- **Rank**.derived position (#1, #2…) computed from scores.
- **DuelList**.brand name. Always one word, capital D and L.

Avoid: "comparison" (use "duel"), "match" (use "duel"), "round" (use "session" for a sitting; "duel" for a single comparison), "rating" / "ELO" in user-facing copy (use "score"), "entry" / "candidate" / "contender" (use "item").

## Storage / migration caveats

These persisted names **do NOT match the user-facing terminology** and must NOT be renamed without a data migration:

- `Item.eloScore`.persisted in localStorage and exported JSON. UI shows it as "Score".
- `displayMode: 'rank' | 'elo'`.`'elo'` value is persisted on `ListConfig`. UI labels the option "Score".
- `SortField: 'rank' | 'elo' | 'added' | 'name'`.`'elo'` value is persisted in `SortMode` strings.
- `src/lib/elo.ts` and `src/lib/ranking.ts`.internal algorithm names; correct as ELO is the actual rating algorithm. Do not rename.

## UI string discipline

- All user-facing text lives in `src/lib/strings.ts` under `S.*`. Never hard-code copy in components.
- New strings should be grouped under the most specific existing namespace; create new namespaces sparingly.
- When adding a help icon for an ambiguous term, use `<HelpHint anchor="..." term={S....} />` from `@/components/HelpHint` and ensure the matching anchor exists on the Glossary page.

## Code conventions

- React 19 + TypeScript + Vite 7 + react-router 7 + pnpm 10.
- Tailwind + shadcn/ui primitives in `src/components/ui/*`. Don't fork them.
- Mobile-first layouts; single-column flow. No splitter / sidebar layouts.
- Lazy-load sub-pages under `/settings/*` and other deep routes.
- Local component state ok; cross-page persistence goes through `src/lib/storage.ts` and `src/hooks/use*` hooks.
