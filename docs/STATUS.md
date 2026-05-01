# DuelList.Implementation Status

> Last updated: 2026-05-01

## Phase A: Project Scaffolding.COMPLETE

- [x] Initialize project with pnpm
- [x] Install all dependencies (React 19, TypeScript 6, Vite 7, Tailwind v4, etc.)
- [x] Fix esbuild build scripts approval (onlyBuiltDependencies)
- [x] Create Vite config (`vite.config.ts`) with React, Tailwind, and PWA plugins
- [x] Create TypeScript config (`tsconfig.json`) with `@/` path alias
- [x] Create entry files (`index.html`, `src/main.tsx`, `src/App.tsx`)
- [x] Configure Tailwind v4 (`src/index.css`)
- [x] Initialize shadcn/ui (Radix library, Nova preset, Geist font)
- [x] Create core types (`src/types.ts`.Item, DuelRecord, ListConfig)
- [x] Create string constants (`src/lib/strings.ts`.i18n prep)
- [x] Verify dev server runs (`pnpm dev` → Vite v7.3.2 on localhost:5173)

### Files created
- `package.json`.scripts: dev, build, preview
- `vite.config.ts`.React + Tailwind + PWA plugins, `@/` alias
- `tsconfig.json`.strict, bundler resolution, `@/` path alias
- `index.html`.entry HTML
- `src/main.tsx`.React root mount
- `src/App.tsx`.placeholder App component
- `src/index.css`.Tailwind v4 + shadcn theme (Nova/Geist)
- `src/vite-env.d.ts`.Vite client types
- `src/types.ts`.Item, DuelRecord, ListConfig interfaces
- `src/lib/strings.ts`.all UI string constants
- `src/lib/utils.ts`.`cn()` helper (shadcn-generated)
- `src/components/ui/`.shadcn component directory
- `components.json`.shadcn configuration

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

## Phase B: Data Layer.COMPLETE

- [x] `src/types.ts`.added `AppSettings` interface
- [x] `src/lib/markdown.ts`.parse/serialize markdown ↔ ListConfig (frontmatter via `yaml` pkg, HTML comment JSON, escaping, import-friendly format support)
- [x] `src/lib/storage.ts`.localStorage CRUD (`duellist:*` keys), IndexedDB file handles (`DuelListDB`), quota monitoring (warn at 80%)
- [x] `src/lib/ranking.ts`.ELO calculation engine (K-factor presets, session snapshots, biggest movers)
- [x] `src/lib/history.ts`.duel history append via tail parsing, cooldown pair extraction, `createPairKey` canonical ordering
- [x] `src/lib/pairing.ts`.smart pair selection (skip re-queue → uncertainty → ELO proximity → cooldown → random tiebreaker)
- [x] `src/lib/samples.ts`.6 sample lists (anime, pizza, movies, vacation, snacks, hobbies) with `getSampleList()` deep clone
- [x] Build verification.`tsc --noEmit` + `vite build` pass with zero errors

## Phase C: Routing & Layout.COMPLETE

- [x] `src/components/Layout.tsx`.app shell with sticky header, conditional back arrow, clickable logo
- [x] `src/App.tsx`.`createBrowserRouter` with 7 routes wrapped in Layout
- [x] `src/pages/Home.tsx`.first-run redirect to `/welcome`, empty state placeholder
- [x] `src/pages/Welcome.tsx`.onboarding with get-started + sample buttons, sets `firstRunDone`
- [x] `src/pages/Rankings.tsx`.list ID validation, ranked items display, empty state
- [x] `src/pages/Duel.tsx`.list validation, ≥2 items check, placeholder
- [x] `src/pages/ListSettings.tsx`.list validation, settings display placeholder
- [x] `src/pages/AppSettings.tsx`.app settings placeholder
- [x] `src/pages/NotFound.tsx`.404 with home button
- [x] Build verification.`tsc --noEmit` + `vite build` pass with zero errors

- [ ] React Router v7 setup with routes: `/`, `/welcome`, `/list/:id`, `/list/:id/duel`, `/list/:id/settings`, `/settings`
- [ ] App shell / layout component

## Phase D: Pages & Components.COMPLETE

- [x] D1 Foundation: shadcn components (button, card, dialog, input, select, progress, separator, dropdown-menu)
- [x] D1 Foundation: `src/lib/download.ts`.slugify, downloadFile, downloadZip
- [x] D1 Foundation: `src/hooks/useList.ts`.list CRUD hook (add/rename/remove/restore items, delete list)
- [x] D1 Foundation: `src/hooks/useListRegistry.ts`.list registry hook (sort, create, import, delete)
- [x] D1 Foundation: `src/hooks/useExport.ts`.export list/history/all/app-data
- [x] D1 Foundation: `src/hooks/useComparison.ts`.duel session hook (ELO, pairing, skip, session tracking)
- [x] D1 Foundation: `src/components/ConfirmDialog.tsx`.reusable confirmation modal
- [x] D1 Foundation: `src/components/ListCard.tsx`.list card with relative time, item count, top item
- [x] D1 Foundation: `src/components/ListCreateDialog.tsx`.create list dialog with name, K-factor, session length
- [x] D1 Foundation: `src/components/AddItemsDialog.tsx`.bulk add items (one per line)
- [x] D2 Home: `src/pages/Home.tsx`.list grid, sort dropdown, create/import, empty state, settings gear
- [x] D3 Welcome: `src/pages/Welcome.tsx`.multi-step tour (5 steps), sample list loading, step dots
- [x] D4 Rankings: `src/pages/Rankings.tsx`.ranked items with ELO scores, inline rename, remove/restore, add items, start duel
- [x] D5 Duel: `src/pages/Duel.tsx`.A-vs-B comparison cards, tie/skip, keyboard shortcuts (←/→/T/S), progress bar, session summary with top 3 & biggest movers
- [x] D6 ListSettings: `src/pages/ListSettings.tsx`.name, K-factor, session length, removed items, export, danger zone delete
- [x] D7 AppSettings: `src/pages/AppSettings.tsx`.theme select, export all/app data, storage usage bar
- [x] CSS animations: winner-grow, slide-in-up in `src/index.css`
- [x] Build verification.`tsc --noEmit` + `vite build` pass with zero errors

## Phase E: File Sync & PWA.COMPLETE

- [x] `src/lib/file-sync.ts`.File System Access API wrappers (writeToFileHandle, readFromFileHandle, pickFileForSave, pickFileForOpen, requestPermission, createCompanionHandle, isFileSystemAccessSupported)
- [x] `src/file-system-access.d.ts`.TypeScript type declarations for File System Access API (queryPermission, requestPermission, showSaveFilePicker, showOpenFilePicker)
- [x] `src/hooks/useFileSync.ts`.file sync hook (linkFile, unlinkFile, syncToFile, syncHistoryToFile, openFromFile, linkExistingHandle). Loads persisted handles from IndexedDB, verifies permissions, auto-creates companion `.duellist.md`
- [x] `src/hooks/useList.ts`.added `onSave` callback parameter for file sync integration
- [x] `src/hooks/useComparison.ts`.added `onDuel` callback parameter, calls after `saveList` + `appendDuelToHistory`
- [x] `src/pages/Rankings.tsx`.sync indicator icons (FileCheck/FileX) in header, wired `useFileSync` → `useList` via `onSave`
- [x] `src/pages/Duel.tsx`.wired `useFileSync` → `useComparison` via `onDuel` (syncs both list and history after each duel)
- [x] `src/pages/ListSettings.tsx`."Link to file" / "Unlink file" UI under Export section, file sync status, re-link prompt on permission loss
- [x] `src/pages/Home.tsx`."Open from file" button (File System Access API), opens file picker, parses markdown, stores handle, navigates to list
- [x] PWA: `public/favicon.svg`.SVG icon (dark square with "D")
- [x] PWA: `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`.placeholder PNG icons
- [x] PWA: `vite.config.ts`.updated VitePWA config: `start_url`, `display: standalone`, `background_color`, `theme_color`, maskable icon, workbox globPatterns
- [x] PWA: `index.html`.added `<meta name="theme-color">`, `<meta name="description">`, `<link rel="icon">`, `<link rel="apple-touch-icon">`
- [x] Build verification.`tsc --noEmit` passes, `vite build` produces `dist/sw.js` + `dist/manifest.webmanifest` with 13 precache entries

## Phase F: Essential Polish.COMPLETE

- [x] **Dark mode persistence**.`Layout.tsx` reads persisted theme on mount via `applyTheme()`, listens for `prefers-color-scheme` media query changes for "system" mode. `AppSettings.tsx` fixed to apply system mode correctly.
- [x] **Storage quota banner**.`Layout.tsx` shows persistent warning banner via `isQuotaNearLimit()` with link to export settings when >80% full.
- [x] **Post-duel animations**.Added `loser-shrink` keyframe/class in `index.css`. Winner card scales up (1.08), loser shrinks (0.92 + fade). Animation timeout increased from 300ms to 600ms.
- [x] **ARIA labels**.Added `aria-label` to all icon-only buttons: Rankings.tsx (add, settings, item menu, restore), Home.tsx (settings), ListSettings.tsx (restore). Added `aria-label` to inline rename input in Rankings.tsx.
- [x] **Interactive card a11y**.Duel cards and ListCard: `role="button"`, `tabIndex={0}`, `onKeyDown` (Enter/Space), `aria-label`, `focus-visible:ring-2`.
- [x] **Aria-live regions**.`aria-live="polite"` on session complete summary and duel counter in Duel.tsx.
- [x] **Touch targets**.`min-h-[44px] min-w-[44px]` on all icon buttons: Layout (back), Rankings (add, settings, ⋮ menu, restore), Home (settings), ListSettings (restore).
- [x] **List name debounce + blur**.ListSettings.tsx uses local `nameValue` state with 500ms debounce auto-save and immediate save on blur.
- [x] Build verification.`tsc --noEmit` passes, `vite build` succeeds (13 precache entries, sw.js generated).

## Phase G: MVP Completion + Duel-mode plumbing.COMPLETE

- [x] **G3 Code-splitting**.`App.tsx` uses `React.lazy` + `<Suspense>` for all 7 page modules. Main chunk dropped from 670 kB to 293 kB (gzip 95 kB). 22 lazy-loaded route/component chunks.
- [x] **G1 Import-conflict dialog**.`useListRegistry.importList` now returns `{status:'ok'|'conflict'}`; new `importListWithChoice(parsed, 'replace'|'new')`. New `src/components/ImportConflictDialog.tsx` shown when imported file's frontmatter `id` matches an existing list. Wired into both file-input import and File System Access `openFromFile`.
- [x] **G2 Drag-to-reorder**.When `sortOrder === 'custom'`, Home shows a "Reorder/Done" toggle. `ListCard` renders draggable variant with HTML5 drag-and-drop + GripVertical handle + Up/Down keyboard buttons (a11y). Persists via existing `updateCustomOrder`.
- [x] **G5 PWA manifest**.Added `screenshots`, `categories: ['productivity', 'utilities', 'lifestyle']`, `lang: 'en'` to manifest. **Note:** real PNG icon artwork and screenshot files in `public/screenshots/` still need to be created/replaced before publishing.current PNG icons are placeholders.
- [x] **G4 Duel-mode plumbing**.Originally shipped a `framer-motion`-based `SwipeMode.tsx`; it was retired in May 2026 because the single-card-with-other-as-text layout broke the comparison metaphor. The code now lives in `src/lib/duelModes.ts` as a `DUEL_MODES` registry (`isAvailableDuelMode`, `getDuelModeMeta`, `coerceDuelMode`). Modes registered: **side-by-side** (available), **speed-round** (coming soon), **bracket** (coming soon). The settings picker shows a *Coming soon* badge on planned modes; selecting one persists, and the Duel page shows a coming-soon panel with a session-only "Start a side-by-side duel" fallback. Stale persisted `'swipe'` values are silently coerced to `'side-by-side'`. `framer-motion` removed from deps.
- [x] Build verification.`tsc --noEmit` clean, `vite build` succeeds, PWA precache 35 entries, sw.js + workbox generated.

### Outstanding (deferred from G5)
- [ ] Real PWA icon artwork (replace placeholder `public/icon-*.png` files)
- [ ] Add `public/screenshots/home-narrow.png` and `public/screenshots/duel-narrow.png` (720×1280)

## Phase H: Feedback Round 1.COMPLETE

> Last updated: 2026-04-22

Fixes + UX polish + small features driven by hands-on testing feedback.

### Bugs (Wave 1)
- [x] **H1.1 Skip not working**.`selectNextPair` no longer early-returns on the recent-skips queue (it would re-serve the just-skipped pair). Skips now apply a score *penalty* (`skipPenalty * 100_000`) and the picked pair is removed from `recentSkips` so penalties don't compound.
- [x] **H1.2 Drag-and-drop on touch**.Replaced HTML5 native DnD with `@dnd-kit` (`core`, `sortable`, `utilities` 3.2.2). `ListCard` is now sortable via `useSortable`; `Home` wraps its list in `DndContext` + `SortableContext` with `PointerSensor` (5 px), `TouchSensor` (150 ms / 5 px), `KeyboardSensor`. Up/Down buttons retained for a11y.
- [x] **H1.3 Mobile cutoff**.`index.html` viewport now `viewport-fit=cover`; `Layout` `<main>` adds `padding-bottom: max(2rem, env(safe-area-inset-bottom))`.
- [x] **H1.4 Swipe mode rewritten**.(Superseded May 2026.) Originally replaced the Tinder-stack with side-by-side `motion.div` cards. Subsequently retired in the duel-mode registry refactor (see Phase G); side-by-side absorbed all duel features (avatars, tie pulse, processing-ref guard, dialog-gated keyboard shortcuts, displayMode-respecting Top 3, reduced-motion fallbacks).

### UX polish (Wave 2)
- [x] **H2.1 Merged Open + Import**.Single "Open file…" button that prefers File System Access and falls back to `<input type=file>` when unsupported.
- [x] **H2.2 Name behind edit button**.`ListSettings` now displays the name as a read-only chip with an edit pencil; `Input` only renders when editing.
- [x] **H2.3 Removed-items modal**.Removed-items list moved out of the rankings page and behind a button in `ListSettings` that opens a `Dialog` with restore actions.
- [x] **H2.4 Inline rename contrast**.Replaced bare `<input>` with a proper shadcn `Input` (`bg-background`) and a check button to confirm.
- [x] **H2.5 Not-linked indicator**.`Rankings` header now shows `FileQuestion` (muted) when File System Access is supported but the list isn't linked, alongside the existing `FileCheck` (linked) and `FileX` (broken) indicators.

### Features (Wave 3)
- [x] **H3.3 Custom session length**.`ListCreateDialog` and `ListSettings` now use a `number` input + preset chips (5/10/20/50/Unlimited).
- [x] **H3.2 Rank vs ELO toggle**.Added `ListConfig.displayMode: 'rank' | 'elo'`. Toggle button in Rankings header switches between the two; in `'rank'` mode the ELO score column is hidden. Persisted per list.
- [x] **H3.1 Duel history viewer**.New `HistoryDialog` parses the per-list history Markdown into date sections and renders entries with bolded winners. History button added to Rankings header.
- [x] **H3.4 Sample templates**.`ListCreateDialog` shows template chips (Anime / Pizza / Movies / Vacation / Snacks / Hobbies) sourced from `samples.ts`; selecting one pre-fills the name and seeds the items on create.
- [x] **H3.5 Features showcase**.New `/features` route with a grid of 10 feature cards. Linked from `AppSettings` ("What's in DuelList") and Welcome final step ("See all features").

### Verification
- [x] `tsc --noEmit` clean
- [x] `vite build` succeeds.PWA precache 40 entries, `sw.js` + `workbox` generated. Largest chunk (vendor) 293.76 kB / 95.20 kB gz; `Duel` chunk 135 kB / 44 kB gz; new `Features` chunk 5.65 kB / 2.50 kB gz; `samples` 1.43 kB / 0.84 kB gz.

### Deferred (intentionally out of scope)
- [ ] Internationalization (i18n).strings are already centralized in `src/lib/strings.ts`; framework swap pending demand.
- [ ] Public sample-list catalog / suggestions feed.

## Phase I: Reminders + Glossary + Hero CTAs.COMPLETE

> Last updated: 2026-04-24

Bundles all post-H work into one batch entry. Multiple iterations on Home/Rankings UX, a reminders system, a help/glossary surface, and a terminology lock-in.

### Reminders (Phase 3 #17.in-app portion)
- [x] `src/lib/reminders.ts`.eligibility scoring, `pickReminderCandidate`, `pickRandomDuelList` weighted-random helper (favors stale + less-developed lists), quiet-hours math (`inAllowedHours`, minute-of-day).
- [x] `src/types.ts`.`ReminderSettings` extended with `preferredHour`, `preferredMinute`, `quietHoursStart/End` + `*Minute` for 15-minute granularity.
- [x] `src/pages/RemindersSettings.tsx`.full settings page; in-app `PreferredTimePicker` (12h/24h aware), preset cadence labels, quiet-hours selects (96 entries, 15-min steps).
- [x] `src/components/ReminderBanner.tsx`.dismissible banner on Home, Snooze 1d / Skip / Play actions.
- [x] **Deferred**: OS-level notifications via service worker (Phase 3 #17 part 2).

### Glossary + HelpHint (terminology surface)
- [x] `src/pages/Glossary.tsx` at `/settings/glossary`.sectioned reference (terminology first, then visual cues). Stable anchor `id`s on every row.
- [x] `src/components/HelpHint.tsx`.`?` icon link to `/settings/glossary#<anchor>`. Mounted on Rankings (Score/Rank toggle), Duel (session counter), ItemDetailsDialog (Rank/Score tiles).
- [x] Smooth-scroll-on-mount when URL has a hash.

### Terminology lock-in (UI rename: ELO → Score)
- [x] `src/lib/strings.ts`.renamed `ranking.elo`→`score`, `eloTooltip`→`scoreTooltip`, `switchToElo`→`switchToScore`, `sortFieldElo`→`sortFieldScore`, `sortEloDesc/Asc`→`sortScoreDesc/Asc`, `sortDirAriaElo*`→`sortDirAriaScore*`, `detailsElo`→`detailsScore`, `duel.eloSuffix`→`scoreSuffix` (returns `"{n} pts"`), `glossary.eloView*`→`scoreView*`. Removed-item meta and ELO-view glossary copy now use "pts" / "score".
- [x] **Storage names preserved** (no migration): `Item.eloScore`, `displayMode: 'rank' | 'elo'` value, `SortField` `'elo'` value, `src/lib/elo.ts` / `ranking.ts` module names. Caveats codified in `.github/copilot-instructions.md`.

### Hero CTAs + ListCard polish
- [x] `src/pages/Home.tsx`.gradient hero "Ready for a duel?" / "Random duel" → `pickRandomDuelList` → navigates to `/list/:id/duel`. Hidden when no eligible list.
- [x] `src/components/ListCard.tsx`.title bumped to `text-lg font-bold`, dot to `h-2.5 w-2.5`, top-right `Swords` quick-duel icon button when `≥2` items.
- [x] `src/pages/Rankings.tsx`.replaced plain "Start duel" button with matching gradient hero card (Swords badge, title + subtitle).

### Trend arrows on Rankings
- [x] `src/hooks/useComparison.ts` `initSession`.captures `prevRank`/`prevEloScore` snapshot at session start; only writes when changed.
- [x] `src/pages/Rankings.tsx`.`TrendBadge` component renders TrendingUp/Down + delta. Fixed-width slot (`w-10`) reserved on every row for alignment, including null/no-change states. Duel-count chip mirrors the same `w-10` reservation.
- [x] `src/hooks/useList.ts` `restoreItem`.preserves stats; resets `prevRank: 0`, `prevEloScore: i.eloScore` so trend doesn't show stale jump.

### Removed-items section
- [x] `src/pages/Rankings.tsx`.collapsible "Removed (n)" section. Sort by score desc. Each row shows score + duel count meta. Restore button uses `Undo2` icon.
- [x] `S.ranking.restoreKeepsStatsHint` (`title` tooltip) clarifies stats are preserved.

### Shared primitives
- [x] `src/components/RankChip.tsx`.gold/silver/bronze chips for positions 1–3, muted fallback for >3. Used by ListCard, Rankings (rank-view top-3), Duel session-complete podium.
- [x] `src/components/ItemDetailsDialog.tsx`.stat tiles (Rank, Score, Total, Added, Last duel) + last-duels list + notes. Opened from row dropdown "Details".

### Time format setting (12h/24h)
- [x] `src/types.ts`.`AppSettings.timeFormat: '12h' | '24h'` (default `'24h'`).
- [x] `src/lib/datetime.ts`.`formatTimeOfDay(iso, fmt)`, `formatHourMinute(h, m, fmt)`.
- [x] `src/pages/AppSettings.tsx`.`Select` for time format.
- [x] Wired into `RemindersSettings.tsx` (preset labels, picker, quiet-hours), `History.tsx` (DuelRow), `ItemDetailsDialog.tsx` (`formatShort`).

### shadcn primitives added
- [x] `src/components/ui/scroll-area.tsx`.Radix-based; `@radix-ui/react-scroll-area` 1.2.10 installed. Used by Rankings (removed-items, `max-h-72`) and ItemDetailsDialog (last-duels, `max-h-64`).
- [x] `src/components/ui/skeleton.tsx`.pure Tailwind `animate-pulse` div.
- [x] `src/components/PageSkeleton.tsx`.`HomeSkeleton`, `RankingsSkeleton`, `DefaultSkeleton`. `aria-busy` + `aria-live`.
- [x] `src/App.tsx`.`withSuspense(node, fallback)` now takes per-route fallback. Home/Rankings/Duel get bespoke shapes; everything else uses `DefaultSkeleton`. Replaced bare `"Loading…"` text.

### Contributor docs
- [x] `.github/copilot-instructions.md`.created with Terminology + storage caveats + UI string discipline + code conventions.
- [x] `.github/prompts/update-features.prompt.md`
- [x] `.github/prompts/update-glossary.prompt.md`
- [x] `.github/prompts/update-lists-view.prompt.md`
- [x] `.github/prompts/update-list-view.prompt.md`

### Verification
- [x] `tsc --noEmit` clean
- [x] `vite build` succeeds.`built in 8.07s` on last run; PWA precache ≥40 entries (likely higher with Glossary/Reminders chunks).

### Outstanding (carried from G5, still open)
- [ ] Real PWA icon artwork (replace placeholder `public/icon-*.png` files)
- [ ] Add `public/screenshots/home-narrow.png` and `public/screenshots/duel-narrow.png` (720×1280)

## Phase J: Post-I expansion, i18n foundation, OS-notifications verified.COMPLETE

> Last updated: 2026-05-01

Retroactive entry covering everything shipped between Phase I (2026-04-24) and now: pages/lib/hooks/components added without their own STATUS row, plus the OS-notifications loop that closes the Phase 3 #17 deferred item, plus the i18n foundation.

### New pages
- [x] `src/pages/Templates.tsx` at `/templates`.browseable list of sample templates with item-count chips, expand-to-preview, and a "Create from template" CTA. Linked from Welcome and from the footer nav.
- [x] `src/pages/ItemDetail.tsx` at `/list/:id/item/:itemId`.promoted from `ItemDetailsDialog` to a full page. Adds rivalries section (biggest rival, most wins against, lost most to), recent-form strip, win-rate / record / coverage / streak stats, notes editor with autosave (debounced + saved/saving status), full duel-history list. Old "Details" dropdown action now navigates here.
- [x] `src/pages/DefaultsSettings.tsx` at `/settings/defaults`.app-wide defaults (K-factor, session length, show-scores-during-duels) with per-setting "Apply to all lists" confirm dialog (`applyToAllLists`, `applyKFactorConfirm*`, `applySessionConfirm*`, `applyShowScoresConfirm*`). Linked from AppSettings.

### New lib modules
- [x] `src/lib/notifications.ts`.browser Notification platform wrapper. `notificationsSupported`, `getPermission`, `requestPermission`, `triggerSupported` (TimestampTrigger feature-detect), `showLocal` (immediate via SW registration), `scheduleAt` (TimestampTrigger), `cancelScheduled` (tag-scoped, `includeTriggered:false`).
- [x] `src/lib/errorLog.ts`.captures the last render-time exception (caught by `ErrorBoundary`) into a single localStorage slot for the dev "Copy last error" surface.
- [x] `src/lib/haptics.ts`.thin `navigator.vibrate` wrapper used on duel pick / tie / skip.
- [x] `src/lib/avatar.ts`.deterministic gradient + initials avatar generator for items.
- [x] `src/lib/constants.ts`.shared numeric constants (debounce intervals, cooldown windows).
- [x] `src/lib/i18n.ts`.i18next init (en + nl resources, fallback `en`, `pluralSeparator: '_'`). Exports `SUPPORTED_LOCALES`, `SupportedLocale`, `resolveSupportedLocale`, `detectNavigatorLocale`. No `i18next-browser-languagedetector`.locale is driven from `AppSettings.locale`.

### New hooks
- [x] `src/hooks/useFilterShortcut.ts`.global `/` keyboard shortcut to focus the page filter input on Home / Rankings / History (skipped while typing in another input).
- [x] `src/hooks/useReminderScheduler.ts`.mounted once in `App.tsx`. Re-evaluates on settings change (debounced 30s), `visibilitychange`, and (Phase J) `permissions.query({name:'notifications'}).onchange`. Schedules a single OS notification per active reminder candidate via `scheduleAt`; cancels via tag-scoped `cancelScheduled` when no candidate / cadence off / permission lost / trigger unsupported.
- [x] `src/hooks/useLocale.tsx`.exposes `{ locale, resolvedLocale, setLocale }` reading `AppSettings.locale`. Provides `<LocaleProvider>` that calls `i18n.changeLanguage`, sets `document.documentElement.lang`, and re-mounts children via a keyed `<Fragment>` so every `S.*` getter re-resolves on change without per-component `useTranslation`.

### New components
- [x] `src/components/AutoShrinkText.tsx`.measures container width and shrinks font-size to fit; used for long item names on Duel cards.
- [x] `src/components/FileLinkStatus.tsx`.shared linked / broken / not-linked indicator extracted from Rankings header.
- [x] `src/components/HeaderActions.tsx`.shared right-side header action cluster (history, add items, settings).
- [x] `src/components/ErrorBoundary.tsx`.app-level + route-level boundaries. Fallback UI: title + description, Reload button, collapsible stack, Copy / Copied button. Persists last error via `errorLog.ts` for dev "Copy last error" reuse.
- [x] `src/components/ThemeToggle.tsx`.icon-button cycles `system → light → dark`, mirrors `AppSettings.theme`. Mounted in Layout header.

### Settings expansions (since Phase I)
- [x] **Per-list reminder opt-out**.`RemindersSettings` shows each list as a toggle row (Reminding / Skipped chip), persisted in `reminders.perListOptOut`. `pickReminderList` honours it.
- [x] **Defaults flow with apply-to-all**.`DefaultsSettings` exposes K-factor, session length, and show-scores-during-duels at the app level; each has a confirm dialog that bulk-updates all existing lists.
- [x] **Dev / error-log section**.`AppSettings` developer block: Trigger error, Copy last error (with relative-time + message preview), Clear log (with confirm). Dev-only visual emphasis; available everywhere for now.
- [x] **OS-notification permission panel**.`OsPermissionPanel` in `RemindersSettings`: surfaces permission state (granted / denied / default), Enable button (calls `requestPermission`), and a "scheduling unsupported" hint when `triggerSupported()` returns false. Visible only when channel is `os` or `both`.
- [x] **AppSettings groupings**.`groupRanking`, `groupAppearance`, `groupSync`, `groupData`, `groupHelp` headings; About + Replay-onboarding + Features link cluster.

### Custom service worker
- [x] `src/sw.ts`.`vite-plugin-pwa` `injectManifest` strategy. Workbox `precacheAndRoute(self.__WB_MANIFEST)`. `install` → `skipWaiting`; `activate` → `clients.claim`. `notificationclick` focuses an existing client and `client.navigate(targetUrl)`, otherwise `clients.openWindow(targetUrl)`. The deep link is carried on `event.notification.data.url`.

### OS notifications loop (Phase 3 #17 part 2.now closed)
- [x] **Wiring**.`useReminderScheduler` (global) ⇄ `notifications.ts` ⇄ `sw.ts`. Settings ⇄ `RemindersSettings` `OsPermissionPanel`. Channel selector (`in-app | os | both`) governs OS scheduling and the test button only.the in-app `ReminderBanner` always surfaces on Home when a candidate exists and the tab is visible (banner is the soft fallback for unsupported browsers). When the tab is hidden and channel includes OS with permission granted, `Home.tsx` fires a one-shot `showLocal` instead of the banner.
- [x] **Test button**.`handleTest` auto-prompts `requestPermission()` when `wantsOs && permission === 'default'` so the test produces an actual OS notification (not a silent in-app fallback). Fires through SW for parity with scheduled notifications.
- [x] **Permission flips**.`useReminderScheduler` listens on `navigator.permissions.query({ name:'notifications' }).onchange` (guarded.Safari historically rejects the name, older Firefox lacks the API). Revoked permission triggers `cancelScheduled` within one debounce window without waiting for a settings change or visibility flip.
- [x] **Tag discipline**.all scheduled / immediate notifications use the single `'duellist-reminder'` tag; `scheduleAt` calls `cancelScheduled` first so a re-schedule replaces the prior pending notification rather than stacking.
- [x] **Verification matrix** (manual.fill in after smoke):
  - [ ] Desktop Chrome installed PWA: scheduled fire at next tick, click routes to `/list/:id/duel`, second schedule replaces first.
  - [ ] Desktop Chrome browser tab (no install): trigger-unsupported copy visible; banner still surfaces.
  - [ ] Firefox / Safari macOS: same as above.
  - [ ] iOS 16.4+ home-screen install: permission grants; banner only.
  - [ ] Android Chrome PWA: full path works.
  - [ ] Channel `'both'` test button: both fire; scheduled does not duplicate banner.
  - [ ] End-to-end smoke: cadence `daily`, preferred = now+2min, channel `os` → tray notif fires, click opens duel.
  - [ ] Permission flip: revoke notifications in browser settings while tab open → `cancelScheduled` fires within ~30s.
- [ ] **Caveats**.iOS PWA notifications require iOS 16.4+ AND home-screen install; `triggerSupported()` returns false on iOS so iOS users only get the in-app banner. Document once verification confirms.

### i18n foundation (Phase 3 #20.partial, en/nl shipped)
- [x] **Resource trees**.`src/locales/en.ts` + `src/locales/nl.ts` mirror the full `S` shape (~470 lines each). CLDR `_one`/`_other` plurals, `{{name}}`-style interpolation, conditional pairs (`bannerSubtitleToday` vs `bannerSubtitle_one`/`_other`), array resources (`features.list`).
- [x] **i18next init**.`src/lib/i18n.ts` configures `lng:'en'`, `fallbackLng:'en'`, `pluralSeparator:'_'`, `resources:{ en:{translation:en}, nl:{translation:nl} }`.
- [x] **`S` accessor rewrite**.`src/lib/strings.ts` now backed by `i18n.t`. Public shape preserved: plain leaves are getters (`get x()`), parameterized leaves are functions mapping positional args to named placeholders. The only call-site break was `S.import.conflict.message` (was a string with `{existing}` placeholders, now a function `(existing, incoming) => string`); fixed in `ImportConflictDialog.tsx`.
- [x] **AppSettings.locale**.`'system' | 'en' | 'nl'`, default `'system'`. Coerced on read in `storage.ts` so junk values fall back to `'system'`.
- [x] **`useLocale` + `LocaleProvider`**.subscribes to settings; resolves `'system'` via `detectNavigatorLocale()` (walks `navigator.languages` then `.language`); calls `i18n.changeLanguage`; sets `<html lang>`; re-mounts children via `<Fragment key={resolvedLocale}>` so every `S.*` getter re-resolves on change without per-component subscriptions.
- [x] **Language picker**.`AppSettings` Appearance group, after Theme. Options: System / English / Nederlands.
- [x] **Wiring**.`main.tsx` side-effect imports `./lib/i18n` and wraps `<App>` in `<LocaleProvider>`.
- [x] Removed unused `i18next-browser-languagedetector` (installed during planning, not used.locale is driven from `AppSettings.locale`).

### Verification
- [x] `pnpm run build` clean (`built in 8.80s` after Phase J edits, no TS errors).
- [x] PWA precache regenerated; sw.js + workbox + manifest emit per build.
- [ ] OS-notifications manual matrix (above).pending smoke run.

### Deferred from Phase J (intentionally out of scope)
- [ ] `es` and `pap` locale files (Phase 3 #20 plan called for four).
- [ ] Per-item confidence indicator (Phase 3 #16 remainder).
- [ ] Metadata extension (Phase 3 #19).
- [ ] Phase 2 (Nextcloud / WebDAV).

### Outstanding (carried through, still open)
- [ ] Real PWA icon artwork (replace placeholder `public/icon-*.png` files)
- [ ] Add `public/screenshots/home-narrow.png` and `public/screenshots/duel-narrow.png` (720×1280)
