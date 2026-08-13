# Backend Services Barrel Refactor — `export *` with `./` paths

## Goal

Refactor all `index.ts` barrels across `backend/services/` to use `export *` with `./` relative paths (no `@/`, no `../`, max one `/` per path), create missing barrels, build out the root barrel, and convert all non-service files to import from `@/backend/services` (shortest path) instead of long `@/backend/services/<dir>/<file>` paths.

## Context & Current State (verified 2026-08-12)

- **ESLint blocker is RESOLVED**: `eslint.config.mjs:332-338` exempts `**/index.ts` from `no-restricted-syntax` (the rule banning `./`/`../` imports). Barrels can freely use `./` paths.
- **No ESLint rule enforces shortest-path imports** — the `@/backend/services`-only convention is a documented guideline in AGENTS.md, not lint-enforced. Converting 239 files is a convention-compliance task, not a lint-fix task.
- **Root barrel** (`backend/services/index.ts`) only exports `./supervisor` — effectively unusable. Zero non-service files currently import from `@/backend/services` (shortest path); all 239 use long paths across 135 unique specifiers.
- **34 service subdirs** exist; 24 have barrels, 10 are missing barrels.
- **No export name collisions** across existing top-level barrels (verified programmatically).
- **One collision** found when including missing-barrel dirs: `CacheStats` exported by both `cache/EntityCacheService.ts` and `shared/CacheInterface.ts` — identical shape, duplicate definition.

## Decisions

1. **`export *` exclusively** in barrels; named `export { }` only for collision disambiguation (none expected after fixing `CacheStats`).
2. **`./` paths only** in barrels — no `@/`, no `../`, max one `/` per `export *` path.
3. **Rename functions in source files** rather than aliasing in barrels (already done for whatsapp cloud-api requests).
4. **NOT barrelized** (internal/lazy-loaded):
   - Meeting channel adapter subdirs: `meeting/channels/zoom/`, `google-meet/`, `microsoft-teams/` (lazy-loaded via `MeetingChannelFactory`)
   - `cron/queue-adapters/` (lazy-loaded via `queue-adapter.factory.ts`)
   - `communication/templates/` (dead code)
   - All `__shared__/` subdirs (internal implementation details)
   - All `test/` subdirs (test-only)
   - `meeting/utils/` (no external consumers)
5. **`seed/` IS included** in root barrel — imported by `backend/db/seeds/` and `system/test-helper.service.ts`.
6. **`CacheStats` collision fix**: delete the duplicate `export interface CacheStats` from `cache/EntityCacheService.ts:41-45` (unused internally; `getEntityCacheStats` returns a different shape). Consumers get `CacheStats` from `shared/CacheInterface` via the root barrel.
7. **`fx/index.ts` fix**: replace `export * from "./providers/FxRateProviderFactory"` (2 `/`s) with `export * from "./providers"` (uses nested barrel).
8. **`fx/providers/index.ts` fix**: replace `export type { IFxRateProvider } from "./IFxRateProvider"` with `export * from "./IFxRateProvider"`.
9. **`cache/index.ts` fix**: replace `export type { CacheProvider, ICacheService } from "./ICacheService"` with `export * from "./ICacheService"`.
10. **Channel barrels** (`email/`, `push/`, `sms/`): convert `@/`-aliased named type re-exports to `export *` with `./` paths.
11. **`communication/channels/index.ts`**: add `export * from "./email"`, `"./push"`, `"./sms"` to surface adapter interfaces/factories.
12. **`meeting/index.ts`**: add `export * from "./channels"` and `"./integrations"`.
13. **`meeting/channels/index.ts`** (new): `export * from "./IMeetingChannel"` + `"./MeetingChannelFactory"` only (NOT adapter subdirs).
14. **`meeting/integrations/`** has no subdir — barrel exports the 3 service files directly.
15. **Internal service files** (files within `backend/services/`) keep their existing long-path `@/` imports to prevent circular deps — only non-service files are converted to shortest-path.

## Tasks

### Phase 1: Fix existing barrels (no new files)

1. **`backend/services/communication/channels/email/index.ts`** — convert to:
   ```ts
   export * from "./EmailChannelFactory";
   export * from "./IEmailChannel";
   ```
2. **`backend/services/communication/channels/push/index.ts`** — convert to:
   ```ts
   export * from "./IPushChannel";
   export * from "./PushChannelFactory";
   ```
3. **`backend/services/communication/channels/sms/index.ts`** — convert to:
   ```ts
   export * from "./ISmsChannel";
   export * from "./SmsChannelFactory";
   ```
4. **`backend/services/communication/channels/index.ts`** — add:
   ```ts
   export * from "./email";
   export * from "./push";
   export * from "./sms";
   ```
   (keep existing `email.channel`, `on-app.channel`, `whatsapp` exports)
5. **`backend/services/fx/providers/index.ts`** — convert `export type { IFxRateProvider }` to `export * from "./IFxRateProvider"`.
6. **`backend/services/fx/index.ts`** — replace `export * from "./providers/FxRateProviderFactory"` with `export * from "./providers"`.
7. **`backend/services/cache/index.ts`** — convert `export type { CacheProvider, ICacheService }` to `export * from "./ICacheService"`.
8. **`backend/services/meeting/index.ts`** — add `export * from "./channels";` and `export * from "./integrations";`.

### Phase 2: Fix `CacheStats` collision

9. **`backend/services/cache/EntityCacheService.ts`** — delete the duplicate `export interface CacheStats` block (lines 41-45). Verify no internal usage (confirmed: only `getEntityCacheStats` function exists, returns different shape). Consumers will get `CacheStats` from `shared/CacheInterface` via root barrel.

### Phase 3: Create 11 missing barrels

10. **`backend/services/meeting/channels/index.ts`** (new):
    ```ts
    export * from "./IMeetingChannel";
    export * from "./MeetingChannelFactory";
    ```
11. **`backend/services/group-class/index.ts`** (new): `export * from "./group-class.service";`
12. **`backend/services/history/index.ts`** (new): `export * from "./student-history.service";`
13. **`backend/services/performance/index.ts`** (new): `export * from "./class-performance.service";`
14. **`backend/services/resource/index.ts`** (new):
    ```ts
    export * from "./book.service";
    export * from "./learning-resource.service";
    ```
15. **`backend/services/schedule/index.ts`** (new):
    ```ts
    export * from "./availability-search.service";
    export * from "./recurring-class.service";
    export * from "./recurring-schedule-detail.service";
    export * from "./resolve-viewer-timezone";
    export * from "./schedule-deletion.service";
    export * from "./schedule-query.service";
    export * from "./schedule.service";
    export * from "./weekly-schedule.service";
    ```
    (NOT `__shared__/` — internal)
16. **`backend/services/scheduling/index.ts`** (new):
    ```ts
    export * from "./availability.service";
    export * from "./state-change-validation.service";
    ```
17. **`backend/services/session/index.ts`** (new):
    ```ts
    export * from "./class-instance-expiry.service";
    export * from "./class-session.service";
    ```
18. **`backend/services/shared/index.ts`** (new):
    ```ts
    export * from "./CacheInterface";
    export * from "./is-duplicate-error";
    ```
19. **`backend/services/subject/index.ts`** (new):
    ```ts
    export * from "./class-category.service";
    export * from "./class-subject.service";
    export * from "./teacher-notes.service";
    ```
20. **`backend/services/users/index.ts`** (new): `export * from "./session-config.service";`

### Phase 4: Build root barrel

21. **`backend/services/index.ts`** — rewrite to `export *` from all 34 service subdirs with `./` paths:
    ```ts
    export * from "./auth";
    export * from "./billing";
    export * from "./cache";
    export * from "./classes";
    export * from "./communication";
    export * from "./cron";
    export * from "./fx";
    export * from "./group-class";
    export * from "./history";
    export * from "./meeting";
    export * from "./notification";
    export * from "./parent";
    export * from "./payment-method";
    export * from "./performance";
    export * from "./pricing";
    export * from "./profile";
    export * from "./redis";
    export * from "./report";
    export * from "./resource";
    export * from "./schedule";
    export * from "./scheduling";
    export * from "./seed";
    export * from "./session";
    export * from "./shared";
    export * from "./staff";
    export * from "./storage";
    export * from "./student";
    export * from "./subject";
    export * from "./supervisor";
    export * from "./system";
    export * from "./teacher";
    export * from "./user";
    export * from "./users";
    export * from "./whatsapp";
    ```
    - Run tsgo after this step to catch any collisions before proceeding to Phase 5.

### Phase 5: Convert non-service imports to shortest path

22. **Convert 239 non-service files** from long `@/backend/services/<dir>/<file>` imports to `@/backend/services`. Use `fix-import-aliases` skill or parallel subagents. Scope:
    - All files in `app/`, `backend/graphql/`, `backend/db/`, `backend/types/`, `backend/lib/`, `backend/enum/`, `frontend/`, `test/`, `scripts/` that import from `@/backend/services/...`
    - **EXCLUDE** files within `backend/services/` itself (internal cross-service imports keep long paths to prevent circular deps)
    - **EXCLUDE** dynamic `import()` calls (factory lazy-loading patterns)
    - **EXCLUDE** GraphQL mutation/query layer type-registration imports
    - Map each long path to its shortest equivalent by removing the subpath (the root barrel now aggregates everything)
    - Special case: `@/backend/services/cache` (already shortest for `cache` barrel) — verify these 6 files are correct as-is

### Phase 6: Validation

23. **`bun tsgo`** — full type check (catches collisions, missing exports, circular dep issues)
24. **`bun run lint`** — ESLint (catches `no-restricted-syntax` violations, import/export issues)
25. **`bun lint:type-aware`** — type-aware ESLint (sonarjs rules)
26. **`bun run oxlint`** — oxlint (catches unsafe assertions, etc.)
27. **`bun run test:services`** — service tests (parallel)
28. **`bun run test:db`** — database repository tests (parallel)
29. **`bun run test:graphql`** — GraphQL integration tests
30. **`bun quality-gate`** — full quality gate (tsgo → oxlint → biome → lint → codescene)

## Risks & Mitigations

- **Circular dependencies**: Root barrel aggregates all 34 dirs. Bidirectional cross-service imports (auth↔communication, auth↔parent, auth↔system, auth↔teacher, cache↔redis, communication↔notification) already exist at file level — the root barrel doesn't create new circularity, but may surface it. **Mitigation**: run `bun tsgo` immediately after Phase 4 (root barrel) before Phase 5. If circular deps surface, the affected files keep long-path imports (excluded from conversion).
- **Export collisions**: Verified no collisions across existing barrels + missing-barrel dirs, except `CacheStats` (fixed in Phase 2). **Mitigation**: tsgo after Phase 4 catches any missed collisions before mass conversion.
- **Dynamic `import()` calls**: Converting these to barrel imports would break lazy-loading. **Mitigation**: explicitly exclude `import()` calls from Phase 5; the `fix-import-aliases` skill handles static imports only.
- **239-file conversion**: Large surface area. **Mitigation**: use parallel subagents (one per file or small batch) via `fix-import-aliases` skill; verify with tsgo + lint after.
- **`CacheStats` deletion**: Verified safe. Internal consumers (`cache/__shared__/CacheAdapterBase.ts`, `redis/BaseRedisAdapter.ts`) already import `CacheStats` from `@/backend/services/shared/CacheInterface` (canonical source), NOT from `cache/EntityCacheService`. The duplicate in `EntityCacheService.ts` is dead code. No external (non-service) consumers import `CacheStats` at all. After root barrel aggregates `shared`, `CacheStats` is available from `@/backend/services`.

## Open Questions

None — all decisions resolved. The plan is implementation-ready.

## Relevant Files

- `backend/services/index.ts` — root barrel (rewrite in Phase 4)
- `backend/services/cache/EntityCacheService.ts` — delete duplicate `CacheStats` (Phase 2)
- `backend/services/cache/index.ts` — convert named type re-export (Phase 1)
- `backend/services/communication/channels/{email,push,sms}/index.ts` — convert `@/` to `./` (Phase 1)
- `backend/services/communication/channels/index.ts` — add email/push/sms (Phase 1)
- `backend/services/fx/index.ts` — fix nested barrel path (Phase 1)
- `backend/services/fx/providers/index.ts` — convert named type re-export (Phase 1)
- `backend/services/meeting/index.ts` — add channels + integrations (Phase 1)
- 11 new barrel files (Phase 3)
- 239 non-service files (Phase 5 conversion)
- `eslint.config.mjs:332-338` — `**/index.ts` exemption (already in place, no changes needed)
