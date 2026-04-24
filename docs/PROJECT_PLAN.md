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
- `yaml` package for YAML frontmatter parsing/writing (ESM-native, actively maintained). Manual ~5-line split/join for frontmatter delimiters — no `gray-matter` (Buffer/ESM issues in Vite, unmaintained).
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

**Serialization mapping** (TypeScript field ↔ file format key):
| TypeScript | File Key | Source | Notes |
|-----------|----------|--------|-------|
| `eloScore` | `elo` | HTML comment | Shorter key in serialized form |
| `prevEloScore` | `prevElo` | HTML comment | |
| `comparisonCount` | `comparisons` | HTML comment | |
| `id`, `prevRank`, `added`, `removed` | same | HTML comment | Identical in both |
| `sessionLength` | `session_length` | Frontmatter | snake_case in YAML |
| `kFactor` | `k_factor` | Frontmatter | snake_case in YAML |
| `id`, `name`, `created` | same | Frontmatter | Identical in both |

**Escaping rules**:
- Item names containing `<!--` are HTML-encoded to `&lt;!--` on write, decoded on read
- Item names containing `-->` are encoded to `--&gt;` on write, decoded on read
- Leading/trailing whitespace is trimmed
- Newlines in item names are replaced with spaces

**Parser edge cases**:
- Unknown frontmatter fields: preserved on read/write (pass-through)
- Both `# Heading` and `name:` in frontmatter: frontmatter `name:` wins, heading ignored
- File with no list items: creates empty list
- Nested lists: flattened to top-level items
- Invalid JSON in HTML comment: item treated as unranked (default ELO 1000), comment overwritten on next save
- Duplicate item IDs: second item gets a regenerated ID

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
duellist:history:<id>   → raw markdown string (duel history entries)     // per-list history
duellist:settings       → {firstRunDone, theme, homeSortOrder,          // app preferences
                           customListOrder, ...}
```

**Quota management:**
- localStorage limit is ~5-10MB per origin
- Check total usage after every localStorage write (serialize all keys, check `.length`)
- Show persistent banner (not toast) when usage exceeds ~80% capacity
- A 500-item list with full metadata is ~50-100KB; 10 such lists is ~0.5-1MB — well within limits for typical use
- **Duel history** is stored in localStorage under `duellist:history:<id>` as a raw markdown string (same format as `.duellist.md`). This ensures all users — including mobile and Firefox — have exportable history and pairing cooldown between sessions. No cap on entries.

**Data stored in markdown files:**
  - List items + ranking data (ELO, comparison count, ID, added date) embedded as HTML comments
  - Duel history in companion `.duellist.md` file (optional, auto-generated)
  - List config (name, session length, k-factor) in YAML frontmatter
- List order in the file = rank order (re-sorted on save)
- **Soft-deleted items** are written to a `## Removed` section at the bottom of the file:
```markdown
## Removed
- Naruto <!-- {"id":"a1b2","elo":1042,"prevElo":1050,"prevRank":2,"comparisons":12,"added":"2026-04-21","removed":true} -->
```
  On parse, items in this section are loaded into the soft-delete bucket. On write, active items appear first (ranked), then `## Removed` with bucket items.

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
  removed?: boolean;     // true if soft-deleted (in ## Removed section of markdown)
}

interface DuelRecord {
  itemA: string;         // item ID
  itemB: string;         // item ID
  winner: string | null; // item ID, null = tie
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

**DuelRecord session storage**: The `useComparison` hook maintains a `DuelRecord[]` array in React component state during the active session. On each duel: (1) update ELO + save to localStorage, (2) push record to the in-memory array, (3) append the formatted history line to `duellist:history:<id>` in localStorage, (4) if a file handle is available, also append to the `.duellist.md` file. The session summary reads from the in-memory array.

**History append strategy**: On each duel, the formatted history line is appended to the raw markdown string in `duellist:history:<id>`. Tail parsing (`lastIndexOf('\n## ')`) checks if today's date header already exists — if yes, append under it; if no, add a new `## YYYY-MM-DD` header first. The duel count in the header line (line 2) is also incremented. The same string is written to both localStorage and the `.duellist.md` file (if available). Same format everywhere = zero drift.

**`useExport` hook**: Delegates to `markdown.ts` for list serialization and `storage.ts` for reading all lists. For history export, reads the full markdown string from `duellist:history:<id>` in localStorage and triggers a download — no wrapping needed since the string already includes the header and all entries.

- Key file: `src/lib/history.ts` (history append via tail parsing + cooldown parsing)

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
- One Piece [x7k2] > Naruto [a1b2]
- Attack on Titan [m3p9] > Naruto [a1b2]
- One Piece [x7k2] = Attack on Titan [m3p9]
- Fullmetal Alchemist [q8w4] > Naruto [a1b2]
```

The history file is optional — can be deleted without affecting rankings. Useful for Phase 3 statistics.

**History file lifecycle**: History accumulates in localStorage (`duellist:history:<id>`) after every duel. If a file handle is available (desktop Chrome/Edge), the `.duellist.md` file is also kept in sync. For export, the history is generated on demand from localStorage.

**Name resolution**: History entries display item names for readability (e.g., `One Piece [x7k2] > Naruto [a1b2]`), but `DuelRecord` stores IDs only. Names are resolved from the current item list at write time. Past history entries retain item names as written. Deleted items cannot appear in future entries. Item IDs use square brackets `[id]` to avoid ambiguity with parenthesized item names (e.g., "Fate/Stay Night (2006)").

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
  2. Among those, prefer items close in current ELO score (refine boundaries)
  3. Avoid pairs compared in the last N duels, where N = list size (soft preference — if all pairs are on cooldown, fall back to least-recently-compared pair)
  4. Random tiebreaker
  - New items (ELO 1000) get prioritized for comparisons

- **Pairing cooldown**: Derived from `duellist:history:<id>` in localStorage on list load (parse last N entries), cached in-memory during the session. Falls back to companion history file if localStorage is empty. See TECH_DECISIONS #16.

- Key files: `src/lib/ranking.ts`, `src/lib/pairing.ts`

### 5. Side-by-Side Comparison Mode
- Two items displayed as cards, side by side
- Click/tap the winner
- "Tie" button — standard ELO tie (both get `actual = 0.5`)
- "Skip" button — pair is deferred to a session-local re-queue, not recorded in history. The algorithm checks the re-queue first before generating a new pair. Skips do not count toward the session counter.
- Show item name, current rank, comparison count on each card
- Keyboard shortcuts: Left arrow (←), Right arrow (→), T for tie, S for skip
- **Post-duel animation**: winner card grows to fill the full space, loser card shrinks out, then transition to next pair. Uses CSS transitions/`@keyframes` only — Framer Motion is added in Phase 1b for swipe gestures.
- **Minimum 2 items required** to start a duel session; show message and disable compare if fewer
- Key file: `src/components/SideBySideMode.tsx`

### 6. Ranking View
- Full list sorted #1 to last
- Each row: rank number, item name, comparison count
- No ELO scores shown
- **Collapsed "Removed items" section** at the bottom — expand to see soft-deleted items, click to restore
- Key file: `src/components/RankingView.tsx`

### 7. List Management
- **Create new list**: Name (required) + K-factor preset (default: Gradual) + session length (default: 10). Empty lists allowed — items added from Rankings page.
- **Import markdown file** (file picker) → heading auto-detected, converted to frontmatter. If the imported file's frontmatter `id` matches an existing list, prompt: "Replace existing" or "Import as new list" (generates new ID). **"Replace existing"** is a full overwrite — replaces all item data, config, and history.
- **Add items**: Button on Rankings page opens textarea dialog for batch add (one item per line). New items start at ELO 1000, prioritized for duels.
- **Delete items**: Delete icon per row on Rankings page. Confirmation dialog required. Deleted items move to soft-delete bucket (see below).
- **Rename items**: On hover (mouse) or tap (touch), an edit button appears on the item row. Clicking it enables inline editing — press Enter to confirm. The item ID remains stable across renames.
- **Soft-delete bucket**: Deleted items are not permanently removed. They appear in a collapsed "Removed items" section at the bottom of the Rankings page and are also listed in the list's Settings page. Items in the bucket are excluded from pairing and ranking. Users can restore items from either location. **Restore preserves stats** — the item keeps its score, comparison count, and `added` date; only the `removed` flag is cleared and the trend snapshot (`prevRank` / `prevEloScore`) is reset so the next session shows no spurious jump.
- **Per-list export**: Available from list Settings page (`/list/:id/settings`):
  - Export list (`.md` file)
  - Export history (`.duellist.md` file)
  - Filename: slugified list name (e.g., `my-top-anime.md`). Slugify: `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')`, truncated at 50 chars.
- **App-wide export**: Available from `/settings` (app-level settings page):
  - Export all lists (downloads all `.md` + `.duellist.md` files as a single `.zip` via JSZip)
  - Export app data (full localStorage dump — all `duellist:*` keys as a JSON file)
  - "Export all" button (downloads everything)
- **Delete list**: Available from list Settings page (danger zone). Confirmation dialog required. Cleanup: remove `duellist:list:<id>`, `duellist:history:<id>`, entry from `duellist:lists` registry, ID from `customListOrder` (if present), and file handle from IndexedDB.
- **Edit list settings**: Gear icon on Rankings page header → navigates to `/list/:id/settings`. Settings page contains: name, K-factor preset, session length, removed items (restorable), per-list export (list + history), and danger zone (delete list). On rename, update both `duellist:list:<id>` and the matching entry in `duellist:lists`.
- Multiple independent lists supported
- Key files: `src/components/ListManager.tsx`, `src/pages/Home.tsx`

### 8. Session Configuration
- Default session length: 10 duels
- User-configurable: presets **5 / 10 / 20 / 50 / Unlimited** plus a free-form number input
- Progress bar during session (hidden in unlimited mode)
- Unlimited mode: runs forever; user clicks "Done" for summary, or navigates away / closes
- **Session start**: auto-starts when user navigates to Duel page; uses the list's stored `sessionLength`. No setup screen.
- **Session lifecycle**: Session counter is ephemeral (component state, not persisted). If the user navigates away mid-session, the session is abandoned — ELO updates are safe (saved per-duel), but session progress is lost. On return to the Duel page, a new session starts and `prevElo`/`prevRank` are re-captured.
- **Pre-session snapshot**: on session start, capture each item's current rank and ELO → saved to `prevElo`/`prevRank` in the item data for session summary
- **"Session complete" summary**: total duels completed, top 3 biggest rank movers by absolute rank change (e.g., "Attack on Titan ↑ 3 spots"), current top 3
- **Post-session flow**: Summary shows two buttons — "Continue dueling" (starts a new session) and "View rankings" (navigates to Rankings page)
- Stored in list frontmatter (`session_length`)
- **K-factor presets** (shown at list creation + list settings):
  - **Quick** (K=48) — "Rankings shift quickly after each duel"
  - **Gradual** (K=32, default) — "Rankings update at a balanced pace"
  - **Tight** (K=16) — "Rankings resist change, require more evidence"
  - Stored in list frontmatter (`k_factor`)

### 9. First-Run Experience
On first open, the user is redirected to `/welcome` with choices:
1. "Take a quick tour" — guided walkthrough (see tour steps below)
2. "Try a sample list" — pre-loaded list to experience a duel immediately
   - **Sample lists available**: Pizza Toppings, Top Anime, Favorite Movies, Vacation Destinations, Best Snacks, Hobbies
   - Each contains ~8-10 items for a quick first session
   - Sample data defined in `src/data/samples.ts`
3. "Create a new list" — opens create dialog inline. On submit, redirects to `/list/:newId` (the new list's Rankings page).
4. "Import an existing list" — import a local markdown file (Nextcloud connection added in Phase 2)

After completion, redirect to Home (`/`).

**Tour steps** (5-step walkthrough with illustrations):
1. **"Welcome to DuelList"** — "Rank anything by picking winners in quick A-vs-B duels. No need to sort the whole list — just pick one."
2. **"The Duel"** — (illustration of comparison cards) "Two items appear side by side. Pick the winner, declare a tie, or skip."
3. **"Your Ranking Builds Itself"** — (illustration of ranked list) "After each duel, your list re-ranks automatically. The more duels you do, the more accurate it gets."
4. **"Quick Sessions"** — (illustration of progress bar) "Do 5–10 duels a day. It's a habit, not a chore."
5. **"Done!"** — "Create a list or try a sample to get started."

### 10. App Shell & Routing
- **Navigation model**: Home (list of lists) → Rankings (list detail page) → Duel (duel session)
  - Home shows all lists as cards: list name, item count, top-ranked item preview
  - Home page includes "Create list" and "Import list" buttons
  - **Home sort**: Dropdown with options — Recent (default), A-Z, Created, Custom. Selected sort saved to `duellist:settings` (`homeSortOrder`). When "Custom" is selected, a "Reorder" toggle button appears — click to unlock drag-to-reorder, click again to lock. Custom order saved as array of list IDs in `duellist:settings` (`customListOrder`). New lists are appended to the end of custom order. Deleted list IDs are removed from `customListOrder`.
  - `lastOpened` updated when navigating to a list's Rankings page
  - Rankings page shows the ranked list + button to start a duel session + gear icon for list settings
  - **Navigation back**: Back arrow in header (shown on sub-pages only — not on Home) and clickable app logo/title. No breadcrumb trail.
- **Routes**:
  - `/` — Home (list of lists)
  - `/welcome` — First-run onboarding (redirects here if `firstRunDone` is false)
  - `/list/:id` — Rankings (list detail)
  - `/list/:id/duel` — Duel session
  - `/list/:id/settings` — List settings (name, K-factor, session length, removed items, per-list export, delete list)
  - `/list/:id/history` — Per-list duel history viewer (added Phase H)
  - `/settings` — App settings (theme, time format, export all lists, export app data)
  - `/settings/reminders` — Reminder cadence + preferred time + quiet hours (added Phase I)
  - `/settings/glossary` — Glossary of terms, icons, and colors (added Phase I, with stable anchor ids for HelpHint deep-links)
  - `/features` — Feature showcase grid (added Phase H)
  - `*` — NotFound page
- **Display mode**: Each list has `displayMode: 'rank' | 'elo'` persisted in `ListConfig`. UI labels the two views "Rank" and "Score". Toggle button on the Rankings header. The persisted value `'elo'` is preserved for storage compat — do NOT rename without a data migration.
- **Home hero**: When at least one list has ≥2 active items, Home shows a gradient "Random duel" hero card (Swords badge). Tapping picks a list via the weighted-random helper in `src/lib/reminders.ts` and navigates to `/list/:id/duel`. Hidden when no list is duel-eligible. The Rankings page shows a matching hero card in place of the old plain "Start duel" button.
- React Router v7 for page navigation
- PWA manifest + service worker via vite-plugin-pwa
- Key files: `src/App.tsx`, `src/pages/`

### 11. Empty & Error States

| State | Location | Message | Action |
|-------|----------|---------|--------|
| No lists yet (`firstRunDone`=false) | Home page | (Redirect to `/welcome`) | Tour / sample / create / import |
| No lists yet (`firstRunDone`=true) | Home page | "No lists yet. Create one or import a markdown file." | Create list / Import list buttons |
| List has 0 items | Ranking view | "This list is empty. Add some items to get started." | Add items button |
| List has 1 item | Duel page | "You need at least 2 items to start dueling." | Add items button |
| List has 0 comparisons | Ranking view | Show items in import order | Note: "Start comparing to build your ranking" |
| No history yet | History/stats (Phase 3) | "No duels recorded yet. Start comparing!" | Link to Duel page |
| localStorage near limit | Any page (banner) | "Storage is almost full. Export your lists to free up space." | Export button |
| List not found | `/list/:id` (invalid ID) | "List not found." | Button to go Home |
| File sync failed mid-session | Rankings header (icon) | `FileX` icon + tooltip "File link broken — re-link in settings" | Re-link from list Settings |
| File permission revoked between sessions | Rankings header (icon) | Same as above on next mount via `requestPermission` returning `denied` | Re-link from list Settings |
| Render-time exception in any page | Whole app | ErrorBoundary fallback ("Something went wrong") with collapsible stack | Reload button |

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

### 16. Statistics Dashboard
- Total comparisons made
- Confidence level per item
- Comparison history timeline (powered by `.duellist.md` history file)

### 17. Periodic Comparison Prompts
- Setting: "Remind me to compare every N hours/days"
- Browser notifications or in-app prompt on open
- **Phase I in-app banner (shipped)**: `src/lib/reminders.ts` scores eligible lists (favors stale + less-developed) and `pickReminderCandidate` returns the best match honoring cadence + quiet hours. `ReminderBanner` on Home shows the candidate with three actions:
  - **Play** — navigate to `/list/:id/duel`.
  - **Snooze 1d** — suppress that *list* for 24h.
  - **Skip** — mark this candidacy seen; the next eligible list is offered on the next mount/cadence tick.
  - Settings page at `/settings/reminders` configures cadence, preferred time (in-app `PreferredTimePicker`, 12h/24h aware), and quiet hours (15-minute granularity, stored as `quietHoursStartMinute` / `quietHoursEndMinute`).
- **Trend snapshot persistence**: `prevRank` / `prevEloScore` are written to each item at session start. Items that pre-date Phase I have `prevRank: 0` and show no trend until their first new session. Trend backfill is intentionally not done.
- **Phase 3 (deferred)**: OS-level notifications via the service worker.

### 18. Dark Mode / Themes
- Follow system preference
- Manual toggle

### 19. Metadata Support
- Extend markdown parser for inline metadata
- Display metadata on cards during comparison
- Filter/group items by metadata

### 20. Internationalization (i18n)
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
26. [ ] Empty state: 1 item → Duel page shows "need 2 items" message
27. [ ] Empty state: 0 comparisons → ranking view shows import order with "start comparing" note
28. [ ] K-factor presets → Quick/Gradual/Tight options shown at list creation and list settings, different K values produce different ranking behavior
29. [ ] localStorage quota → warning banner appears when storage usage exceeds ~80%
30. [ ] Delete a list → confirmation dialog, list removed from Home, localStorage cleaned up
31. [ ] Edit list settings → gear icon on Rankings, change name/K-factor/session length, changes saved
32. [ ] Soft-delete item → item moves to "Removed items" section, excluded from pairing and ranking
33. [ ] Restore soft-deleted item → item returns to ranking at ELO 1000, prioritized for pairing
34. [ ] Per-list export → downloads list .md and history .duellist.md from list Settings page
35. [ ] First-run onboarding → /welcome route shown on first visit, redirects to Home after completion
36. [ ] Home list cards → show name, item count, and top-ranked item preview
37. [ ] Rename item → edit button on hover/tap, inline edit, ID stays stable
38. [ ] App-wide export → export all lists and app data from /settings page
39. [ ] Soft-delete markdown format → ## Removed section at bottom of file, items preserved with removed flag
40. [ ] Skip re-queue → skipped pair re-presented before new pairs, skip doesn't count toward session counter
41. [ ] Re-import collision → prompt "Replace existing" or "Import as new list" when frontmatter ID matches
42. [ ] Home page actions → "Create list" and "Import list" buttons visible after first-run
43. [ ] List not found → /list/:id with invalid ID shows "List not found" with Home button
44. [ ] History in localStorage → duel entries stored, exportable, enables pairing cooldown for all users
45. [ ] Home sort dropdown → Recent/A-Z/Created/Custom options, selection persisted in settings
46. [ ] Home custom reorder → Reorder toggle enables drag-to-reorder, custom order saved
47. [ ] Export all as zip → all .md + .duellist.md files bundled in a single .zip download
48. [ ] Export app data → full localStorage dump as JSON file
49. [ ] Navigation back → back arrow in header + clickable logo, no breadcrumb

### Phase I (post-H, shipped)
50. [ ] Reminders banner → Home shows `ReminderBanner` for eligible list; Snooze 1d / Skip / Play actions work
51. [ ] Reminder settings → cadence, preferred time (12h/24h picker), quiet hours (15-min granularity) persist via `duellist:settings`
52. [ ] Glossary page → `/settings/glossary` lists Terminology + visual sections; anchor links work (`#score`, `#rank`, `#session`, etc.)
53. [ ] HelpHint icons → Rankings (Score/Rank toggle), Duel (session counter), ItemDetailsDialog (Rank/Score tiles) deep-link to matching Glossary anchor
54. [ ] Score terminology → UI says "Score"; storage still uses `eloScore` and `displayMode: 'elo'`
55. [ ] Display mode toggle → Rankings switches between Rank (#1… with podium chips) and Score views; persists per list
56. [ ] Trend arrows → after a new session, items show TrendingUp/Down + delta on Rankings; alignment stable across all rows (fixed-width slot)
57. [ ] Random-duel hero → Home shows gradient hero when any list has ≥2 items; quick-duel chip on each ListCard
58. [ ] Rankings hero → in-list page shows matching hero card in place of plain "Start duel" button
59. [ ] ItemDetailsDialog → row dropdown “Details” opens dialog with stat tiles + last-duels list; ScrollArea handles overflow
60. [ ] Removed-items → collapsible section sorted by score desc; restore preserves stats; ScrollArea handles overflow
61. [ ] 12h/24h time format → setting in App settings flows through Reminders, History DuelRow, ItemDetailsDialog
62. [ ] PageSkeleton → lazy-route Suspense fallbacks render Home/Rankings/default skeletons instead of "Loading…" text
63. [ ] ErrorBoundary → thrown render error shows fallback UI with Reload + collapsible stack instead of blank screen

### Phase 2
1. [ ] Connect to Nextcloud → file read/write via WebDAV works
2. [ ] Modify markdown on Nextcloud → sync brings in new items unranked
