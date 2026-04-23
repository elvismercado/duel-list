# DuelList — Implementation Status

> Last updated: 2026-04-22

## Phase A: Project Scaffolding — COMPLETE

- [x] Initialize project with pnpm
- [x] Install all dependencies (React 19, TypeScript 6, Vite 7, Tailwind v4, etc.)
- [x] Fix esbuild build scripts approval (onlyBuiltDependencies)
- [x] Create Vite config (`vite.config.ts`) with React, Tailwind, and PWA plugins
- [x] Create TypeScript config (`tsconfig.json`) with `@/` path alias
- [x] Create entry files (`index.html`, `src/main.tsx`, `src/App.tsx`)
- [x] Configure Tailwind v4 (`src/index.css`)
- [x] Initialize shadcn/ui (Radix library, Nova preset, Geist font)
- [x] Create core types (`src/types.ts` — Item, DuelRecord, ListConfig)
- [x] Create string constants (`src/lib/strings.ts` — i18n prep)
- [x] Verify dev server runs (`pnpm dev` → Vite v7.3.2 on localhost:5173)

### Files created
- `package.json` — scripts: dev, build, preview
- `vite.config.ts` — React + Tailwind + PWA plugins, `@/` alias
- `tsconfig.json` — strict, bundler resolution, `@/` path alias
- `index.html` — entry HTML
- `src/main.tsx` — React root mount
- `src/App.tsx` — placeholder App component
- `src/index.css` — Tailwind v4 + shadcn theme (Nova/Geist)
- `src/vite-env.d.ts` — Vite client types
- `src/types.ts` — Item, DuelRecord, ListConfig interfaces
- `src/lib/strings.ts` — all UI string constants
- `src/lib/utils.ts` — `cn()` helper (shadcn-generated)
- `src/components/ui/` — shadcn component directory
- `components.json` — shadcn configuration

### Tech stack (pinned versions)
| Package | Version |
|---|---|
| React | 19.2.5 |
| TypeScript | 6.0.3 |
| Vite | 7.3.2 |
| Tailwind CSS | 4.2.4 |
| shadcn/ui | 4.4.0 (Radix + Nova) |
| react-router | 7.14.2 |
| vite-plugin-pwa | 1.2.0 |
| yaml | 2.8.3 |
| jszip | 3.10.1 |
| pnpm | 10.29.2 |

## Phase B: Data Layer — COMPLETE

- [x] `src/types.ts` — added `AppSettings` interface
- [x] `src/lib/markdown.ts` — parse/serialize markdown ↔ ListConfig (frontmatter via `yaml` pkg, HTML comment JSON, escaping, import-friendly format support)
- [x] `src/lib/storage.ts` — localStorage CRUD (`duellist:*` keys), IndexedDB file handles (`DuelListDB`), quota monitoring (warn at 80%)
- [x] `src/lib/ranking.ts` — ELO calculation engine (K-factor presets, session snapshots, biggest movers)
- [x] `src/lib/history.ts` — duel history append via tail parsing, cooldown pair extraction, `createPairKey` canonical ordering
- [x] `src/lib/pairing.ts` — smart pair selection (skip re-queue → uncertainty → ELO proximity → cooldown → random tiebreaker)
- [x] `src/lib/samples.ts` — 6 sample lists (anime, pizza, movies, vacation, snacks, hobbies) with `getSampleList()` deep clone
- [x] Build verification — `tsc --noEmit` + `vite build` pass with zero errors

## Phase C: Routing & Layout — COMPLETE

- [x] `src/components/Layout.tsx` — app shell with sticky header, conditional back arrow, clickable logo
- [x] `src/App.tsx` — `createBrowserRouter` with 7 routes wrapped in Layout
- [x] `src/pages/Home.tsx` — first-run redirect to `/welcome`, empty state placeholder
- [x] `src/pages/Welcome.tsx` — onboarding with get-started + sample buttons, sets `firstRunDone`
- [x] `src/pages/Rankings.tsx` — list ID validation, ranked items display, empty state
- [x] `src/pages/Duel.tsx` — list validation, ≥2 items check, placeholder
- [x] `src/pages/ListSettings.tsx` — list validation, settings display placeholder
- [x] `src/pages/AppSettings.tsx` — app settings placeholder
- [x] `src/pages/NotFound.tsx` — 404 with home button
- [x] Build verification — `tsc --noEmit` + `vite build` pass with zero errors

- [ ] React Router v7 setup with routes: `/`, `/welcome`, `/list/:id`, `/list/:id/duel`, `/list/:id/settings`, `/settings`
- [ ] App shell / layout component

## Phase D: Pages & Components — COMPLETE

- [x] D1 Foundation: shadcn components (button, card, dialog, input, select, progress, separator, dropdown-menu)
- [x] D1 Foundation: `src/lib/download.ts` — slugify, downloadFile, downloadZip
- [x] D1 Foundation: `src/hooks/useList.ts` — list CRUD hook (add/rename/remove/restore items, delete list)
- [x] D1 Foundation: `src/hooks/useListRegistry.ts` — list registry hook (sort, create, import, delete)
- [x] D1 Foundation: `src/hooks/useExport.ts` — export list/history/all/app-data
- [x] D1 Foundation: `src/hooks/useComparison.ts` — duel session hook (ELO, pairing, skip, session tracking)
- [x] D1 Foundation: `src/components/ConfirmDialog.tsx` — reusable confirmation modal
- [x] D1 Foundation: `src/components/ListCard.tsx` — list card with relative time, item count, top item
- [x] D1 Foundation: `src/components/ListCreateDialog.tsx` — create list dialog with name, K-factor, session length
- [x] D1 Foundation: `src/components/AddItemsDialog.tsx` — bulk add items (one per line)
- [x] D2 Home: `src/pages/Home.tsx` — list grid, sort dropdown, create/import, empty state, settings gear
- [x] D3 Welcome: `src/pages/Welcome.tsx` — multi-step tour (5 steps), sample list loading, step dots
- [x] D4 Rankings: `src/pages/Rankings.tsx` — ranked items with ELO scores, inline rename, remove/restore, add items, start duel
- [x] D5 Duel: `src/pages/Duel.tsx` — A-vs-B comparison cards, tie/skip, keyboard shortcuts (←/→/T/S), progress bar, session summary with top 3 & biggest movers
- [x] D6 ListSettings: `src/pages/ListSettings.tsx` — name, K-factor, session length, removed items, export, danger zone delete
- [x] D7 AppSettings: `src/pages/AppSettings.tsx` — theme select, export all/app data, storage usage bar
- [x] CSS animations: winner-grow, slide-in-up in `src/index.css`
- [x] Build verification — `tsc --noEmit` + `vite build` pass with zero errors

## Phase E: File Sync & PWA — COMPLETE

- [x] `src/lib/file-sync.ts` — File System Access API wrappers (writeToFileHandle, readFromFileHandle, pickFileForSave, pickFileForOpen, requestPermission, createCompanionHandle, isFileSystemAccessSupported)
- [x] `src/file-system-access.d.ts` — TypeScript type declarations for File System Access API (queryPermission, requestPermission, showSaveFilePicker, showOpenFilePicker)
- [x] `src/hooks/useFileSync.ts` — file sync hook (linkFile, unlinkFile, syncToFile, syncHistoryToFile, openFromFile, linkExistingHandle). Loads persisted handles from IndexedDB, verifies permissions, auto-creates companion `.duellist.md`
- [x] `src/hooks/useList.ts` — added `onSave` callback parameter for file sync integration
- [x] `src/hooks/useComparison.ts` — added `onDuel` callback parameter, calls after `saveList` + `appendDuelToHistory`
- [x] `src/pages/Rankings.tsx` — sync indicator icons (FileCheck/FileX) in header, wired `useFileSync` → `useList` via `onSave`
- [x] `src/pages/Duel.tsx` — wired `useFileSync` → `useComparison` via `onDuel` (syncs both list and history after each duel)
- [x] `src/pages/ListSettings.tsx` — "Link to file" / "Unlink file" UI under Export section, file sync status, re-link prompt on permission loss
- [x] `src/pages/Home.tsx` — "Open from file" button (File System Access API), opens file picker, parses markdown, stores handle, navigates to list
- [x] PWA: `public/favicon.svg` — SVG icon (dark square with "D")
- [x] PWA: `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png` — placeholder PNG icons
- [x] PWA: `vite.config.ts` — updated VitePWA config: `start_url`, `display: standalone`, `background_color`, `theme_color`, maskable icon, workbox globPatterns
- [x] PWA: `index.html` — added `<meta name="theme-color">`, `<meta name="description">`, `<link rel="icon">`, `<link rel="apple-touch-icon">`
- [x] Build verification — `tsc --noEmit` passes, `vite build` produces `dist/sw.js` + `dist/manifest.webmanifest` with 13 precache entries

## Phase F: Essential Polish — COMPLETE

- [x] **Dark mode persistence** — `Layout.tsx` reads persisted theme on mount via `applyTheme()`, listens for `prefers-color-scheme` media query changes for "system" mode. `AppSettings.tsx` fixed to apply system mode correctly.
- [x] **Storage quota banner** — `Layout.tsx` shows persistent warning banner via `isQuotaNearLimit()` with link to export settings when >80% full.
- [x] **Post-duel animations** — Added `loser-shrink` keyframe/class in `index.css`. Winner card scales up (1.08), loser shrinks (0.92 + fade). Animation timeout increased from 300ms to 600ms.
- [x] **ARIA labels** — Added `aria-label` to all icon-only buttons: Rankings.tsx (add, settings, item menu, restore), Home.tsx (settings), ListSettings.tsx (restore). Added `aria-label` to inline rename input in Rankings.tsx.
- [x] **Interactive card a11y** — Duel cards and ListCard: `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space), `aria-label`, `focus-visible:ring-2`.
- [x] **Aria-live regions** — `aria-live="polite"` on session complete summary and duel counter in Duel.tsx.
- [x] **Touch targets** — `min-h-[44px] min-w-[44px]` on all icon buttons: Layout (back), Rankings (add, settings, ⋮ menu, restore), Home (settings), ListSettings (restore).
- [x] **List name debounce + blur** — ListSettings.tsx uses local `nameValue` state with 500ms debounce auto-save and immediate save on blur.
- [x] Build verification — `tsc --noEmit` passes, `vite build` succeeds (13 precache entries, sw.js generated).
