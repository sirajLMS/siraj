Agent is idle (waiting for messages). agent_id: r4-performance, agent_type: explore, status: idle, description: R4: Validate v8 §T performance, elapsed: 1345s, total_turns: 1

[Turn 0]
I have all the evidence I need. Here is the complete Round 4 audit report.

---

# §T Performance Optimization — Round 4 Validation Report

Audited v8 §T (lines 1464–1542) against the actual codebase. **Findings: 4 VALID, 4 PARTIAL, 2 INVALID.** The v8 spec is broadly directionally-correct, but contains wrong file paths, a React Compiler false-assumption, an impossible AbortController claim, and an Apollo `keyArgs` / `fetchPolicy` contradiction with §Q.

## 1. Validation Summary

| § | Sub-section | Status | Remaining Gaps | Headline |
|---|---|---|---|---|
| T1 | Memoization Discipline | **PARTIAL** | 4 | React Compiler is installed but NOT enabled in `next.config.ts` — v8 treats it as a "maybe" when it is definitively off; RC claim that it handles `useMemo` needs activation step. |
| T2 | Preview Debounce + Render Cache | **INVALID** | 3 | "Cache-first keyed on `(id,version,isDirty)`" contradicts §Q1 `EmailTemplate` `keyArgs: ["id"]`; `isDirty` is Zustand client state — cannot be an Apollo cache key. |
| T3 | Lazy-Load Heavy Deps | **PARTIAL** | 3 | `next/dynamic` wrong tool for non-component imports (Prism grammars); `react-color` 1.1M / `@dnd-kit/sortable` 404K are light — not "heavy". `@react-email/editor` is NOT a CJS-module package and has no `main`/`module`. |
| T4 | DB Indexes for List Query | **VALID** | 2 | `pg_trgm` IS already enabled (`backend/db/migration/1-extensions.sql:3`); `emailTemplates` table does not yet exist — no conflict possible. Drizzle `index()` precedent exists. |
| T5 | N+1 DataLoader | **VALID** | 1 | `@pothos/plugin-dataloader@4.4.5` wired (`gqlSchemaBuilder.ts:3,84`); `loadable()` in-use pattern verified at `user.pothos.ts:49-74`. Repo asks `getRevisionsByTemplateIds(ids: string[]): Map`. |
| T6 | Bundle Analyzer Wiring | **INVALID** | 2 | Spec's `require("@next/bundle-analyzer")(...)` + `module.exports =` is wrong for this codebase — `next.config.ts` uses ESM `export default`; `@next/bundle-analyzer@16.2.12` IS **incompatible with Turbopack** (warns + silently skips). `next.config.ts:62` enables `turbopack: {}`. |
| T7 | Zustand Selector Discipline | **VALID** | 1 | Pattern confirmed verbatim at `useAdminComplaintsViewModel.ts:68-82` — per-field `useAdminComplaintsStore(state => state.X)`; no immer/persist middleware on `adminComplaintsStore.ts:34`. |
| T8 | URL.revokeObjectURL Cleanup | **VALID** | 0 | Pattern verified at `useImageUpload.ts:167-178,181-188`; spec's example matches actual code. |
| T9 | Apollo Cache Eviction | **VALID** | 1 | `cache.evict({id:"ROOT_QUERY",fieldName}) + cache.gc()` pattern live at `useCreateManagerOnboarding.ts:35-36`; needs `typePolicies` keyArgs fix from T2 to evict properly. |
| T10 | Render Timeout | **INVALID** | 2 | `@react-email/render render()` signature is `(node, options?: Options) => Promise<string>` — **no `AbortSignal`** in `Options`. `Promise.race` is the ONLY viable path; v8 mentions both as if both work. |

---

## 2. Detailed Findings per Sub-section

### T1 — Memoization Discipline (PARTIAL)
**Codebase claims checked:**
- v8: "React.memo on every `EmailTemplateRow` / `StatusBadge`" — codebase has only **2** `React.memo`/`memo()` files in `frontend/common` vs **123** `useMemo` and **77** `useCallback` files. There is **no established `React.memo` convention** to mirror. The claim "codebase precedent supports React.memo" is overstated; the precedent is overwhelmingly `useMemo`/`useCallback`.
- v8 claims `babel-plugin-react-compiler@1.0.0` is in devDeps → **TRUE** (`package.json:??`; installed at `node_modules/babel-plugin-react-compiler/package.json`, version `1.0.0`).
- v8 implies RC activation is uncertain → **DEFINITIVELY OFF**: `next.config.ts:52-71` has no `reactCompiler: true` / no `experimental.reactCompiler`, no `.babelrc`/`babel.config.*`/`.swcrc`. RC is dormant. The v8 tip "if Next.js propagates RC into the editor subtree" is misleading — unless explicitly enabled, RC does nothing and manual memoization is mandatory, not optional.
- v8 cleanup claim matches `useImageUpload.ts:163-178` (`useObjectPreviewState` cleanup). ✓

**Gaps:**
- **G1.1** RC status is mislabeled as "verify if enabled" — it is OFF; v9 must state "RC is disabled in `next.config.ts`; enable `experimental.reactCompiler: true` OR add manual memoization — pick one."
- **G1.2** No file paths for the components to memoize (where is `EmailTemplateRow` defined? Not in `frontend/views/` — that path doesn't exist; layout is `frontend/common/views/dashboard/…`).
- **G1.3** Spec doesn't acknowledge React 19 RC's rule-of-thumb: with RC on, manual `useMemo`/`useCallback` are largely redundant; *but* RC still does **not** wrap components in `React.memo` — that part of the spec is correct.
- **G1.4** 300ms debounce quote for TipTap commit conflicts with T2's identical 300ms quote — both use the same debounce constant; v9 should centralize as `EDITOR_COMMIT_DEBOUNCE_MS = 300`.

### T2 — Preview Debounce + Render Cache (INVALID)
**Codebase claims checked:**
- `use-debounce@10.1.1` ✓ installed; `useDebouncedCallback` exists with signature `useDebouncedCallback<T extends (...args:any)=>ReturnType<T>>(func: T, wait?: number, options?: Options, forceUpdate?) => DebouncedState<T>` — spec's `useDebouncedCallback(300ms)` is **shape-correct but spec should add `Options`** and confirm `flushOnExit` for the save-on-unmount case. **G2.1** Missing options/fn细节.
- v8 cites `useAudienceAutocomplete.ts:22,53,64` as the precedent. Actual file `frontend/common/hooks/userAutocomplete/useAudienceAutocomplete.ts` does NOT use `use-debounce` — it uses raw `setTimeout`/`clearTimeout` (lines 57-62). The `debouncedSearch` keyword appears but the hook is hand-rolled, **not `useDebouncedCallback`**. **G2.2** Cited precedent does not exist as described.
- **Critical:** "Switch preview fetchPolicy from `network-only` to `cache-first` keyed on `(id, version, isDirty)`" — Apollo `cache-first` does not "key" on `(id,version,isDirty)`; the cache key is whatever the **`keyArgs`** of the type policy lists. §Q1 (line 960) declares `EmailTemplate.keyArgs: ["id"]` only. **`version` and `isDirty` are not in `keyArgs`, so they cannot differentiate cache entries.** Worse, `isDirty` is a Zustand store value (line 1518) — it is client state, never sent in the query variables, so it can never be part of any Apollo cache key at all.
- §Q2 table (line 992) locks `PreviewEmailTemplateQueryDocument` → `network-only`. §T2 (line 1478) overrides to `cache-first`. **These directly conflict.** **G2.3** v9 must reconcile §Q2 and §T2 — either amend §Q2 to drop `network-only` or v9 must explicitly call out "supersedes §Q2 row 3."
- Apollo does support dynamic `fetchPolicy` per render (passing `fetchPolicy` as a prop to `useQuery`), but toggling between two policies based on dirty state implies two cache behaviors that will fight — v9 must spec the toggle mechanic (e.g. `fetchPolicy={isDirty ? 'network-only' : 'cache-first'}`) and confirm `cache-first` returns a stale snapshot when the directory entry was never fetched on a clean preview.

### T3 — Lazy-Load Heavy Deps (PARTIAL)
- v8: "`@dnd-kit/sortable` (heavy)" — actual `du`: `@dnd-kit/sortable` 404K (incl. deps), `@dnd-kit/core` 1.7M. The sortable piece is the smaller of the two — core is the heavier dep. **G3.1** Bundle claim mis-sizes the dependency.
- v8 lumps `recharts` (9.6M), `framer-motion` (5.9M), `react-email` (19M) together as "heavy" — true for those (recharts/framer-motion especially). `react-color` 1.1M is borderline.
- **G3.2** `next/dynamic` is component-only; Prism grammars are non-component side-effectful `import()` calls. v9 must say "use bare `await import('prismjs/components/prism-…')` (side-effect import) for Prism grammars, NOT `next/dynamic`."
- **G3.3** `@react-email/editor` exists at `node_modules/@react-email/editor/` but its `package.json` has **no `main`/`module` fields** — it exposes `dist/` with framework-specific exports. A naive `next/dynamic(() => import('@react-email/editor'))` may fail to resolve the entry point; v9 must specify the exact subpath (`@react-email/editor/uninitialized`) — that is the documented entry per @react-email docs.
- `experimental.optimizePackageImports` is currently a 5-entry MUI list at `next.config.ts:64-70`. v8's additions are sensible **but `react-email` (19M) should NOT be in optimizePackageImports** — that flag is for tree-shaking laissez-faire huge packages with named exports; `react-email` re-exports `@react-email/render`'s `render`, so adding it risks double bundling. **G3.4** Drop `react-email` from the `optimizePackageImports` list.

### T4 — DB Indexes (VALID)
- `pg_trgm` is **already enabled** at `backend/db/migration/1-extensions.sql:3` and drizzle-mirror `backend/drizzle/20260725202527_extensions/migration.sql:3`. v8 spec says "add `pg_trgm` extension" — **already done; v9 must say "reuse the existing `pg_trgm` enabled in `1-extensions.sql`."**
- The `emailTemplates` Drizzle schema **does not exist yet** (no match for `emailTemplate*` in `backend/db/schema/`); `backend/db/schema/index.ts` has no email barrels. So proposed indexes cannot conflict with an existing partial unique index — **G4.1** v8 says "compatible with existing partial unique index" but there is no table to compare against yet; v9 should reference the unique-constraint that §N/M will introduce (presumably `(scope, locale, status=ACTIVE)` WHERE uniqueness).
- Drizzle `index(...).on(...)` precedent is solid (`backend/db/schema/teachers/teachers.ts:33-39`). Desc index: `drizzle-orm/pg-core` supports `.on(desc(table.updatedAt))` — v9 should show this exact call form.
- Trgm GIN index precedent exists: `idx_students_name_trgm ON students USING gist (name gist_trgm_ops)` (migration `20260725202528_square_otto_octavius/migration.sql:1331`). v9 should mirror this verbatim for emailTemplates `name` + `slug`.

### T5 — N+1 DataLoader (VALID)
- `import DataloaderPlugin from "@pothos/plugin-dataloader"` at `gqlSchemaBuilder.ts:3`, wired in `plugins[...]` at line 84. ✓
- **`loadable()` is in active use** — `backend/graphql/pothos/users/user.pothos.ts:49-74` shows the exact API: `t.loadable({ type, load: async (ids: string[]) => ids.map(...) , resolve: parent => parent.id })`. The `load()` returns an array **aligned-to-order** (Map lookup par-`ids.map`). v9 should lift this exact pattern.
- `loadableObjectRef` also used (`student.pothos.ts:22`, `class-category.pothos.ts:6`). No need for inline loader — both inline (`loadable`) and ref (`loadableObjectRef`) APIs are available; v8's note "no `loadable` field is shown in the plan" is still true — none in the **email-templates** sections.

**Gaps:**
- **G5.1** v8 says "repo method `getRevisionsByTemplateIds(ids: string[])` Map-returning" — pattern matches existing `getUserContexts(ids)` returning `Map` (used at line 51). v9 must specify: returns `Map<templateId, LastRevisionRow | null>` and aligns to the `ids.map` order so Pothos `load` can map straight across.
- v8 does NOT specify that the `createdBy` field is `editorName`-only — the resolved scalar should be `{ editorId, editorName }` (passes through `UserPothosObject` `loadableRef` if you want a nested user); otherwise two loaders stack (template→user→role). v9 should pick: scalar `editorName: String` `loadable` (simple) OR `createdBy: UserRef` reusing existing `UserPothosObject` (relational).

### T6 — Bundle Analyzer Wiring (INVALID)
- v8 spec snippet:
  ```ts
  const withBundleAnalyzer = require("@next/bundle-analyzer")({ enabled: process.env.NEXT_BUNDLE_ANALYZER === "enabled" });
  module.exports = withBundleAnalyzer(nextConfig);
  ```
- This is **wrong in two ways** for this codebase:
  1. `next.config.ts` is **ESM** (`export default nextConfig` at line 137; `import type { NextConfig }`). v8's `require()` + `module.exports` cannot coexist with `import` statements; it must be `import withBundleAnalyzerFactory from "@next/bundle-analyzer"; const withBundleAnalyzer = withBundleAnalyzerFactory({ enabled: process.env.NEXT_BUNDLE_ANALYZER === "enabled" }); export default withBundleAnalyzer(nextConfig);` — or use dynamic `import()`.
  2. **`@next/bundle-analyzer` is incompatible with Turbopack.** Reading `node_modules/@next/bundle-analyzer/index.js`: it warns `"The Next Bundle Analyzer is not compatible with Turbopack builds, no report will be generated"` and **returns `nextConfig` unchanged**. `next.config.ts:62` declares `turbopack: {}`, so `bun run build` likely runs through Turbopack → analyzer silently no-ops. **G6.1** v9 must specify `--webpack` flag (per the package's own warning: "To run this analysis pass the `--webpack` flag to `next build`"), AND the codebase's build script (v9 must check `package.json` scripts — Turbopack is the default in their dev/build setup) needs an opt-in webpack lane.
- **G6.2** `package.json:185` confirms `@next/bundle-analyzer@^16.2.12` IS installed — but v9 should note this package's version is coupled to Next 16; verify matching `next` major.

### T7 — Zustand Selector Discipline (VALID)
- `adminComplaintsStore.ts:34` `create<AdminComplaintsState>(set => ({...}))` — **no immer, no persist**. Selectors return referentially-stable values unless mutated. ✓
- `useAdminComplaintsViewModel.ts:68-82` shows the per-field pattern verbatim:
  ```ts
  const searchQuery = useAdminComplaintsStore(state => state.searchQuery);
  const activeTab = useAdminComplaintsStore(state => state.activeTab);
  const setDraftResponse = useAdminComplaintsStore(state => state.setDraftResponse);
  ...
  ```
  and is explicitly contrasted with `// NEVER: const { designJson, isDirty, isSaving } = useEmailTemplateEditorStore();` — that "never" matches v9.
- **G7.1** v8 misses one detail: `draftResponses` is selected as a whole `Record` (line 70); any `setDraftResponse` mutates the entire map → causes ALL row draft components to re-render even if only one draft changed. v9 should add: "for collection-shaped state (e.g. `draftResponses`), prefer a keyed slice `useStore(s => s.draftResponses[rowId])` per row, NOT the whole collection." This is a perf leak `useAdminComplaintsViewModel` already has — don't repeat it in the editor.

### T8 — URL.revokeObjectURL Cleanup (VALID — cleanest sub-section)
- `useImageUpload.ts:163-188` shows the EXACT pattern v8 mirrors: `useObjectPreviewState` → `useRef<string|null>` → `URL.createObjectURL(file)` at line 183 → `URL.revokeObjectURL(...)` at line 169 → bare cleanup `useEffect(() => () => revokeObjectUrl(), [])` (note: v8's `useImageUpload.ts:169` citation is exact).
- v8's example merges editor `destroy()` into the same cleanup — sensible. **No gaps.** One nit: `useImageUpload.ts` keeps `objectUrlRef.current = null` after revoke (line 170); v9 should copy this nulling to prevent double-revoke. **G8.1 (minor)**: when an attachment has multiple Blob URLs (the question asks if the editor has multiple URLs): YES — the editor route has at minimum three Blob sources: attachments list (Q10), inline images, and inline-CID. v9 must extend the pattern to a `Map<id, string>` revoke-loop:
  ```ts
  useEffect(() => () => {
    for (const url of objectUrlMapRef.current.values()) URL.revokeObjectURL(url);
    objectUrlMapRef.current.clear();
    editorRef.current?.editor?.destroy();
  }, []);
  ```

### T9 — Apollo Cache Eviction (VALID)
- `useCreateManagerOnboarding.ts:35-36`:
  ```ts
  cache.evict({ id: "ROOT_QUERY", fieldName: "managerDirectory" });
  cache.gc();
  ```
- Pattern is exact and v8 copies it correctly. **G9.1**: For multi-arg root-field eviction (the email templates list is keyed on `scope, locale, status, search` per §Q1 line 969), Apollo's `cache.evict({ id: "ROOT_QUERY", fieldName: "emailTemplates" })` evicts ALL argument-keyed variants in one call — that's actually fine and simpler than per-args evict. Confirm in v9 (this is a documentation nicety, not a real gap).
- `cache.evict({ id: 'EmailTemplateVersions:' + id })` (line 1536) — correct string id form, but v9 should reuse the typePolicy name `EmailTemplateVersions` from §Q1 (which doesn't declare a typePolicy for versions — **this is actually a hole in §Q1**: history has `cache-first` (§Q2) but no `typePolicies` keyArgs for `EmailTemplateVersions`; evicting with `id:` works for objects with `id`, v9 must add a typePolicy for the versions type). **G9.2** Sec Q1 needs an `EmailTemplateVersions: { keyArgs: ["id"] }` entry.

### T10 — Render Timeout (INVALID)
- Verified `@react-email/render` (re-exported from `react-email` per `dist/index.d.mts:32`: `export * from "@react-email/render"`) — `render` signature is `declare const render: (node: React.ReactNode, options?: Options) => Promise<string>` where `Options = { pretty?: boolean; plainText?: false } | { plainText?: true; htmlToTextOptions?; unstableTextConversion? }`. **There is NO `AbortSignal` field, no `signal`, no timeout.**
- Therefore v8's "Add `Promise.race([render(…), timeout(5000)])`" is **correct and the only viable path**, but the v8 **spec heading mentions `AbortController`** — `(§)` spec line 1539) mentioning it as an alternative is misleading because there is no AbortSignal-bearing API to thread it through. v9 must: "Use ONLY `Promise.race`; **AbortController cannot be threaded into `react-email` `render()`** since v6 does not expose a `signal` option."
- The `safeRender` wrapper §M line 1275 returns `Promise<{ html, text }>`; S5 (line 1431-1436) extends to `{ html, text, degraded, error? }`. v8 line 1540 reuses the S5 signal — **but the timeout branch must return `RenderTimeoutError` typed as an `Error` subclass** so S5's `degraded: true` + `error` shape matches. **G10.1** v9 must declare `class RenderTimeoutError extends Error { readonly timeout: true }` to be discriminable from a thrown-component `Error` from S5's try/catch. Without it, two distinct error shapes collide inside one catch arm.
- **G10.2** A bare `Promise.race` does NOT cancel the underlying `render()` promise — React Email's render allocates DOMPurify + prettier + html-to-text which keep running after the 5s race resolves. v9 must (a) acknowledge the orphaned promise continues consuming memory/CPU until it resolves, OR (b) chose shorter render deadlines (5s is very long for an email render — typical email render is <100ms; 5000ms enables pathological hung renders). Recommend v9 tighten to 2000ms.

---

## 3. New Gaps Discovered During Validation (not in original audit)

1. **`frontend/views/` does not exist.** Every single line/path citation in v8 §T that reads `frontend/views/AdminComplaints/…` is wrong — actual paths are `frontend/common/stores/`, `frontend/common/views/dashboard/complaints/`, `frontend/common/hooks/…`. Round-3 audit trusted paths; v9 must re-verify ALL path citations in §T (T1 components, T2 debounce precedent, T7 store, T8 image-upload).

2. **React Compiler is OFF but v8 treats it as ON-ish.** `babel-plugin-react-compiler@1.0.0` installed ✓ but nowhere enabled in `next.config.ts` (no `reactCompiler: true`, no babel config). The §T1 caveat ("if Next.js propagates RC") is moot — it does NOT propagate. v9 must flip the default: manual memoization is MANDATORY until RC is enabled by an explicit v9 step.

3. **§Q — §T2 fetchPolicy contradiction.** §Q2 row 3 declares `PreviewEmailTemplateQueryDocument` → `network-only`; §T2 says switch to `cache-first`. Both shipped in v8 — they will collide at implementation. v9 must either (a) delete §Q2 row 3 and add a §Q amendment noting "T2 supersedes §Q2 preview row," OR (b) keep `network-only` and restate T2 as "add a separate cached read path for clean templates." Keeping both as-written is unimplementable.

4. **`isDirty` cannot be part of an Apollo cache key.** v8 T2 says "cache-first keyed on `(id, version, isDirty)`"; `isDirty` is a Zustand store boolean (T7 line 1518), never part of `variables`. Apollo cache keys are derived from `variables` (filtered by `keyArgs` of the typePolicy). §Q1 declares `EmailTemplate.keyArgs: ["id"]`. Even `version` is not in `keyArgs`. v9 must say: use `dirtyRef` and conditionally set `fetchPolicy`, do NOT pretend `isDirty` is a cache key.

5. **§R3 mobile "Show More" + virtualization interaction is unaddressed.** `frontend/common/views/dashboard/complaints/…` precedent uses Apollo pagination + array `.concat` merge (`typePolicies` §Q1). The "Show More → load 25" mobile path (R3, line 1095) implies appending rows indefinitely; with React.memo + virtualization (T1) unbounded growth will eventually OOM the DOM. v9 §T must specify whether the mobile "Show More" infinite-list has a virtualized window (`react-window` / `@tanstack/react-virtual`) or a row cap. **This gap is *newly* opened by T1+R3 combination.**

6. **`@react-email/editor` package has no `main`/`module`.** `node_modules/@react-email/editor/package.json` resolves `main`/`module` to **undefined** — the entry is framework-specific (use `@react-email/editor/uninitialized`). v8 T3's `experimental.optimizePackageImports` entry for `@react-email/editor` and any `next/dynamic(() => import('@react-email/editor'))` call may mis-resolve. v9 must cite the exact subpath.

7. **`optimizePackageImports` should NOT include `react-email`.** Adding `react-email` (19M, re-exports `@react-email/render`) to `experimental.optimizePackageImports` could double-bundle the render path. v9 should drop `react-email` from T3's list (keep `@react-email/editor` separately).

8. **§Q1 `EmailTemplateVersions` has no `typePolicies` entry.** Used by §Q2 (`cache-first`) and §T9 (`cache.evict({ id: 'EmailTemplateVersions:' + id })`). Without a `keyArgs: ["id"]` policy on `EmailTemplateVersions`, the cache stores it under the default heuristic. v9 must add the missing typePolicy to §Q1 (cascading gap surfaced by T9).

9. **T6 Turbopack incompatibility.** `@next/bundle-analyzer` no-ops (with only a console warning) under Turbopack; `next.config.ts:62` enables `turbopack: {}`. The `NEXT_BUNDLE_ANALYZER=enabled bun run build` (todo 20b) needs `next build --webpack` to actually produce a report. v9 must change todo 20b's command.

10. **Stale-data window opened by T2 `cache-first` on Preview.** When `isDirty:false` + `cache-first`, the preview shows the last-cached `compiledHtml` snapshot — but if a *different* user (or another tab on this user) edited the template, the version in DB has bumped and the stored preview is now outdated. The §Q1 `EmailTemplate.version` is the source of truth for staleness. v9 must add: "On preview mount, short-circuit `cache-first` to refresh-if-`version` differs: `nextFetchPolicy = (cachedVersion === dbVersion) ? 'cache-first' : 'network-only'`."

---

## 4. Top-5 Actionable Recommendations for v9

1. **Reconcile §Q2 vs §T2 fetchPolicy by deleting one.** Mark §Q2's `PreviewEmailTemplateQueryDocument → "network-only"` row as **SUPERSEDED BY §T2**, and rewrite §T2 to specify the *mechanic*, not the impossible "keyed on `(id,version,isDirty)`": `fetchPolicy={isDirtyRef.current ? 'network-only' : 'cache-first'}` plus a `version`-equality short-circuit. This single fix resolves the §Q↔§T cross-reference hole AND the `isDirty` cache-key impossibility (gaps 3, 4, and the §Q1 typePolicies mismatch).

2. **State React Compiler status as definitively OFF and make memoization mandatory.** Replace the §T1 caveat with: "React Compiler (`babel-plugin-react-compiler@1.0.0`) is installed but NOT enabled in `next.config.ts` — `experimental.reactCompiler` is absent and no `.babelrc`/`babel.config.*`/`.swcrc` exists. All `useMemo`/`useCallback`/`React.memo` in the editor route are therefore MANDATORY (not best-effort). Optional v9 step: enable `experimental.reactCompiler: true` and verify no manual memo is needed — but until then, treat memoization as required."

3. **Fix §T6 to ESM + Turbopack-safe path.** Replace the snippet with:
   ```ts
   import withBundleAnalyzerFactory from "@next/bundle-analyzer";
   // …after nextConfig:
   export default withBundleAnalyzerFactory({
     enabled: process.env.NEXT_BUNDLE_ANALYZER === "enabled",
   })(nextConfig);
   ```
   and update todo 20b to: `NEXT_BUNDLE_ANALYZER=enabled next build --webpack` (not plain `bun run build`) so the non-no-op Webpack lane runs. Document the Turbopack warning explicitly in §T6.

4. **Add the missing `EmailTemplateVersions` typePolicy in §Q1 AND drop `isDirty` from the §T2 cache-key narrative.** Specifically add to §Q1:
   ```ts
   EmailTemplateVersions: { keyArgs: ["id"] },
   ```
   and rewrite §T2 to use a Zustand `dirtyRef.current` flag + conditional `fetchPolicy`, never claiming `isDirty` is an Apollo cache key. Resolves §T9 eviction's `id:'EmailTemplateVersions:'+…` reliance on a typePolicy that §Q1 currently doesn't define.

5. **Specify `next/dynamic` vs bare `import()` per-dependency in §T3, and drop `react-email` from `optimizePackageImports`.** For non-component side-effect imports (Prism grammars), use `await import("prismjs/components/prism-$(lang)")`. For heavy component libraries (`recharts`, `framer-motion`, `react-color` only if actually used in-editor), use `next/dynamic(() => import(...), { ssr:false, loading:… })`. Specify exact `@react-email/editor/uninitialized` subpath for the editor entry. Remove `react-email` from the `experimental.optimizePackageImports` list to avoid double-bundling `@react-email/render`. Note `@dnd-kit/sortable` is only 404K — lazy-load it for *first-paint-budget* reasons, not bundle-size.

---

**Round 4 verdict:** The v8 §T is structurally sound but ships three implementability landmines (§Q2↔§T2 fetchPolicy conflict, `isDirty`-as-cache-key impossibility, tainted RC assumption), one impossible API (`AbortController` into `render()`), and recurring path inaccuracy (`frontend/views/` ≠ reality). T4 / T5 / T7 / T8 / T9 validate cleanly against the real codebase; T1 / T2 / T3 / T6 / T10 need v9 fixes before implementation.