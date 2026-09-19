# Round 5 Audit: §G — Accessibility & Interaction Patterns

## Summary
- INVALID designs: 3 (G1, G2, G3, G4)
- PARTIAL designs: 4
- NEW gaps: 7

## G1 — INVALID (wrong paths + deprecated API)
- `frontend/stores/preferencesStore.ts` path is WRONG — stores live at `frontend/common/stores/` (~60 stores)
- "AdminLayout or similar" doesn't exist — real target is `DashboardLayout.tsx` at `frontend/common/views/dashboard/components/DashboardLayout.tsx`
- `@dnd-kit` has ZERO existing usage (email templates would be first)
- `navigator.platform` is deprecated — use `navigator.userAgentData?.platform ?? navigator.platform`

## G2 — INVALID (button loading convention has zero precedent)
- `<Button loading={...}>` convention has ZERO precedent in repo
- Actual convention: `<Button disabled={busy}>` (not loading prop)
- Design's claim "used at line 884" is self-referential (design citing design)
- MUI v9 `loading` prop auto-renders its own spinner — design's prose about `<CircularProgress>` inside `loading` prop is mechanically wrong

## G3 — INVALID (idempotency mechanism wrong)
- `docs/IDEMPOTENCY.md` specifies HTTP header `X-Idempotency-Key` (NOT GraphQL variable)
- Server uses Postgres `CacheDbRepository.insertIfNotExists` (NOT Redis SETNX)
- `EmailTemplateService` doesn't exist
- Design's `crypto.randomUUID()` per-render regeneration violates best practice #3 (reuse same key on retry)
- No client-side persistence mechanism specified

## G4 — INVALID (keyboard shortcuts conflict)
- No keyboard shortcut library exists in repo
- `Cmd/Ctrl+Shift+T` conflicts with browser "reopen closed tab"
- `Cmd/Ctrl+Shift+P` conflicts with browser Print
- `Cmd/Ctrl+K` conflicts with browser URL bar
- Merge-tag picker doesn't exist
- No `preventDefault()` guidance
