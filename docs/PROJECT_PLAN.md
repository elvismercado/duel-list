# DuelList — Project Plan

> **Project Name**: DuelList
> **Created**: April 21, 2026
> **Repo**: list-ranker

## Overview

DuelList is a web app that lets users rank items in a list through pairwise comparisons. The user maintains a list (e.g., every anime they've watched), and the app periodically shows two items, asking "which is better?" Over time, these repeated A-vs-B choices produce a definitive ranking from best to worst.

### Core Concept

- **Pairwise comparison ranking**: Instead of manually sorting a list, the user just picks a winner between two items repeatedly
- **Two comparison modes**: Swipe (Tinder-style) and Side-by-side (click-to-pick)
- **Markdown-based lists**: Lists are stored as simple markdown files for portability and human-readability
- **Cloud sync**: Lists can be synced with Nextcloud (via WebDAV), with support for other cloud storage in the future
- **Local-first**: Works entirely offline; no backend required for Phase 1

---

## Phase 1: Core Foundation (Local-Only)

**Goal**: Fully functional local app — create/import lists, compare items, view rankings.

### 1. Project Scaffolding
- Vite + React + TypeScript
- Tailwind CSS for styling
- Framer Motion for swipe animations
- Key config files: `vite.config.ts`, `tailwind.config.ts`, `package.json`

### 2. Markdown List Parser/Writer
- Parse simple markdown bullet lists into internal data model
- Write ranked lists back to markdown
- Keep parser extensible for future metadata support

**Simple format (Phase 1):**
```markdown
# My Anime List
- Naruto
- One Piece
- Attack on Titan
- Fullmetal Alchemist: Brotherhood
```

**Future format with metadata (Phase 3):**
```markdown
# My Anime List
- Naruto [first_watched: 2005] [last_watched: 2024]
- One Piece [first_watched: 2003]
- Attack on Titan [first_watched: 2013] [last_watched: 2023]
```

- Key file: `src/lib/markdown.ts`

### 3. Data Model & Persistence
- Define types: `Item`, `ComparisonRecord`, `ListConfig`, `RankingData`
- Persist ranking data (ELO scores, comparison history) in IndexedDB via Dexie.js
- The markdown file stays human-readable; ranking metadata lives separately

**Core types:**
```typescript
interface Item {
  id: string;
  name: string;
  metadata?: Record<string, string>;
  eloScore: number;
  comparisonCount: number;
}

interface ComparisonRecord {
  itemA: string; // item ID
  itemB: string; // item ID
  winner: string; // item ID
  timestamp: number;
}

interface ListConfig {
  id: string;
  name: string;
  source: 'local' | 'nextcloud';
  filePath?: string;
  items: Item[];
  rankings: ComparisonRecord[];
}
```

- Key files: `src/types.ts`, `src/lib/storage.ts`

### 4. Comparison Engine
Smart pairing algorithm + ELO rating system:

- **Pairing strategy**:
  - Prioritize items with fewest comparisons (high uncertainty)
  - Among those, prefer items close in current rank (refines boundaries)
  - Avoid recently compared pairs
- **Rating system**: ELO with adjustable K-factor
  - Winner gains points, loser loses points
  - Magnitude depends on expected outcome (upset = bigger change)

- Key files: `src/lib/ranking.ts`, `src/lib/pairing.ts`

### 5. Swipe UI Mode (Tinder-Style)
- Two stacked cards shown
- Swipe right = left item wins, swipe left = right item wins
- Framer Motion for drag/swipe gesture handling
- Mobile-friendly touch support
- Key file: `src/components/SwipeMode.tsx`

### 6. Side-by-Side UI Mode
- Two items displayed as cards, side by side
- Click/tap the better one
- Simple, accessible, works well on desktop
- Key file: `src/components/SideBySideMode.tsx`

### 7. Ranking Display
- Full list sorted by ELO score, top to bottom
- Show rank number, item name, score, and comparison count
- Toggle between "ranked view" and "original order"
- Key file: `src/components/RankingView.tsx`

### 8. List Management
- Create new list (type items manually)
- Import markdown file (file picker)
- Export ranked list as markdown
- Multiple lists supported (independent rankings)
- Key files: `src/components/ListManager.tsx`, `src/pages/Home.tsx`

### 9. App Shell & Routing
- Layout with navigation: Home → Compare → Rankings
- React Router for page navigation
- Key files: `src/App.tsx`, `src/pages/`

---

## Phase 2: Nextcloud Integration

**Goal**: Sync lists with Nextcloud via WebDAV.

### 10. WebDAV Client
- Use `webdav` npm package for WebDAV operations (list, read, write files)
- Handle authentication (basic auth or app tokens)
- Key file: `src/lib/nextcloud.ts`

### 11. CORS Handling
- Try direct WebDAV from browser first
- If CORS blocks it, options:
  - Configure Nextcloud CORS headers (ideal)
  - Add lightweight Node.js/Express proxy server
  - Browser extension approach (less ideal)
- Decision: try direct first, add proxy if needed

### 12. Sync UI
- Settings page: configure Nextcloud URL + credentials
- File browser: select markdown file from Nextcloud
- Manual sync button (auto-sync optional later)
- Conflict resolution: last-write-wins to start
- Key files: `src/components/NextcloudSettings.tsx`, `src/components/FileBrowser.tsx`

### 13. Bi-Directional Sync
- Items added to markdown on Nextcloud → appear unranked in app
- Items ranked in app → markdown file updated with new order
- Ranking metadata stored in companion `.duellist.json` file alongside the markdown
- Key file: `src/lib/sync.ts`

---

## Phase 3: Polish & Extras

### 14. Periodic Comparison Prompts
- Setting: "Remind me to compare every N hours/days"
- Browser notifications or in-app prompt on open

### 15. Comparison Session Settings
- "How many comparisons per session?" (5, 10, 20, unlimited)
- Progress bar during session

### 16. Statistics
- Total comparisons made
- Confidence level per item
- Comparison history timeline

### 17. Dark Mode / Themes
- Follow system preference
- Manual toggle

### 18. Metadata Support
- Extend markdown parser for inline metadata
- Display metadata on cards during comparison
- Filter/group items by metadata
- Metadata fields: `first_watched`, `last_watched`, and user-defined fields

---

## Verification Checklist

1. [ ] Import a 10-item markdown file → all items parsed correctly
2. [ ] Run 20+ comparisons → ranking stabilizes with preferred items at top
3. [ ] Export ranked list to markdown → ordering matches displayed ranking
4. [ ] Test swipe mode on mobile viewport → gesture works smoothly
5. [ ] Test side-by-side mode on desktop → click-to-pick works
6. [ ] Create two separate lists → independent rankings maintained
7. [ ] (Phase 2) Connect to Nextcloud → file read/write via WebDAV works
8. [ ] (Phase 2) Modify markdown on Nextcloud → sync brings in new items unranked
