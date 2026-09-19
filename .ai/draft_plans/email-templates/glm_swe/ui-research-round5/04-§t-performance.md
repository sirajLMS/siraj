# Round 5 Audit: §T — Performance

## Summary
- INVALID designs: 1 (T2)
- PARTIAL designs: 2 (T6, T10)
- NEW gaps: 3

## T2 — INVALID (v9 fix introduced reactivity bug)
- v9 uses `isDirtyRef.current` (a ref) for dynamic `fetchPolicy`
- Refs DON'T trigger re-renders — Apollo never sees the new fetchPolicy
- T2 (ref form) contradicts T7 (state form `useEmailTemplateEditorStore(state => state.isDirty)`)
- Must use STATE form, not ref form — `useEmailTemplateEditorStore(state => state.isDirty)` drives re-render → Apollo sees new fetchPolicy

## T6 — PARTIAL (deterministic skip + missing alternative)
- "may skip" should be "WILL emit 'not compatible with Turbopack'" (deterministic, reads `process.env.TURBOPACK`)
- Missing `next experimental-analyze` alternative recommendation

## T10 — PARTIAL (import path mismatch + render leak)
- Attributes no-AbortSignal to `@react-email/render` but §O says import from `react-email` — mismatch
- `Promise.race` doesn't cancel abandoned render (leak)
- Missing concrete `timeout()` helper code

## NEW gaps
1. No debounce for list-view search input
2. No `React.lazy` + `Suspense` per editor tab
3. No `EntityCacheService` reuse for render-cache (existing `cachedRead`/`invalidate` pattern in `docs/services/entity-cache-service.md`)

## Codebase facts verified
- `@react-email/render@2.1.0`: confirmed NO `AbortSignal` in Options type
- EntityCacheService: `docs/services/entity-cache-service.md` describes dual-adapter Postgres+Redis cache
- `next.config.ts`: ESM, `turbopack: {}` enabled, `experimental.optimizePackageImports` present
