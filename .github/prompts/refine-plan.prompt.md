# Refine DuelList Plan

You are helping refine the plan for **DuelList** — a personal list-ranking web app where users rank items through pairwise A-vs-B comparisons ("duels").

## Context

Read all project documentation first:

- [README.md](../../README.md) — overview, core concepts, file format, tech stack
- [PROJECT_PLAN.md](../../docs/PROJECT_PLAN.md) — implementation roadmap and phases
- [TECH_DECISIONS.md](../../docs/TECH_DECISIONS.md) — architecture decisions and rationale

## Your Task

Review the current plan and help refine it. Work through these areas:

### 1. Gaps & Contradictions
- Are there any inconsistencies between the three docs?
- Are there features mentioned in one doc but missing from another?
- Are there decisions listed but not reflected in the plan steps?
- Is the verification checklist complete for all planned features in the current phase?
- Do all frontmatter examples, type definitions, and format examples match across docs?

### 2. Challenge Assumptions
- Are there technical decisions that should be reconsidered given new information?
- Are there simpler alternatives to any current approach?
- Is the persistence strategy viable for all planned features?
- Are there scaling concerns for the target list size (500 items)?

### 3. Missing Details
For every feature in the current phase, check:
- **Initial state**: What does it look like before any user interaction?
- **Boundary conditions**: What happens at 0, 1, 2, and max items? What about empty/null values?
- **Data flow**: How does data move between components, storage layers, and files?
- **Error handling**: What happens when input is malformed, missing, or unexpected?

### 4. UX Flows
For every user-facing feature, trace the complete journey:
- What does the user see at each step?
- What are the entry and exit points?
- What feedback does the user get after each action?
- What are the empty, loading, and error states?
- Are there keyboard shortcuts or accessibility considerations?

### 5. File Format & Storage
- Test the format mentally against corruption, malformation, and edge cases
- Consider special characters, encoding, and escaping
- Verify the storage architecture is consistent (localStorage ↔ markdown ↔ sync targets)
- Check that all stored data has a clear read/write path

### 6. Cross-Doc Consistency
Verify these match identically across all three docs:
- Frontmatter field names and examples
- HTML comment JSON structure
- History file format
- Storage architecture description (which layer is primary, which is sync target)
- Type definitions and their field names

### 7. Implementation Readiness
For the current phase, check whether these are specified enough to code without ambiguity:
- All TypeScript types and their fields
- Algorithm details (formulas, parameters, edge cases)
- localStorage key structure and data shapes
- File parsing/writing rules (what to accept, what to reject, what to fix)
- Component responsibilities and data dependencies

## How to Proceed

1. Read all three docs thoroughly
2. Present findings organized by the categories above
3. Rate each finding by impact: **High** (blocks implementation or causes bugs), **Medium** (design gap, solvable during implementation), **Low** (cosmetic or minor)
4. For each finding, suggest a concrete resolution or ask a clarifying question
5. For low-impact items, suggest a sensible default rather than asking
6. Batch related decisions together for efficient review
7. After discussion, update the relevant doc files to capture decisions

Do NOT start implementation. This is a planning and refinement session only.

---

## Previously Resolved (do not re-litigate)

These topics have been decided across prior refinement rounds. Reference them for context but do not reopen unless a new contradiction is found:

- **Storage architecture**: localStorage = working copy, markdown files = sync targets, IndexedDB = file handles only
- **ELO tiebreaker**: Equal scores retain import order
- **Item IDs**: Short random IDs in HTML comment JSON, generated on first import, stable across renames
- **List IDs**: Short random IDs in frontmatter, generated on list creation/import
- **Tie handling**: Standard ELO 0.5 scoring (upset ties shift ratings)
- **Skip handling**: Pair deferred, not recorded in history
- **Pairing cooldown**: N = list size (soft preference, falls back to least-recently-compared)
- **K-factor presets**: Quick (K=48) / Gradual (K=32) / Tight (K=16)
- **History file naming**: Based on source filename, not display name
- **History name resolution**: Names resolved from current item list at write time
- **History ID delimiter**: Square brackets `[id]` (not parentheses) to avoid ambiguity with item names
- **i18n strategy**: Phase 1 extracts strings to constants, Phase 3 adds i18n library
- **Empty/error states**: 6 states specified (no lists, 0 items, 1 item, 0 comparisons, no history, storage near limit). "All pairs exhausted" dropped — pairing always continues.
- **First-run tour**: 5-step overlay walkthrough with defined content, dedicated `/welcome` route
- **Session lifecycle**: Ephemeral counter (component state). Fresh session on every visit to Duel page. ELO safe per-duel.
- **Post-session flow**: "Continue dueling" + "View rankings" buttons
- **List creation**: Name + K-factor + session length. Empty lists allowed. Items added from Rankings page.
- **Soft-delete**: Deleted items move to bucket (collapsed on Rankings, listed in list Settings). Restorable. Excluded from pairing.
- **Delete confirmation**: Always confirm for both items and lists
- **Export**: Three exports (list .md, history .duellist.md, app data JSON) + "Export all". Located in `/settings`.
- **Edit list settings**: Gear icon on Rankings → `/list/:id/settings` (name, K-factor, session length, removed items, delete list)
- **Routes**: `/`, `/welcome`, `/list/:id`, `/list/:id/duel`, `/list/:id/settings`, `/settings`
- **Home list cards**: Name, item count, top-ranked item preview
- **Escaping**: HTML-encode `<!-- -->` in item names. Trim whitespace. Strip newlines.
- **Parser edge cases**: Unknown frontmatter preserved, frontmatter name wins over heading, duplicate IDs regenerated
- **Serialization mapping**: eloScore↔elo, prevEloScore↔prevElo, comparisonCount↔comparisons
