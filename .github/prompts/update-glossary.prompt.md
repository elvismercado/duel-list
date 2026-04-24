---
description: "Add or update entries in the Glossary page (/settings/glossary)."
agent: plan
argument-hint: "What to add or change in the glossary"
---
Help me update the Glossary.

**Key files**
- [src/pages/Glossary.tsx](../../src/pages/Glossary.tsx).page sections, anchors, layout
- [src/lib/strings.ts](../../src/lib/strings.ts).copy lives under `S.glossary.*`
- [src/components/HelpHint.tsx](../../src/components/HelpHint.tsx).`?` icon links to `/settings/glossary#<anchor>`

**Things to keep in mind**
- New term rows need a stable `id` so `HelpHint` can deep-link (e.g. `id="tie"`).
- Use `<TermRow>` for terminology entries, `<GlossaryRow>` for icon/color rows.
- Terminology must match [.github/copilot-instructions.md](../copilot-instructions.md). Don't reintroduce "ELO" / "comparison" / "match" in user-facing copy.
- Keep section ordering: terminology first, then visual references.
