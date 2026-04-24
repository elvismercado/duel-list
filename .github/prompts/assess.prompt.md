# Assess DuelList project state

You are auditing the **DuelList** project against its planned phases.

## Inputs to read
1. `docs/PROJECT_PLAN.md`.the original phased plan (A through F+)
2. `docs/STATUS.md`.the current implementation status log
3. `docs/TECH_DECISIONS.md`.locked technical choices
4. The `src/` tree.actual implemented code
5. `package.json`.installed dependencies and scripts

## Tasks

### 1. Verify status claims
For each phase marked complete in `STATUS.md`, spot-check that the referenced files actually exist and contain the described functionality. Flag any drift between documented status and reality.

### 2. Compute completion
- Per phase: `% complete` based on planned deliverables actually shipped.
- Overall: weighted by phase scope. Distinguish **MVP-complete** (A–F shipped) vs. **product-complete** (stretch goals shipped).

### 3. Health check
Run (or report on):
- `pnpm tsc --noEmit`.type errors
- `pnpm build`.build success, bundle size, PWA precache count
- Quick scan for: TODO/FIXME comments, unused exports, obvious a11y gaps, missing error boundaries

### 4. Gap analysis
List anything in the plan that is **not yet done**, grouped by:
- **Blockers**.would prevent shipping
- **Polish**.quality-of-life improvements
- **Stretch**.beyond original scope

### 5. Recommend next 3–5 improvements
Rank by **impact ÷ effort**. For each:
- What it is (1 sentence)
- Why now (user value or risk reduction)
- Rough effort (S/M/L)
- Files likely touched

## Output format

```markdown
## DuelList Status Assessment.<date>

**Overall:** <X>% MVP · <Y>% product
**Build:** ✅/❌  |  **Type-check:** ✅/❌  |  **Bundle:** <kB>

### Phase completion
| Phase | Status | Notes |
|-------|--------|-------|
| A | ✅ 100% | … |
| … | | |

### Drift from STATUS.md
- …

### Gaps
**Blockers:** …
**Polish:** …
**Stretch:** …

### Recommended next steps
1. **<title>** (S/M/L).<why>.touches `<files>`
2. …
```

## Rules
- Be specific: cite file paths and symbols, not vague areas.
- Don't propose work already done.verify first.
- Don't invent plan items; only assess what `PROJECT_PLAN.md` actually contains.
- No code changes.this is a read-only audit.