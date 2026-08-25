## 2026-08-25 - Array filtering inside component render with excludeIds
**Learning:** In Autocomplete / Select components receiving an `excludeIds` prop, calling `options.filter(opt => !excludeIds.includes(opt.id))` inside render causes O(N*M) linear array scans on every re-render and typing event, alongside redundant array allocations (`options={[...visibleOptions]}`).
**Action:** Always wrap filter computations in `useMemo` and convert `excludeIds` to a `Set<string>` to achieve O(1) membership lookup (overall O(N) filtering) and prevent unnecessary array cloning on render.
