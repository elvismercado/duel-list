# DuelList — Technical Decisions & Context

> Date: April 21, 2026

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Framework** | React 19 + TypeScript | User preference. Strong ecosystem, familiar |
| **Build tool** | Vite | Fast dev server, modern defaults, great DX |
| **Styling** | Tailwind CSS v4 | Utility-first, rapid prototyping, small bundle |
| **Animations** | Framer Motion | Best-in-class for swipe/drag gestures in React |
| **Persistence** | Dexie.js (IndexedDB) | Client-side structured storage, no backend needed |
| **WebDAV** | `webdav` npm package | Mature WebDAV client for Nextcloud integration |
| **Routing** | React Router v7 | Standard React routing solution |

## Architecture Decisions

### 1. Storage Split: Markdown + IndexedDB

**Decision**: Keep the markdown file as a clean, human-readable list. Store all ranking data (ELO scores, comparison history) separately in IndexedDB.

**Rationale**:
- Markdown file stays portable — can be opened/edited in any text editor
- Ranking data is app-specific and would clutter the markdown
- When syncing via Nextcloud, a companion `.duellist.json` file stores ranking metadata alongside the markdown
- Users can share the markdown list without sharing their personal rankings

### 2. ELO Rating System

**Decision**: Use ELO for ranking items.

**Rationale**:
- Well-understood algorithm, used in chess and many ranking systems
- Handles preference changes over time (recent comparisons matter more with higher K-factor)
- Doesn't require full re-sort when preferences change
- Can start with simple ELO and upgrade to TrueSkill or Bradley-Terry later if needed
- Formula: `newRating = oldRating + K * (actual - expected)` where `expected = 1 / (1 + 10^((opponentRating - rating) / 400))`

### 3. Smart Pairing Algorithm

**Decision**: Prioritize uncertain items, then close-ranked items.

**Strategy**:
1. Find items with the fewest comparisons (highest uncertainty)
2. Among those, prefer items close in current ELO score (refines ranking boundaries)
3. Avoid pairs compared in the last N rounds (prevent staleness)
4. Random tiebreaker for equal candidates

### 4. No Backend in Phase 1

**Decision**: Phase 1 is fully client-side. No server, no database, no user accounts.

**Rationale**:
- This is a personal tool, not a social platform
- IndexedDB handles persistence
- File import/export via browser File API
- Keeps deployment simple (static hosting)
- Backend only becomes necessary if Nextcloud CORS is a problem (Phase 2)

### 5. Cross-Platform Future via Tauri

**Decision**: Build web-first, wrap with Tauri later for native apps.

**Rationale**:
- Web app is the fastest to build and deploy
- Tauri is lightweight (Rust-based, uses system webview, small binary)
- Same React codebase works in Tauri
- Tauri has native file system access, which solves Nextcloud/local file issues
- This is a future phase, not initial scope

---

## User Requirements (from conversation)

### Must Have
- [x] List management: create, import, export lists
- [x] Markdown-based lists for simplicity and portability
- [x] Two comparison modes: Swipe (Tinder-style) + Side-by-side (click-to-pick)
- [x] Winner moves up in ranking, especially above the item it beat
- [x] Periodic comparisons that gradually build a ranking over time
- [x] Nextcloud sync via WebDAV (Phase 2)
- [x] Local list option for users who don't want cloud sync
- [x] Metadata support: "when I watched it first", "when I watched it last", and other fields

### Nice to Have
- [ ] Multiple comparison modes (more than swipe + side-by-side)
- [ ] Other cloud storage integrations beyond Nextcloud
- [ ] Cross-platform native apps (Tauri)
- [ ] Periodic comparison reminders/notifications

### Out of Scope
- User accounts / authentication (beyond Nextcloud credentials)
- Multi-user / social features
- Server-side ranking computation
- Mobile app stores (for now)

---

## File Structure (Planned)

```
src/
├── App.tsx                          # App shell, routing
├── main.tsx                         # Entry point
├── types.ts                         # Core type definitions
├── lib/
│   ├── markdown.ts                  # Markdown parser/writer
│   ├── ranking.ts                   # ELO rating system
│   ├── pairing.ts                   # Smart pair selection
│   ├── storage.ts                   # IndexedDB via Dexie.js
│   ├── nextcloud.ts                 # WebDAV client (Phase 2)
│   └── sync.ts                      # Bi-directional sync (Phase 2)
├── components/
│   ├── SwipeMode.tsx                # Tinder-style swipe comparison
│   ├── SideBySideMode.tsx           # Click-to-pick comparison
│   ├── RankingView.tsx              # Ranked list display
│   ├── ListManager.tsx              # Create/import/export lists
│   ├── NextcloudSettings.tsx        # Nextcloud config (Phase 2)
│   └── FileBrowser.tsx              # Nextcloud file picker (Phase 2)
├── pages/
│   ├── Home.tsx                     # List selector
│   ├── Compare.tsx                  # Active comparison session
│   └── Rankings.tsx                 # View rankings
└── hooks/
    ├── useComparison.ts             # Comparison session logic
    └── useList.ts                   # List CRUD operations
```

---

## Session Context

- Repo is at `c:\git\elvismercado\list-ranker`
- Repo was empty at start of session
- User prefers React for frontend
- User uses Nextcloud for cloud storage
- Primary use case: ranking anime watched, but app should be generic for any list
- User wants markdown file format for broad compatibility
- User wants metadata support added incrementally (start simple)
