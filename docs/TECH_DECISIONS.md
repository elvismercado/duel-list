# DuelList — Technical Decisions & Context

> Date: April 21, 2026

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | React 19 + TypeScript | User preference. Strong ecosystem, familiar |
| **Build tool** | Vite | Fast dev server, modern defaults, great DX |
| **Styling** | Tailwind CSS v4 | Utility-first, rapid prototyping, small bundle |
| **Components** | shadcn/ui (Radix + Tailwind) | Accessible, ownable (copied into codebase, not a dependency). Works with PWA + Tauri |
| **Animations** | Framer Motion (Phase 1b) | Swipe gestures deferred to Phase 1b |
| **Persistence** | Markdown files (no DB) | Portable, human-readable, single source of truth |
| **PWA** | vite-plugin-pwa | Installable, offline-capable, minimal setup |
| **Routing** | React Router v7 | Standard React routing solution |
| **YAML parsing** | `yaml` + manual split | ESM-native, actively maintained, read + write. No `gray-matter` (Buffer/ESM issues in Vite) |
| **Export bundling** | JSZip (Phase 1) | Bundle multiple .md files into single .zip download |
| **Package manager** | pnpm | Fast, strict dependency resolution, disk-efficient |

## Architecture Decisions

### 1. Markdown-Based Persistence with localStorage Working Copy

**Decision**: All ranking data is stored in markdown files (portable, human-readable). The app uses localStorage as the active working copy for fast reads/writes, with markdown files as sync targets for backup and sharing.

**How it works**:
- Per-item ranking data (ELO score, comparison count) is embedded as HTML comments in the markdown file
- List-level config (id, name, session length, created date) lives in YAML frontmatter
- List order in the file = rank order (re-sorted on every save)
- Duel history stored in a companion `.duellist.md` file (optional, auto-generated)
- **localStorage** holds the active working copy — the app always reads/writes here first
- **Markdown files** are the portable sync targets — if localStorage is cleared, re-import the markdown files to restore everything
- **IndexedDB** is used only to persist File System Access API file handles (desktop Chrome/Edge), so users don't have to re-pick files on reload. Not used for ranking data.

**Rationale**:
- localStorage is fast, synchronous, and available in all browsers
- Markdown files remain the portable source of truth — all ranking data is embedded in the file
- No data loss when browser cache clears — user re-imports the markdown file
- Nextcloud sync becomes trivial — just sync one file (or two with history)
- File stays human-readable — HTML comments are invisible in markdown viewers
- Users can open/edit the file in any text editor, GitHub, Obsidian, VS Code, etc.

**Tradeoffs accepted**:
- Comparison history would bloat the main file → solved by companion `.duellist.md`
- Manual edits could corrupt embedded data → mitigated by resilient parser (ignores malformed comments)
- File written after every duel → acceptable for local files and Nextcloud sync
- localStorage has a ~5-10MB limit per origin → monitor usage and warn at ~80% capacity

### 2. File Format: Frontmatter + HTML Comments

**Decision**: Use YAML frontmatter for list config and HTML comments for per-item ranking data.

**Canonical format**:
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
```

**Rationale**:
- Frontmatter is a widely understood convention (Jekyll, Hugo, Obsidian, etc.)
- HTML comments are invisible when rendered — file looks clean everywhere
- Both are part of standard markdown/HTML — no proprietary format

### 3. List Naming: Frontmatter as Canonical Source

**Decision**: The `name:` field in frontmatter is the display name. On import of a plain markdown file, the `# Heading` is extracted and moved to frontmatter.

**Import flow**:
1. User imports a plain markdown file with `# My Top Anime` heading
2. App extracts heading text → sets `name: My Top Anime` in frontmatter
3. Heading is removed; frontmatter becomes the canonical name source
4. Items get default ELO (1000) on first save

**Rationale**:
- Frontmatter is the clean, machine-readable place for metadata
- Avoids duplication between heading and frontmatter name
- Import is forgiving — handles files with or without frontmatter
- **Re-import collision**: If the imported file's frontmatter `id` matches an existing list, prompt the user: "Replace existing" or "Import as new list" (generates a new ID)

### 4. Companion History File

**Decision**: Duel history is stored in localStorage under `duellist:history:<id>` as a raw markdown string (same format as the `.duellist.md` file). This ensures all users — including mobile and Firefox — have exportable history and pairing cooldown between sessions. On desktop (Chrome/Edge), the companion `.duellist.md` file is also kept in sync via file handle.

**Format**:
```markdown
# My Top Anime — Duel History
> Auto-generated by DuelList. 847 duels recorded.

## 2026-04-21
- One Piece [x7k2] > Naruto [a1b2]
- Attack on Titan [m3p9] > Naruto [a1b2]
- One Piece [x7k2] = Attack on Titan [m3p9]
```

**Rationale**:
- Main list file stays clean (no history bloat)
- History is human-readable markdown
- Can be deleted without affecting rankings (ELO is in the main file)
- Useful for Phase 3 statistics (trend visualization, preference shifts)
- Easy to sync alongside the list on Nextcloud

### 5. ELO Rating System

**Decision**: Use ELO for ranking items. Hidden from users.

**Rationale**:
- Well-understood algorithm, used in chess and many ranking systems
- Handles preference changes over time (recent comparisons matter more with higher K-factor)
- Doesn't require full re-sort when preferences change
- Can start with simple ELO and upgrade to TrueSkill or Bradley-Terry later if needed
- Formula: `newRating = oldRating + K * (actual - expected)` where `expected = 1 / (1 + 10^((opponentRating - rating) / 400))`
- **K-factor**: Default K=32, configurable per list (stored in frontmatter). Higher K = faster convergence but more volatile. Lower K = more stable but slower to adapt.
- **ELO tiebreaker**: When items have the same ELO score, they retain their import order in the ranking.

**User-facing**: Users never see ELO numbers. They see ordinal rank positions (#1, #2, #3...). During duels, cards show: item name, current rank position, and comparison count.

### 6. Smart Pairing Algorithm

**Decision**: Prioritize uncertain items, then close-ranked items.

**Strategy**:
1. Find items with the fewest comparisons (highest uncertainty)
2. Among those, prefer items close in current ELO score (refines ranking boundaries)
3. Avoid pairs compared in the last N duels, where N = list size (soft preference — if all pairs are on cooldown, fall back to least-recently-compared pair)
4. Random tiebreaker for equal candidates
5. New items (ELO 1000) are prioritized for comparisons automatically

### 7. Ties and Skips

**Decision**: Both allowed during duels.

- **Tie**: Standard ELO tie handling — both sides get `actual = 0.5`. This means upset ties (low-rated ties high-rated) still shift ratings. Recorded in history as `A [id] = B [id]`.
- **Skip**: Pair deferred to a session-local re-queue, checked before generating new pairs. Not recorded in history. Skips do not count toward the session counter.

### 8. Side-by-Side Only in Phase 1

**Decision**: Swipe mode (Tinder-style) deferred to Phase 1b. Phase 1 ships with side-by-side click-to-pick only. Post-duel animations (winner grows, loser shrinks) use CSS transitions/`@keyframes` — Framer Motion is only added in Phase 1b for swipe gestures.

**Rationale**:
- Side-by-side is simpler to implement and works on all screen sizes
- Swipe requires Framer Motion + gesture handling — additional complexity
- Getting the ranking engine right matters more than the comparison UI for launch
- Keyboard shortcuts (← → T S) provide efficient desktop interaction

### 9. No Backend in Phase 1

**Decision**: Phase 1 is fully client-side. No server, no database, no user accounts.

**Rationale**:
- This is a personal tool, not a social platform
- Markdown files handle persistence
- File import/export via browser File API
- Keeps deployment simple (static hosting)
- Backend only becomes necessary if Nextcloud CORS is a problem (Phase 2)

### 10. Save After Every Duel

**Decision**: Write ranking data after every single duel, not batched to end of session. Write to localStorage immediately (the working copy). If a file handle is available (desktop Chrome/Edge via File System Access API), also sync to the markdown file.

**Rationale**:
- No data loss if the user closes the tab mid-session
- localStorage write is synchronous and fast — no perceived delay during post-duel animation
- File System Access API not available in all browsers (no Firefox, no Safari iOS)
- For unsupported browsers: localStorage is the working copy; user exports markdown manually
- For supported browsers: localStorage + file sync after every duel provides seamless persistence

### 11. Item IDs

**Decision**: Each item gets a short random ID generated on first import, persisted in the HTML comment JSON.

**Format**: `<!-- {"id":"a1b2","elo":1000,"prevElo":1000,"prevRank":1,"comparisons":0,"added":"2026-04-21"} -->`

**Generation**:
- 4 characters, lowercase alphanumeric (`a-z0-9`) — 1,679,616 possible values
- Generated via `crypto.getRandomValues()` — no external dependencies
- Uniqueness checked within the list before assigning; retry on collision
- Same spec used for list IDs in frontmatter

**Rationale**:
- Stable across renames — if user changes "Naruto" to "Naruto Shippuden", the ID stays the same (inline rename on Rankings page changes the name but ID is preserved)
- Enables reliable duel history tracking (history references IDs internally, displays names)
- Duplicate item names are allowed — each gets a unique ID

### 12. PWA from Phase 1

**Decision**: Ship as a PWA from the start using `vite-plugin-pwa`.

**Rationale**:
- Minimal effort with Vite — just add the plugin + manifest + icons
- Gives mobile users an app-like experience (installable, full-screen, offline)
- Offline-capable aligns with the local-first philosophy
- No app store required
- Natural stepping stone: Web → PWA → Tauri (native desktop)

### 13. shadcn/ui for Components

**Decision**: Use shadcn/ui (built on Radix primitives + Tailwind).

**Rationale**:
- Components are copied into the codebase — no external dependency lock-in
- Full Tailwind customization — matches the styling approach
- Accessible out of the box (Radix handles ARIA, focus management, keyboard nav)
- Works everywhere the web works: browser, PWA, Tauri, Capacitor
- Does NOT work with React Native (but that's not on the roadmap)

### 14. Cross-Platform Strategy: Web → PWA → Tauri

**Decision**: Build web-first, add PWA support in Phase 1, wrap with Tauri later for native apps.

| Platform | Compatibility | Notes |
|----------|:--:|-------|
| **Web (browser)** | ✓ | Primary target |
| **PWA** | ✓ | Phase 1, installable + offline |
| **Tauri (native desktop)** | ✓ | Future — same React + shadcn/ui codebase, Rust-based, small binary |
| **Capacitor (native mobile)** | ✓ | Future option — web app in native shell |
| **React Native** | ✗ | Would require full UI rewrite — not planned |

### 15. localStorage Architecture

**Decision**: localStorage is the app's working copy. All reads and writes go through localStorage first. Markdown files are sync targets.

**Key structure**:
```
duellist:lists          → [{id, name, lastOpened}, ...]                // list registry
duellist:list:<id>      → {full list JSON (ListConfig + items)}         // per-list data
duellist:history:<id>   → raw markdown string (duel history entries)     // per-list history
duellist:settings       → {firstRunDone, theme, homeSortOrder,          // app preferences
                           customListOrder, ...}
```

**Rationale**:
- localStorage is synchronous — no async overhead for reads during rendering
- Available in all browsers (unlike File System Access API)
- Markdown files serve as the portable backup — if localStorage is cleared, re-import to restore
- IndexedDB is used only for persisting File System Access API file handles (desktop Chrome/Edge) — file handles cannot be serialized to localStorage

**Quota management**:
- localStorage limit is ~5-10MB per origin
- Monitor usage and warn user at ~80% capacity
- A 500-item list with full metadata is ~50-100KB; 10 such lists is ~0.5-1MB — well within limits for typical use

### 16. Pairing Cooldown Derived from History

**Decision**: The pairing cooldown (avoid recently compared pairs) is derived from the companion history file on list load, then cached in-memory during the session. No separate cooldown storage.

**How it works**:
- On list load: parse the last N entries from `duellist:history:<id>` in localStorage (N = list size). Falls back to `.duellist.md` file if localStorage history is empty.
- Build an in-memory `Set<string>` of recently compared pair keys (canonical order: smaller ID first)
- During session: update the set after each duel, evict oldest when size > N
- On save: nothing extra — the history append to localStorage already happens per duel

**Degraded scenarios**:
- localStorage history cleared + re-import → cooldown derived from `.duellist.md` file if present, else empty
- Both lost → pairing uses comparison counts and ELO scores (steps 1-2), which are in the markdown file

**Rationale**:
- Cooldown is an optimization, not a correctness concern — rankings converge regardless of pair order
- No invisible state divergence — everything derives from the portable markdown files
- Sub-millisecond parse cost for 500 entries

### 17. No Undo in Phase 1

**Decision**: Users cannot undo a duel decision in Phase 1. Planned for a future phase as recursive LIFO undo (undo last duel, then the one before, etc.).

**Future undo design**:
- Reverse the ELO change (DuelRecord has both item IDs and the winner)
- Decrement comparison counts for both items
- Remove the last entry from the history file
- Recursive: undo the most recent duel first, then the next, etc.

**Rationale**:
- Keeps Phase 1 simple — skip button exists for uncertain comparisons
- The current data model (DuelRecord with item IDs, winner, timestamp) supports undo without changes
- ELO reversal is straightforward: `oldRating = newRating - K * (actual - expected)`

### 18. Soft-Delete Items

**Decision**: Deleted items are not permanently removed in Phase 1. They move to a soft-delete bucket — excluded from pairing and ranking, but restorable.

**Markdown format**: Soft-deleted items are written to a `## Removed` section at the bottom of the markdown file:
```markdown
## Removed
- Naruto <!-- {"id":"a1b2","elo":1042,"prevElo":1050,"prevRank":2,"comparisons":12,"added":"2026-04-21","removed":true} -->
```
On parse, items under `## Removed` are loaded into the soft-delete bucket. On write, active items appear first (ranked by ELO), then the `## Removed` section with bucket items. The `"removed":true` flag in the JSON comment is the canonical marker.

**Visibility**:
- Collapsed "Removed items" section at the bottom of the Rankings page
- Full list of removed items in the list's Settings page (`/list/:id/settings`)
- Items can be restored from either location

**On restore**:
- Item returns to the active list with its original ID preserved
- `eloScore` reset to 1000
- `prevEloScore` reset to 1000
- `prevRank` set to last position (current item count)
- `comparisonCount` reset to 0
- `added` set to current date (treated as a fully new item)
- `removed` flag removed
- Prioritized for pairing (same as newly added items)

**Rationale**:
- Prevents accidental permanent data loss without implementing full undo
- Simple UX — user can see what was removed and bring it back
- `## Removed` section in the markdown file ensures soft-delete state is portable across devices and re-imports

### 19. Session Lifecycle

**Decision**: Duel session progress is ephemeral — stored in component state, not persisted. Each visit to the Duel page starts a fresh session.

**How it works**:
- Navigating to `/list/:id/duel` starts a new session automatically
- `prevElo`/`prevRank` are re-captured for all items at session start
- Session counter (e.g., 5/10 duels) lives in React component state
- ELO updates are saved to localStorage after every duel (safe)
- If user navigates away mid-session, session progress is lost but all ELO changes are preserved
- On return, a fresh session starts with new `prevElo`/`prevRank` snapshot

**Post-session flow**:
- Session summary shows: duel count, top 3 biggest movers, current top 3
- Two buttons: "Continue dueling" (starts new session) and "View rankings" (navigates to Rankings)

**Rationale**:
- Simplest correct approach — no session state to persist or recover
- ELO safety guaranteed by per-duel saves
- `prevElo`/`prevRank` may differ from "true" session start if user navigated away, but this is acceptable — session summary is informational, not authoritative

### 20. YAML Parser: `yaml` + Manual Split

**Decision**: Use the `yaml` npm package for YAML parsing/stringifying, with a manual ~5-line regex split for frontmatter delimiters (`---`). Do not use `gray-matter`.

**Rationale**:
- `gray-matter` has known `Buffer` and ESM compatibility issues in Vite/browser environments and hasn't been updated in 5+ years
- `front-matter` is read-only — no `stringify()`, which we need to write frontmatter back
- `yaml` is actively maintained, has native ESM + browser exports, built-in TypeScript types, and zero dependencies
- The manual split is trivial (`raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)`) and gives full control

### 21. History Append: Tail Parsing

**Decision**: Duel history is stored as a raw markdown string — identical format in both `duellist:history:<id>` (localStorage) and `.duellist.md` (file). Append via tail parsing; no structured JSON intermediate.

**How it works**:
- On each duel, `lastIndexOf('\n## ')` finds the last date header in the string
- If the header matches today's date → append the new line at the end
- If not → add a new `## YYYY-MM-DD` header, then the line
- The duel count on line 2 (`> Auto-generated by DuelList. N duels recorded.`) is incremented via substring splice
- The same string is written to both localStorage and the file handle (if available)

**Rationale**:
- Same format everywhere = zero drift between localStorage and file
- String concat is 5-10x faster than `JSON.parse`/`JSON.stringify` for the same payload
- Already export-ready — the stored string IS the export file content
- Cooldown parsing (once per session start) walks backward through lines with a regex

### 22. Export All via Zip

**Decision**: "Export all lists" bundles all `.md` + `.duellist.md` files into a single `.zip` download using JSZip (~45KB gzipped). "Export app data" is a full localStorage dump — all `duellist:*` keys serialized as a JSON file.

**Rationale**:
- Zip avoids poor UX of triggering multiple sequential file downloads
- Full localStorage dump is the simplest bulk backup — easy to re-import as restore
- JSZip is well-maintained and lightweight

### 23. Home Sort & Custom Order

**Decision**: Home page has a sort dropdown with 4 options: Recent (default), A-Z, Created, Custom. Selection persisted in `duellist:settings` (`homeSortOrder`). When "Custom" is selected, a "Reorder" toggle button appears. Click to unlock drag-to-reorder; click again to lock. Custom order saved as array of list IDs in `duellist:settings` (`customListOrder`). New lists are appended to end of custom order. Deleted list IDs are removed from `customListOrder`.

**Rationale**:
- Sort dropdown covers the common cases without complexity
- Custom order gives power users full control without cluttering the default experience
- Toggle lock prevents accidental reordering during normal use

### 24. Navigation: No Breadcrumb

**Decision**: No breadcrumb trail in the header. Users navigate back via: browser back button, back arrow icon in header (shown on sub-pages only — not on Home), or clickable app logo/title.

**Rationale**:
- Breadcrumbs add visual clutter for a simple 2-3 level hierarchy
- Back arrow + logo click covers all navigation needs
- Consistent with mobile app patterns (where breadcrumbs are rare)

---

## User Requirements (from conversation)

### Must Have
- [x] List management: create, import, add items, export lists
- [x] Markdown-based lists for simplicity and portability
- [x] Markdown-only persistence (no database)
- [x] Side-by-side comparison mode (click-to-pick)
- [x] Ties and skips allowed during duels
- [x] Winner moves up in ranking via ELO (ELO hidden from user)
- [x] Configurable session length (quick daily bursts as default)
- [x] PWA support (installable, offline-capable)
- [x] Nextcloud sync via WebDAV (Phase 2)
- [x] Local list option for users who don't want cloud sync
- [x] First-run experience with choices (tour, sample, create, connect)

### Nice to Have
- [ ] Swipe mode — Tinder-style comparison (Phase 1b)
- [ ] Metadata support: "when I watched it first", "when I watched it last" (Phase 3)
- [ ] Statistics dashboard with comparison history (Phase 3)
- [ ] Other cloud storage integrations beyond Nextcloud
- [ ] Cross-platform native apps (Tauri)
- [ ] Periodic comparison reminders/notifications

### Out of Scope
- User accounts / authentication (beyond Nextcloud credentials)
- Multi-user / social features
- Server-side ranking computation
- Mobile app stores (for now)
- React Native

---

## File Structure (Planned)

```
src/
├── App.tsx                          # App shell, routing
├── main.tsx                         # Entry point
├── types.ts                         # Core type definitions
├── data/
│   └── samples.ts                   # Sample list definitions (6 pre-built lists)
├── lib/
│   ├── markdown.ts                  # Markdown parser/writer (frontmatter + HTML comments)
│   ├── ranking.ts                   # ELO rating system
│   ├── pairing.ts                   # Smart pair selection
│   ├── history.ts                   # History append (tail parsing) + cooldown parsing
│   ├── storage.ts                   # localStorage read/write + quota monitoring
│   ├── strings.ts                   # UI string constants (i18n prep)
│   ├── nextcloud.ts                 # WebDAV client (Phase 2)
│   └── sync.ts                      # Bi-directional sync (Phase 2)
├── locales/                         # Translation JSON files (Phase 3)
│   ├── en.json
│   ├── nl.json
│   ├── es.json
│   └── pap.json
├── components/
│   ├── SideBySideMode.tsx           # Click-to-pick comparison
│   ├── SwipeMode.tsx                # Tinder-style swipe comparison (Phase 1b)
│   ├── RankingView.tsx              # Ranked list display
│   ├── ListManager.tsx              # Create/import/export lists
│   ├── NextcloudSettings.tsx        # Nextcloud config (Phase 2)
│   └── FileBrowser.tsx              # Nextcloud file picker (Phase 2)
├── pages/
│   ├── Home.tsx                     # List selector + first-run redirect
│   ├── Welcome.tsx                  # First-run onboarding (/welcome)
│   ├── Duel.tsx                     # Active duel session (/list/:id/duel)
│   ├── Rankings.tsx                 # View rankings (/list/:id)
│   ├── ListSettings.tsx             # List settings (/list/:id/settings)
│   └── Settings.tsx                 # App settings + export (/settings)
└── hooks/
    ├── useComparison.ts             # Comparison session logic
    ├── useList.ts                   # List CRUD operations
    └── useExport.ts                 # Export list/history/app data
```

---

## Session Context

- Repo is at `c:\git\elvismercado\duel-list`
- GitHub repo: `elvismercado/duel-list` (public)
- User prefers React for frontend
- User uses Nextcloud for cloud storage
- Primary use case: ranking anime and games, but app is generic for any list type
- User wants markdown-only persistence (no database)
- User wants metadata support added incrementally (start simple)
- Package manager: pnpm
- Target list size: up to 500 items comfortably
