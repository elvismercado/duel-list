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
- Is the verification checklist complete for all Phase 1 features?

### 2. Challenge Assumptions
- Are there technical decisions that should be reconsidered?
- Is the ELO system the right choice, or would something simpler work?
- Is the markdown-only persistence approach viable for all planned features?
- Are there edge cases in the file format that haven't been addressed?

### 3. Missing Details
- What happens when two items have the same ELO score?
- How are item IDs generated and maintained across sessions?
- How does the app handle a list with fewer than 2 items?
- What's the initial state of a freshly created list (before any duels)?
- How does "original order" work after items have been added over time?
- What data does the "session complete" summary actually show?

### 4. UX Flows Not Yet Specified
- What does the comparison page look like when there are no more useful pairs?
- How does the user navigate between lists?
- Can the user undo a duel decision?
- What feedback does the user get after each duel (animation, rank change preview)?
- How does the first-run "quick tour" actually work?

### 5. File Format Edge Cases
- What if a user manually edits the markdown and corrupts an HTML comment?
- What if items are duplicated in the file?
- What if frontmatter is missing or malformed?
- How are special characters in item names handled (e.g., `<!-- -->` in a name)?
- Maximum file size considerations for a 500-item list?

## How to Proceed

1. Read all three docs thoroughly
2. Present findings organized by the categories above
3. For each finding, suggest a concrete resolution or ask a clarifying question
4. After discussion, update the relevant doc files to capture decisions

Do NOT start implementation. This is a planning and refinement session only.
