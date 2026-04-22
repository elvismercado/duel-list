# DuelList — Project Plan

> **Created**: April 21, 2026
> **Repo**: [elvismercado/duel-list](https://github.com/elvismercado/duel-list)

See [README.md](../README.md) for project overview, core concepts, and file format.

---

## Phase 1: Core Foundation (Local-Only, PWA-Ready)

**Goal**: Fully functional local app — create/import lists, compare items, view rankings. Installable as PWA. All data persisted in markdown files.

### 1. Project Scaffolding
- pnpm + Vite + React 19 + TypeScript
- Tailwind CSS v4 for styling
- shadcn/ui (Radix + Tailwind) for accessible, ownable components
- vite-plugin-pwa for PWA support (installable, offline-capable)
- **Extract all UI strings to `src/lib/strings.ts`** — no i18n library yet, just disciplined string constants to prep for Phase 3 localization
- Key config files: `vite.config.ts`, `tailwind.config.ts`, `package.json`

### 2. Markdown Parser/Writer
- Parse markdown files into internal data model
- Write ranked lists back to markdown (list order = rank order)
- Handle two input formats:

**Canonical format (DuelList-managed):**
```markdown
---
id: f4j7
name: My Top Anime
session_length: 10
k_factor: 32
created: 2026-04-21
---
- One Piece <!-- {"id":"x7k2","elo":1089,"prevElo":1065,"prevRank":2,"comparisons":18,"added":"2026-04-21"} -->
- Attack on Titan <!-- {"id":"m3p9","elo":1065,"prevElo":1042,"prevRank":3,"comparisons":15,"added":"2026-04-21"} -->
- Naruto <!-- {"id":"a1b2","elo":1042,"prevElo":1050,"prevRank":2,"comparisons":12,"added":"2026-04-21"} -->
- Fullmetal Alchemist <!-- {"id":"q8w4","elo":980,"prevElo":980,"prevRank":4,"comparisons":8,"added":"2026-04-21"} -->
```

- **Frontmatter**: List-level config (id, name, session length, K-factor, created date)
- **List items**: Sorted by rank (list order = rank order)
- **HTML comments**: Per-item data — short random `id`, ELO score, previous ELO/rank (for session summary), comparison count, date added (invisible in any markdown viewer)
- File remains human-readable and renderable in GitHub, Obsidian, VS Code, etc.

**Import-friendly (auto-converted on first save):**
```markdown
# My Top Anime
- Naruto
- One Piece
- Attack on Titan
```

On import: `# Heading` extracted as display name → moved to frontmatter `name:` field. Items get default ELO (1000), a generated short random ID, and `added` set to current date. List gets a generated `id` in frontmatter.

- Key file: `src/lib/markdown.ts`

### 3. Data Model & Persistence

**Storage architecture:**
- **localStorage = working copy** — the app always works from localStorage. Fast, available in all browsers.
- **Markdown files = sync targets** — portable format, source of truth for backup/sharing.
- **Save after every duel** — write to localStorage immediately. If a file handle is available (desktop), sync to file too.
- **Sync adapters** push/pull between localStorage and destinations:
  - Local file system (File System Access API, desktop Chrome/Edge) — auto-sync after every duel
  - Nextcloud (WebDAV, Phase 2) — manual or periodic sync
  - Manual export/import (all browsers) — download/upload `.md` files
- **IndexedDB for file handles only** — persists File System Access API handles so desktop users can re-open files without re-picking. Not used for data.
- If localStorage is cleared, user re-imports markdown files — all ranking data is in the files.

**localStorage key structure:**
```
duellist:lists          → [{id, name, lastOpened}, ...]                // list registry
duellist:list:<id>      → {full list JSON (ListConfig + items)}         // per-list data
duellist:settings       → {firstRunDone, theme, ...}                   // app preferences
```

**Quota management:**
- localStorage limit is ~5-10MB per origin
- Monitor usage and warn user at ~80% capacity
- A 500-item list with full metadata is ~50-100KB; 10 such lists is ~0.5-1MB — well within limits for typical use

**Data stored in markdown files:**
  - List items + ranking data (ELO, comparison count, ID, added date) embedded as HTML comments
  - Duel history in companion `.duellist.md` file (optional, auto-generated)
  - List config (name, session length, k-factor) in YAML frontmatter
- List order in the file = rank order (re-sorted on save)

**Core types:**
```typescript
interface Item {
  id: string;            // short random ID, persisted in HTML comment JSON
  name: string;
  metadata?: Record<string, string>;
  eloScore: number;
  prevEloScore: number;  // ELO at start of last session (for session summary "biggest movers")
  prevRank: number;      // rank at start of last session
  comparisonCount: number;
  added: string;         // ISO date string, e.g. "2026-04-21"
}

interface DuelRecord {
  itemA: string;
  itemB: string;
  winner: string | null; // null = tie
  timestamp: number;
}

interface ListConfig {
  id: string;            // short random ID, persisted in frontmatter
  name: string;
  sessionLength: number;
  kFactor: number;       // ELO K-factor, default 32. Higher = faster/volatile, lower = stable.
  created: string;
  items: Item[];
}
```

- Key files: `src/types.ts`, `src/lib/markdown.ts`

**Companion history file** (named after the source file, not the list display name):
```
anime.md                            ← ranked list (clean, portable)
anime.duellist.md                   ← duel history (auto-generated, optional)
```

History file format:
```markdown
# My Top Anime — Duel History
> Auto-generated by DuelList. 847 duels recorded.

## 2026-04-21
- One Piece (x7k2) > Naruto (a1b2)
- Attack on Titan (m3p9) > Naruto (a1b2)
- One Piece (x7k2) = Attack on Titan (m3p9)
- Fullmetal Alchemist (q8w4) > Naruto (a1b2)
```

The history file is optional — can be deleted without affecting rankings. Useful for Phase 3 statistics.

**Name resolution**: History entries display item names for readability (e.g., `One Piece (x7k2) > Naruto (a1b2)`), but `DuelRecord` stores IDs only. Names are resolved from the current item list at write time. Past history entries retain item names as written. Deleted items cannot appear in future entries.

### 4. Ranking Engine
ELO rating system + smart pairing algorithm:

- **Rating system**: ELO with configurable K-factor (default K=32)
  - All items start at equal rating (1000)
  - Winner gains points, loser loses points
  - Ties: both sides get `actual = 0.5` (standard ELO tie handling — upset ties still shift ratings)
  - Magnitude depends on expected outcome (upset = bigger change)
  - Formula: `newRating = oldRating + K * (actual - expected)`
  - K-factor stored in list frontmatter, configurable per list
  - ELO is hidden from users — they see ordinal rank positions only
  - **ELO tiebreaker**: when scores are equal, items retain their import order

- **Pairing strategy**:
  1. Prioritize items with fewest comparisons (reduce uncertainty)
  2. Among those, prefer items close in current rank (refine boundaries)
  3. Avoid pairs compared in the last N duels, where N = list size (soft preference — if all pairs are on cooldown, fall back to least-recently-compared pair)
  4. Random tiebreaker
  - New items (ELO 1000) get prioritized for comparisons

- **Pairing cooldown**: Derived from the companion history file on list load (parse last N entries), cached in-memory during the session. No separate cooldown storage. See TECH_DECISIONS #16.

- Key files: `src/lib/ranking.ts`, `src/lib/pairing.ts`

### 5. Side-by-Side Comparison Mode
- Two items displayed as cards, side by side
- Click/tap the winner
- "Tie" button — standard ELO tie (both get `actual = 0.5`)
- "Skip" button — pair is deferred, shown again later (not recorded in history)
- Show item name, current rank, comparison count on each card
- Keyboard shortcuts: Left arrow (←), Right arrow (→), T for tie, S for skip
- **Post-duel animation**: winner card grows to fill the full space, loser card shrinks out, then transition to next pair
- **Minimum 2 items required** to start a duel session; show message and disable compare if fewer
- Key file: `src/components/SideBySideMode.tsx`

### 6. Ranking View
- Full list sorted #1 to last
- Each row: rank number, item name, comparison count
- No ELO scores shown
- Key file: `src/components/RankingView.tsx`

### 7. List Management
- Create new list (type or paste items) → name goes to frontmatter
- Import markdown file (file picker) → heading auto-detected, converted to frontmatter
- Add individual items to existing list (start at ELO 1000, prioritized for duels)
- Delete individual items from a list
- Export ranked list as markdown
- Delete list
- Multiple independent lists supported
- Key files: `src/components/ListManager.tsx`, `src/pages/Home.tsx`

### 8. Session Configuration
- Default session length: 10 duels
- User-configurable: 5 / 10 / 20 / unlimited
- Progress bar during session (hidden in unlimited mode)
- Unlimited mode: runs forever; user clicks "Done" for summary, or navigates away / closes
- **Session start**: auto-starts when user navigates to Compare page; uses the list's stored `sessionLength`. No setup screen.
- **Pre-session snapshot**: on session start, capture each item's current rank and ELO → saved to `prevElo`/`prevRank` in the item data for session summary
- **"Session complete" summary**: total duels completed, biggest rank movers (e.g., "Attack on Titan ↑ 3 spots"), current top 3
- Stored in list frontmatter (`session_length`)
- **K-factor presets** (shown at list creation + list settings):
  - **Quick** (K=48) — "Rankings shift quickly after each duel"
  - **Gradual** (K=32, default) — "Rankings update at a balanced pace"
  - **Tight** (K=16) — "Rankings resist change, require more evidence"
  - Stored in list frontmatter (`k_factor`)

### 9. First-Run Experience
On first open, present the user with choices:
1. "Take a quick tour" — guided walkthrough (see tour steps below)
2. "Try a sample list" — pre-loaded list to experience a duel immediately
   - **Sample lists available**: Pizza Toppings, Top Anime, Favorite Movies, Vacation Destinations, Best Snacks, Hobbies
   - Each contains ~8-10 items for a quick first session
3. "Create a new list" — jump straight in
4. "Import an existing list" — import a local markdown file (Nextcloud connection added in Phase 2)

**Tour steps** (5-step overlay walkthrough):
1. **"Welcome to DuelList"** — "Rank anything by picking winners in quick A-vs-B duels. No need to sort the whole list — just pick one."
2. **"The Duel"** — (highlights comparison area) "Two items appear side by side. Pick the winner, declare a tie, or skip."
3. **"Your Ranking Builds Itself"** — (highlights ranking view) "After each duel, your list re-ranks automatically. The more duels you do, the more accurate it gets."
4. **"Quick Sessions"** — (highlights session config) "Do 5–10 duels a day. It's a habit, not a chore."
5. **"Done!"** — "Create a list or try a sample to get started."

### 10. App Shell & Routing
- **Navigation model**: Home (list of lists) → Rankings (list detail page) → Compare (duel session)
  - Home shows all lists; clicking a list opens its Rankings page
  - Rankings page shows the ranked list + button to start a duel session
  - Header shows current list name as clickable breadcrumb back to Home
- React Router v7 for page navigation
- PWA manifest + service worker via vite-plugin-pwa
- Key files: `src/App.tsx`, `src/pages/`

### 11. Empty & Error States

| State | Location | Message | Action |
|-------|----------|---------|--------|
| No lists yet | Home page | (First-run experience shown instead) | Tour / sample / create / import |
| List has 0 items | Ranking view | "This list is empty. Add some items to get started." | Add items button |
| List has 1 item | Compare page | "You need at least 2 items to start dueling." | Add items button |
| List has 0 comparisons | Ranking view | Show items in import order | Note: "Start comparing to build your ranking" |
| All pairs exhausted | Compare page | "You've compared every possible pair! Rankings are fully refined." | Option to re-compare |
| No history yet | History/stats (Phase 3) | "No duels recorded yet. Start comparing!" | Link to compare page |
| localStorage near limit | Any page (banner) | "Storage is almost full. Export your lists to free up space." | Export button |

---

## Phase 1b: Swipe Mode

**Goal**: Add Tinder-style swipe comparison as an alternative to side-by-side.

- Two stacked cards shown
- Swipe right = left item wins, swipe left = right item wins
- Framer Motion for drag/swipe gesture handling
- Mobile-optimized with touch support
- User can toggle between swipe and side-by-side in settings
- Key file: `src/components/SwipeMode.tsx`

---

## Phase 2: Nextcloud Integration

**Goal**: Sync markdown lists with Nextcloud via WebDAV.

### 12. WebDAV Client
- Use `webdav` npm package for WebDAV operations (list, read, write files)
- Handle authentication (basic auth or app tokens)
- Key file: `src/lib/nextcloud.ts`

### 13. CORS Handling
- Try direct WebDAV from browser first
- If CORS blocks it: add lightweight proxy server or configure Nextcloud CORS headers
- Decision: try direct first, add proxy if needed

### 14. Sync UI
- Settings page: configure Nextcloud URL + credentials
- File browser: select markdown file from Nextcloud
- Manual sync button (auto-sync optional later)
- Conflict resolution: last-write-wins to start
- Key files: `src/components/NextcloudSettings.tsx`, `src/components/FileBrowser.tsx`

### 15. Bi-Directional Sync
- Items added to markdown on Nextcloud → appear unranked in app
- Items ranked in app → markdown file updated with new order
- Just sync the `.md` file + optional `.duellist.md` — no companion JSON needed
- Key file: `src/lib/sync.ts`

---

## Phase 3: Polish & Extras

### 15. Statistics Dashboard
- Total comparisons made
- Confidence level per item
- Comparison history timeline (powered by `.duellist.md` history file)

### 16. Periodic Comparison Prompts
- Setting: "Remind me to compare every N hours/days"
- Browser notifications or in-app prompt on open

### 17. Dark Mode / Themes
- Follow system preference
- Manual toggle

### 18. Metadata Support
- Extend markdown parser for inline metadata
- Display metadata on cards during comparison
- Filter/group items by metadata

### 19. Internationalization (i18n)
- Add i18n library (react-i18next or lingui)
- Convert `src/lib/strings.ts` constants into translation JSON files
- Translation files per language: `src/locales/en.json`, `nl.json`, `es.json`, `pap.json`
- Language selector in settings
- Browser language auto-detection with manual override
- Target languages: English (default), Dutch, Spanish, Papiamentu
- Scope: UI labels, buttons, messages, tour text, session summary. User content (item names, list names) is not translated.

**Future format with metadata:**
```markdown
---
id: f4j7
name: My Top Anime
session_length: 10
k_factor: 32
created: 2026-04-21
---
- Naruto [first_watched: 2005] [last_watched: 2024] <!-- {"id":"a1b2","elo":1042,"prevElo":1050,"prevRank":2,"comparisons":12,"added":"2026-04-21"} -->
- One Piece [first_watched: 2003] <!-- {"id":"x7k2","elo":1089,"prevElo":1065,"prevRank":2,"comparisons":18,"added":"2026-04-21"} -->
```

---

## Future

- **Tauri**: Wrap web app as native desktop app (same React + shadcn/ui codebase, Rust-based, small binary)
- **Cross-platform path**: Web → PWA → Tauri
- **Other cloud storage**: Google Drive, Dropbox, etc.
- **Category-specific features**: Cover art for anime/movies, album art for music
- **Additional languages**: Community-contributed translations beyond the initial four

---

## Verification Checklist

### Phase 1
1. [ ] Import a 10-item markdown file → all items parsed correctly, IDs generated, `added` dates set
2. [ ] Run 20+ comparisons → ranking stabilizes with preferred items at top
3. [ ] Export ranked list to markdown → ordering matches displayed ranking, HTML comments with id/elo/comparisons/added present
4. [ ] Re-import exported file → all IDs, ELO scores, comparison counts, and added dates preserved
5. [ ] Test side-by-side mode on desktop → click-to-pick works, keyboard shortcuts (← → T S) work
6. [ ] Test side-by-side mode on mobile viewport → responsive layout works
7. [ ] Test tie button → ELO changes via 0.5 scoring (upset ties shift ratings)
8. [ ] Test skip button → pair re-queued, not recorded in history
9. [ ] Add new item to existing ranked list → starts at ELO 1000, gets prioritized in pairing
10. [ ] PWA install → app works offline after first load
11. [ ] Companion `.duellist.md` file generated → duel history readable, named after source file
12. [ ] Create two separate lists → independent rankings maintained
13. [ ] Create a new list from scratch (type items) → name in frontmatter, items get IDs
14. [ ] Session configuration → can set 5/10/20/unlimited, progress bar works
15. [ ] Session complete summary → shows duel count, biggest movers, top 3
16. [ ] Post-duel animation → winner grows, loser shrinks, smooth transition
17. [ ] List with 0-1 items → compare button disabled, helpful message shown
18. [ ] Corrupted HTML comment in imported file → item treated as unranked, fixed on next save
19. [ ] Item name containing `<!--` → properly escaped, no parser breakage
20. [ ] localStorage fallback → close tab without exporting, reopen → data recovered
21. [ ] First-run experience → tour, sample list, create, and import options all work
22. [ ] Duplicate item names → each gets unique ID, both appear in rankings
23. [ ] Delete an item from a 10-item ranked list → remaining 9 items keep ranks, deleted item gone from rankings view
24. [ ] First-run tour → all 5 steps display correctly, can skip or complete
25. [ ] Empty state: 0 items → ranking view shows "add items" message
26. [ ] Empty state: 1 item → compare page shows "need 2 items" message
27. [ ] Empty state: 0 comparisons → ranking view shows import order with "start comparing" note
28. [ ] K-factor presets → Quick/Gradual/Tight options shown at list creation and list settings, different K values produce different ranking behavior
29. [ ] localStorage quota → warning banner appears when storage usage exceeds ~80%

### Phase 2
30. [ ] Connect to Nextcloud → file read/write via WebDAV works
31. [ ] Modify markdown on Nextcloud → sync brings in new items unranked
