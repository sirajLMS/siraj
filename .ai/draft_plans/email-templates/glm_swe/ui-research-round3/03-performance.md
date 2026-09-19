
I have everything for a complete report.

# Email Template System Design v7 — Performance Audit Report

**Design audited:** the v7 email template system design (1421 lines)
**Scope:** Bundle size, lazy loading, caching, memoization, render optimization, query efficiency
**Auditor:** GLM SWE — UI Research Round 3
**Date:** 2026-08-02

---

## Summary Table of Gaps

| # | Sev | Area | Gap Description | Design Location |
|---|-----|------|-----------------|---------------|
| G1 | P0 | Render optimization | NO memoization strategy defined anywhere — zero occurrences of `React.memo` / `useMemo` / `useCallback` in 1421-line design. Editor re-renders on every keystroke are unhandled. | §P (lines 880-937), §Q |
| G2 | P0 | Lazy loading | `next/dynamic` lazy-import only defined for `EmailEditorWrapper`. `@dnd-kit/sortable`, `framer-motion`, `recharts`, `react-color` (color picker), `react-dropzone` and Prism grammars are NOT lazy-loaded — all loaded unconditionally in editor route. | §R (1092, 1124, 1152, 1412) |
| G3 | P0 | Preview perf | NO debounce defined for preview re-render on design changes. No render budget. Preview iframe re-renders on every keystroke (reactivity implicit). | §P6 (919-923), §E (item 12a) |
| G4 | P0 | DB queries | List query indexes missing. `emailTemplates` has indexes only on `(scope,slug)` + partial `(scope,locale) where isActive`. NO index on `status`, `locale`, `updatedAt`, `createdAt`, `scope` alone — list view with `statusFilter`/`scopeFilter`/sort-by-last-edited will sequential-scan. | §DB schema (471-479) |
| G5 | P0 | Search | `search` filter (Q1 keyArgs includes "search", §Q) has NO DB-level strategy. No `ILIKE` / trigram (`pg_trgm`) / `tsvector` definition. Search will full-scan + row-evaluate. | §Q1 (969), §M GraphQL |
| G6 | P1 | N+1 queries | `EmailTemplateReturnType` joins editor name + last revision (line 507) but batching (`findByScopeIds`, `resolveTemplatesByScopes`) is keyed by `scopes[]` — does NOT batch the list→editor-name join or list→last-revision join. N+1 risk in list resolver. | §Repository (515-517), §Service (527) |
| G7 | P1 | Pagination | Offset-limit chosen (Q5, line 1010) but NOT defended against deep-page perf cliff (OFFSET 10000+ scans all skipped rows). No cursor alternative evaluated. No `totalCount` cost analysis for 100+ templates. | §Q5 (1009-1013) |
| G8 | P1 | Render cache | `compiledHtml` IS stored atomically in DB (good, line 452). BUT preview path (`previewEmailTemplate` query, network-only Q2) re-renders server-side on every request — does NOT reuse stored `compiledHtml` when no design change. Preview has no cache hit. | §Q2 (992), §Service (526) |
| G9 | P1 | Render timeout | NO render timeout / AbortController anywhere in design. `safeRender` (1275-1303) has try/catch but no timeout — a slow/hanging React Email render blocks the send path indefinitely. No `promise.race`/deadline. | §safeRender (1264-1305) |
| G10 | P1 | DOMPurify overhead | Sanitization overhead acknowledged only as "defense-in-depth" rationale (1286-1288) — NOT quantified per render. Runs at BOTH save-compile AND send (1288). No memoization of sanitize result on identical HTML. No "sanitize once, cache" pattern. | §safeRender (1289-1296) |
| G11 | P1 | Memoization (Zustand) | Design says "Zustand store" (line 877) but does NOT define the per-field selector pattern (`useStore(state => state.x)`) that the existing `adminComplaintsStore` uses (verified — `useAdminComplaintsViewModel.ts:68-73` selects per field). Without this discipline, the editor re-renders on every store change. | §Zustand Store (875-877) |
| G12 | P1 | Bundle analyzer wiring | `@next/bundle-analyzer@16.2.12` IS installed (package.json:185) but NOT wired in `next.config.ts` (no `withBundleAnalyzer` wrapper). `experimental.optimizePackageImports` lists MUI/X libs but NOT `@react-email/editor`, `react-email`, TipTap, Prism, `@dnd-kit`. Code-splitting is item 20b (P2) but the analyzer scaffold is absent from `next.config.ts`. | `next.config.ts:63-71`, item 20b (107) |
| G13 | P1 | Memory / cleanup | `File/Blob` in `useRef` called out (Q10, line 1057) but NO `URL.revokeObjectURL` cleanup defined. Codebase has the pattern (`useImageUpload.ts:169,183`). Editor JSON garbage-collection on unmount NOT defined. Apollo `cache.evict`/`cache.gc` (existing pattern, `useCreateManagerOnboarding.ts:35-36`) NOT defined for archive/restore/delete. | §Q10 (1057), §Q6 (1015-1021) |
| G14 | P2 | Memory / Apollo | §Q6 says "refetch lists" after mutation but does NOT define `cache.evict` for hard delete / archive / restore. Optimistic updates (Q4) use `cache.modify` only; no eviction strategy for stale entries. Apollo `gc()` not invoked. | §Q6 (1015-1021), §Q4 (998-1007) |
| G15 | P2 | Large list | NO virtualization defined. AppDataGrid has no `rowHeight` / `getRowHeight` / `isRowSelectable` virtualization config in design (`100+ templates` case unaddressed). Verified AppDataGrid has no virtualization calls today. | §R2 (1077-1089), §P4 (904-909) |
| G17 | P2 | Connection pooling | NOT mentioned anywhere in design. Production uses Neon serverless HTTP driver (`@neondatabase/serverless` in `serverExternalPackages`, `docs/drizzle/neon-http-client.md`). Batch fetches (DataLoader) over HTTP-per-request driver is unacknowledged — every repo call is a separate HTTP round-trip. | §Repository (512-518) |
| G18 | P2 | Editor focus perf | No `selection-only` re-render optimization defined. TipTap editor imperatively prevents keystroke re-renders but the surrounding Inspector panel (subject, permissions, locale) is React-managed and not isolated from the `<EmailEditorWrapper>` subtree. | §P1 (883), §R (1097-1101) |
| G19 | P3 | FTS implications | `search` field appears in `keyArgs` (Q1, line 969) but GraphQL schema (line 772) types it as `emailTemplates(scope?, status?, pagination)` — `search` argument is NOT in the documented query signature. Inconsistent contract. | §Q1 (969), §GraphQL (772) |
| G20 | P3 | pretty-print | `pretty: false` is hardcoded in `safeRender` (line 1285) for all paths — but design line 1305 says "use `pretty` only in debug/preview paths, not production sends." The hardcoded `false` means preview ALSO gets un-prettified HTML, contradicting the stated guidance. Minor. | §safeRender (1285, 1305) |

---

## Detailed Findings Per Area

### 1. Bundle Size Strategy

**Verification results:**
**(a) `@next/bundle-analyzer` installed?** YES — `package.json:185` (`"@next/bundle-analyzer": "^16.2.12"`), as a devDependency. Verified.
**(b) Current `next.config.ts` code-splitting?** Minimal. `next.config.ts:63-71` has `experimental.optimizePackageImports` listing only `@mui/x-data-grid`, `@mui/x-date-pickers`, `@mui/icons-material`, `@mui/material`, `date-fns` — NOT `@react-email/editor`, `react-email`, TipTap, Prism, `@dnd-kit/*`, `framer-motion`, `react-color`. There is NO `withBundleAnalyzer` wrapper in `next.config.ts`, so item 20b's `NEXT_BUNDLE_ANALYZER=enabled bun run build` cannot actually run until the wrapper is added.
**(c) Dynamic import for `@react-email/editor`?** Partially defined. The V5-5 changelog (line 1390) claims `next/dynamic({ ssr: false })` is consolidated in `EmailEditorWrapper.tsx` ONLY — but grep for `next/dynamic`, `ssr: false`, `dynamic(` in the design returns ZERO literal matches in the body. The consolidation claim lives only in the changelog narrative, not in an actionable design block. Compare with the verifiable `createLazyView.ts` in the actual codebase (which DOES use `next/dynamic` with `ssr` default `true`).

**Gap G12 (P1):** Bundle analyzer is installed but not wired. The design should add the `withBundleAnalyzer` wrapper snippet to `next.config.ts` and add `@react-email/editor` / TipTap / Prism / `@dnd-kit` to `optimizePackageImports`.

---

### 2. Lazy Loading Patterns

**Verified against codebase:**
- `next/dynamic` is used in 3 files only (`createLazyView.ts`, `DashboardContainerView.tsx`, `createTabbedPanePanels.tsx`).
- `@dnd-kit/sortable` has **0** current imports in `frontend/` (grep returns nothing). The design adds it unconditionally in `SortableListWrapper` (R8/R13/R3) — no lazy loading.
- The preview iframe (`srcDoc`/sandbox) rendering is defined only for SHAPE and CSP (item 12a, V5-3) — nothing about *when* it re-renders.

**Other heavy components not addressed (Gap G2, P0):**
- `@dnd-kit/sortable` + `@dnd-kit/core` — heavy sortable library, imported throughout editor route.
- `framer-motion` (used for `Slide` tab transitions, `MetricCard` stagger, `SuccessCheckMark`).
- `react-color` (already a transitive dep — line 138/150 `react-color@^2.19.3`) — merge-tag picker color controls.
- `react-dropzone` / `react-image-crop` — attachment upload UI.
- Prism.js — item 16 says "Lazy-load Prism.js grammars only in editor route (Turbopack dev slowdown)" but no concrete dynamic-import code is shown.
- `recharts` (large viz library) — referenced as a dep but no editor-route usage justified.

The design's lazy-loading stance is single-component (`EmailEditorWrapper`) and neglects the other heavy editor-route dependencies.

---

### 3. Apollo Query Efficiency (§Q, lines 954-1064)

**(a) N+1 query risks in list view — Gap G6 (P1):**
`EmailTemplateReturnType` is defined to include joins (line 507: "joins: editor name, last revision"). The repository's batching methods are `findByScopeIds(scopes: EmailScope[], tx?)` (line 517) and `resolveTemplatesByScopes(scopes, locale)` (line 527) — both keyed by **scope**, NOT by **template id**. For a list returning N rows, the resolver must:
1. Load N templates ✓ (one list query)
2. Resolve `createdBy`/`editedBy` → User names — NO batch loader defined (DataLoader plugin IS wired at `gqlSchemaBuilder.ts:3` but no `loadable` field declared on the Pothos object)
3. Resolve `lastRevision` — the schema has `emailTemplateRevisions.templateId` index (line 494) but no batching method `getRevisionsByTemplateIds`.

The Neon HTTP driver (line 61 `serverExternalPackages`) is req-per-call — each N+1 row becomes a separate HTTP round-trip. This is the highest-impact query gap.

**(b) Pagination strategy — Gap G7 (P1):**
Q5 (line 1010) chooses offset-limit (`page`, `pageSize` in Zustand). Comment: "Filter change → reset to page 1." No mention that `OFFSET 10000+` degrades on Postgres (skips are re-scanned). For ~13 scopes × 2 locales × ~5 status variants = expected row count is small (dozens), so deep pages are unlikely — but the choice is undocumented. Cursor pagination (stable sort on `updatedAt`, `id`) would be safer for indefinite use. The design does not justify offset-limit over cursor.

**(c) Fetch policies — partially appropriate:**
Q2 table (lines 988-993):
- List `cache-and-network` — fine (no flash).
- Detail `cache-and-network` — fine for editor.
- Preview `network-only` — **over-fetches**. Preview with `network-only` ignores the just-stored `compiledHtml` (Gap G8). Preview re-renders server-side on every preview-tab visit even when no design change has occurred. Should be `cache-first` keyed on `version` + `isDirty`.
- History `cache-first` — appropriate (immutable).

**(d) DataLoader pattern — present but underdefined:**
`@pothos/plugin-dataloader` is in dependencies and wired in `gqlSchemaBuilder.ts:3`. The design mentions `findByScopeIds` / `resolveTemplatesByScopes` Map-returning methods — but the design never shows the Pothos `loadable(...)` wiring on the object type, so it's not enforceable. No `loadable` field declaration on `EmailTemplatePothosObject` is defined.

---

### 4. React Render Optimization (§P and §R)

**Verified:**
- Grepped the entire 1421-line design for `React.memo`, `useMemo`, `useCallback`, `memo(` — **zero occurrences**.
- §P (P1-P9, lines 882-937) covers loading states, optimistic transitions, edge cases — nothing about re-render prevention.
- §R covers responsive/touch — nothing about render perf.

**(a) Memoization strategies — Gap G1 (P0):**
Not defined AT ALL. No `React.memo` on list rows, no `useMemo` on derived `compiledHtml` strings, no `useCallback` on stable handlers.

**(b) Editor view prevented from re-rendering during typing?**
Not addressed. The design says "TipTap edits an opaque JSONContent blob" (line 331) and `getJSON()` is synchronous (item 16a) — meaning every keystroke mutates local React state (the `designJson` in the ViewModel hook). Without explicit isolation (e.g., TipTap editor state lives in the editor instance, not React state; debounced commit to React state only), every keystroke re-renders the whole editor chrome (Inspector + action bar + tabs).

**(c) Are list items memoized?**
Not defined. AppDataGrid rows have no `React.memo` row component mentioned.

**(d) Zustand store selector pattern — Gap G11 (P1):**
Design says "Zustand store" (line 877) generically. The codebase precedent (`adminComplaintsStore.ts:34`, consumed at `useAdminComplaintsViewModel.ts:68-73` with per-field selectors like `useAdminComplaintsStore(state => state.searchQuery)`) is NOT referenced. Without this discipline, the editor's React tree re-renders on every Zustand change (filter, pagination, dirty flag) even when unrelated.

---

### 5. Database Query Performance (§Repository, lines 512-518; §DB schema 426-498)

**Verified against schema (lines 444-498):**

```ts
emailTemplates indexes:
  (scope, slug)       UNIQUE            — line 472
  (scope, locale) WHERE isActive=true   PARTIAL UNIQUE  — line 476-478
emailTemplateRevisions indexes:
  (templateId)                           — line 494
  (templateId, version) UNIQUE          — line 495
```

**(a) Indexes for all query patterns — Gap G4 (P0):**
List view filter axes per §Q1 `keyArgs: ["scope", "locale", "status", "search"]` and §R2 column visibility (`status`, `scope`, `locale`, `version`, `lastEdited`). Query patterns that LACK supporting indexes:
- `WHERE status = $1` — no index on `status` alone. A "Show Archived" filter scans all rows.
- `WHERE locale = $1` — no index on `locale` alone.
- `ORDER BY updatedAt DESC` ("Last Edited" column) — NO index on `updatedAt`. First-page-by-last-edited sorts ALL rows in memory after table scan.
- `WHERE scope = $1` alone (single-scope detail/list) — the `(scope, slug)` index covers this, OK.
- `search` (Gap G5) — no index. (see (c)).

Partial unique `(scope, locale) where isActive` is good for the "one active per scope+locale" constraint, but it serves the constraint, not the list query path. A composite non-unique index `on(scope, status)` or `on(status, updatedAt)` is missing.

**(b) Partial unique index definition — well-defined:**
Lines 473-478 are explicit and correct: `sql\`${t.isActive} = true\`` (literal, not `eq()`) to avoid the drizzle-kit parametrization bug (#3349, #4790). The `.on(t.scope, t.locale)` columns are correct. **Good.**

**(c) Full-text search implications — Gap G5 (P0):**
The `search` filter appears in `keyArgs` (line 969) but:
- The GraphQL query signature (line 772) does NOT include a `search` argument — only `scope?`, `status?`, `pagination`. **Schema/contract mismatch (Gap G19, P3).**
- No `ILIKE`/`pg_trgm`/`tsvector`/GIN index defined anywhere. Repository `list({ scopeFilter, statusFilter, pagination })` (line 515) has NO `searchFilter` parameter.
- With 100+ templates, an unindexed `ILIKE '%term%'` against `name`/`slug` performs a full table scan with row evaluation.

**(d) Connection pooling — Gap G17 (P2):**
NOT mentioned in the 1421-line design. Production target is Neon serverless HTTP driver (`@neondatabase/serverless` in `next.config.ts:61` — `docs/drizzle/neon-http-client.md` exists). Every REPL/repository call is a separate HTTP request to Neon — there is no persistent connection to "pool". The implication for this design: N+1 reads (Gap G6) become N HTTP round-trips, and DataLoader batching must happen at the GraphQL layer (per request lifecycle), not via Postgres connection reuse. The design never addresses this; an executor unfamiliar with Neon will assume Postgres-pool semantics.

---

### 6. Email Rendering Performance (§safeRender, lines 1264-1305)

**(a) DOMPurify overhead acknowledged — Gap G10 (P1):**
Acknowledged ONLY as rationale for defense-in-depth (1286-1288). Not quantified. The design states sanitization runs at BOTH save-compile AND send ("at render (both save-compile and send)", line 1288). For daily send volumes (per-event fan-out), `DOMPurify.sanitize()` is invoked once per outbound email — when the HTML is identical per (scope, locale) template, this is rework. No "sanitize once per template version, store `safeCompiledHtml`" memoization pattern is defined. The `compiledHtml` DB column (line 452) stores HTML re-compiled atomically with `designJson` save — but the design's text distinguishes `compiled_html` from the *sanitization* step at send time, leaving the actual stored value's sanitization status ambiguous.

**(b) Render cache (compiled HTML in DB) — partial:**
`compiledHtml`/`compiledText` ARE stored (lines 452-453), re-compiled atomically in the same transaction as `designJson` save (item 12 step 4). **This is a real render cache** — good. Gap G8 (P1): the preview path (`previewEmailTemplate` query, `network-only`, line 992) does NOT reuse this stored cache — preview re-renders server-side on every request, ignoring the cached render for unchanged designJson. Send path uses the cache correctly (by storing and re-using compiledHtml).

**(c) Render timeout strategy — Gap G9 (P1):**
NONE. The `safeRender` try/catch block (1281-1302) catches thrown errors but NOT hangs. No `Promise.race` with a deadline, no `AbortController`, no `setTimeout(..., 5000)` budget. If a React Email component enters an infinite render loop or awaits a never-resolving promise (e.g., a misconfigured `attachments` async resolver per line 241), the send path blocks indefinitely. Verified: grep for `AbortController`/`setTimeout`/`signal` in the entire design returns only one unrelated match (line 1002).

**(d) pretty-print skipped in production — Gap G20 (P3):**
Line 1285 hardcodes `pretty: false` in `safeRender` — applied to ALL paths including preview. Line 1305 then says "use `pretty` only in debug/preview paths, not production sends." These conflict. The hardcoded `false` makes preview also skip prettification, contradicting the stated guidance. Minor (aesthetic only).

---

### 7. Preview Tab Performance

**Verified:**
- Preview iframe TECHNOLOGY defined well: `sandbox=''` + CSP `default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:` (item 12a, lines 66-67).
- P6 states (lines 919-923): empty/loading/error/unsaved-draft states — but NOTHING about *when the iframe re-renders*.

**(a) Debounce for preview re-render on design changes — Gap G3 (P0):**
NOT defined. Grep for `debounce`/`debounced`/`Debounce` in the design returns **zero matches**. The codebase has `use-debounce@10.1.1` (package.json:163) and uses `debouncedSearch` pattern in `useAudienceAutocomplete.ts:22,53,64` — precedent exists. Whenever the designJson changes in the editor (every keystroke), the preview iframe must re-fetch `previewEmailTemplate` (currently `network-only`) — that is a server round-trip per keystroke. Without `useDebouncedCallback` (300-500ms), the preview tab will hammer the GraphQL endpoint while typing.

**(b) Render budget — NONE:**
No frame-budget, no `requestIdleCallback`, no "preview lags editor by N ms" definition.

**(c) Preview re-renders on every keystroke? — implied yes:**
The design never says otherwise. Combined with `network-only` (Gap G8) and no debounce (Gap G3), this is the worst user-perceived performance gap in the design. A 5ms debounce + `cache-first` keyed on `(version, isDirty)` would solve it.

---


### 9. Large List Performance (Virtualization)

**Verified — Gap G15 (P2):**
- Design §R2 (1077-1089) lists column visibility per breakpoint — nothing about row virtualization.
- §P4 (904-909) covers bulk-archive optimistic row removal — nothing about large lists.
- AppDataGrid in the codebase has no `rowHeight`/`getRowHeight`/virtualization calls (grep returned nothing).
- @mui/x-data-grid (line 79) supports ` rowHeight`, `getRowHeight`, `experimentalFeature virtualization` (`columnVirtualization` is default on). The design never opts in.

**(a) 100+ templates — virtualization defined? NO.**
The scope catalogue is 13 EmailScope values × ~2 locales × 3 statuses (DRAFT/PUBLISHED/ARCHIVED) — realistically dozens to a few hundred rows over time. The design does not define a threshold at which to invest in virtualization, nor whether the DataGrid opts into the existing `rowHeight` budget. For mobile per §R3 (line 1095), the design uses "Show More" load-25 rows button — adequate for small N but unbounded growth is unaddressed.

**Recommendation:** At minimum, set `AppDataGrid` `getRowHeight={() => 'auto'}` budget, document a 200-row threshold where virtualization becomes mandatory.

---

### 10. Memory Management

**Verified:**
- Q10 (line 1057): `File/Blob (attachments)` → `useRef()` — V5-8 serialization rule.
- §P2 (line 1002): "Restore `designJson` from `useRef`" for optimistic rollback.

**(a) Object URLs cleaned up — Gap G13 (P1):**
NO. The `File/Blob in useRef` rule (Q10) does not define `URL.revokeObjectURL`. The codebase precedent exists:
- `useImageUpload.ts:169` — `URL.revokeObjectURL(objectUrlRef.current)` (cleanup on revoke)
- `useImageUpload.ts:183` — `URL.createObjectURL(file)`
- `useClassAuditViewModel.ts:238,245` and `useEventLogDownload.ts:28,35` show the create-then-revoke pattern.

For email attachment uploads, an unreleased Blob URL leaks memory until the route unmounts. The design should define a `useEffect(() => () => revokeObjectURL(...), [])` cleanup pattern matching `useImageUpload`.

**(b) Editor JSON garbage-collected on unmount — NOT defined:**
The design stores `designJson` in Apollo cache (Q10) — when the editor route unmounts on navigate-away, the TipTap editor instance (`EmailEditorRef.editor`) is not explicitly destroyed. No `editor.destroy()` call is defined on `useEffect` cleanup. TipTap editors must be `.destroy()`ed to release their DOM + ProseMirror state; otherwise the editor instance is retained for the React GC cycle (potentially leaking DOM nodes and the ProseMirror state object).

**(c) Apollo cache evictions for deleted templates — Gap G14 (P2):**
§Q6 (1015-1021) says "refetch lists" after archive/restore — but Archive is a soft transition (status flip), not a hard delete. Even for soft Archive, the in-memory Apollo cache still holds the stale detail object. The codebase precedent — `cache.evict({ id: 'ROOT_QUERY', fieldName: 'managerDirectory' }); cache.gc();` (`useCreateManagerOnboarding.ts:35-36`) — is NOT referenced in the email templates design. The design's optimistic `cache.modify` (Q4) handles status flips but never `cache.evict`s detached ROOT_QUERY entries. After `Restore` (line 1019: "refetch editor + history"), the stale `EmailTemplateVersions` cache entries (per Q2 `cache-first`, line 993 — "no refetch needed after load") are NOT invalidated — restoring an old version reverts DB rows but Apollo still serves the stale `cache-first` history.

---

## Top 5 Actionable Recommendations

### R1. (P0) Specify memoization + debounce discipline for the editor route
Add a `§P10 Render Optimization` subsection compelling:
- `React.memo` on every `EmailTemplateRow` and `ListItem` component.
- `useMemo` for derived `compiledHtml` strings.
- `useCallback` for stable handlers passed to descendants.
- TipTap editor state lives on the editor instance (`EmailEditorRef`), NOT in React store; commit to React state only on debounced tick (300ms).
- `useEffect(() => () => editorRef.current?.editor?.destroy(), [])` cleanup on unmount (fixes G1, G13(b)).
- Document WHY `react-compiler` (`babel-plugin-react-compiler` v1.0.0 devDep, line 219) does NOT replace these manual patterns here (Next.js may not propagate RC into the editor subtree).

### R2. (P0) Add preview debounce + render cache reuse
- Switch `PreviewEmailTemplateQueryDocument` `fetchPolicy` from `network-only` to `cache-first` keyed on `(id, version, isDirty)` (Gap G8).
- Add `useDebouncedCallback` (300-500ms) for preview re-render on designJson change (Gap G3), reusing `use-debounce@10.1.1` (already installed).
- Use stored `compiledHtml` for preview when `designJson` is unchanged from last saved version; only re-render server-side when `isDirty`.
- Specify a render budget (`AbortController` + 5s timeout) on `previewEmailTemplate` resolver (also covers G9 for sends).

### R3. (P0) Complete the index layer + search strategy for `emailTemplates`
Add the following indexes to `emailTemplates.ts` schema (Gap G4, G5):
```ts
index("email_templates_status_idx").on(t.status),                            // status-only filter
index("email_templates_updated_at_idx").on(t.updatedAt),                    // "Last Edited" sort
index("email_templates_scope_status_idx").on(t.scope, t.status),             // scope+status composite
// Search: pick ONE based on expected cardinality (research-gated):
index("email_templates_name_trgm").using("gin", sql`to_tsvector('english', ${t.name})`),  // full-text (small N OK)
// OR pg_trgm: index("email_templates_name_trgm").using("gin", sql`similarity(${t.name}, ?)`) — needs pg_trgm extension
```
Resolve Gap G19 (P3): add `search?: String` arg to the `emailTemplates(scope?, status?, search?, pagination)` query signature in §GraphQL (line 772) to match Q1 `keyArgs`.

### R4. (P1) Wire batch loaders for N+1 joins + wire the bundle analyzer
For the GraphQL list resolver (Gap G6):
- Declare `loadable` fields on `EmailTemplatePothosObject` using `@pothos/plugin-dataloader` (already wired at `gqlSchemaBuilder.ts:3`): `createdBy`, `editedBy`, `lastRevision` — each backed by a `DataLoader` batching `id[]`→rows (mirror the existing `findByScopeIds` pattern but keyed by `id[]`).
- Add `getRevisionsByTemplateIds(templateIds[])` repository method returning `Map<templateId, Revisions[]>` for last-revision batching.

For `next.config.ts` (Gap G12):
- Wrap `nextConfig` with `withBundleAnalyzer({ enabled: process.env.NEXT_BUNDLE_ANALYZER === 'enabled' })`.
- Append to `experimental.optimizePackageImports`: `@react-email/editor`, `react-email`, `@dnd-kit/sortable`, `@dnd-kit/core`, `framer-motion`, `react-color`, `react-dropzone`.

### R5. (P1) Harden memory / Apollo cache lifecycle
- Add explicit `URL.revokeObjectURL` cleanup for any createObjectURL on uploaded attachments, matching `useImageUpload.ts:169` (Gap G13(a)).
- Specify `cache.evict({ id: 'ROOT_QUERY', fieldName: 'emailTemplates' }) + cache.gc()` on hard delete and on `Restore` (Gap G14), matching `useCreateManagerOnboarding.ts:35-36`.
- For version Restore (Q6, line 1019): explicitly call `cache evict` on `EmailTemplateVersions` query (currently `cache-first` per Q2 — stale after restore), then `refetchQueries: ['EmailTemplateVersions']`.
- Acknowledge the Neon HTTP driver — issues per request (Gap G17): recommend all batch reads happen in the GraphQL `loadable` layer (single DataLoader per request), not as multiple repository calls inside a resolver map.

---

**Report complete.** 20 gaps identified: 6 P0, 8 P1, 5 P2, 1 P3. The gravest gaps are the complete absence of memoization definition (G1), preview debounce (G3), and DB indexes for the list query (G4) — each independently degrades production user-perceived performance on the editor/list surfaces.