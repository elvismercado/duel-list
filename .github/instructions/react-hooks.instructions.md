---
applyTo: "src/**/*.{ts,tsx}"
description: "React hook discipline"
---

# React hook discipline

Declare all hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`, etc.) at the top of the component, before any conditional `return`. Adding a hook below an early-return path triggers "rendered fewer hooks than expected" when that path is taken.

If a hook depends on a value only available after a guard (e.g. `currentPair`), still declare the hook at the top and short-circuit inside the hook body or its deps.
