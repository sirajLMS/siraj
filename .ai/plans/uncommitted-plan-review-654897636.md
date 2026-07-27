# Uncommitted Changes Review Plan

**Date**: 2026-07-27
**Scope**: Committed changes in range `730f8eea0b7e9bc52826b04a0fec55090b839e6d..HEAD` (2 commits, 21 files, +2213/-21220)
**Tracks**: security, performance, business-logic, deploy-safety, duplication, dead-code (full depth)
**Files Reviewed**: 21 changed files across backend migrations, drizzle migrations, db scripts, and frontend desktop/mobile schedule-overview refactor

## Summary

The range consolidates a Schedule Overview mobile/desktop card-list refactor and adds an idempotent migration transformer with rewritten permission/subject seed SQL. Three CRITICAL findings were identified: a default super-admin user seeded with a password hash plus plaintext comment committed into a Drizzle-tracked migration shipping to every environment; deletion of a drizzle snapshot.json that breaks the snapshot chain referenced by the next migration; and a silently-dropped `suggestions_deleted_at_idx` index in an in-place migration rewrite. Three WARNING findings concern non-atomic migration file rewriting by the new idempotency transformer and a relative-path dependency that silently disables it, plus intra-tier desktop duplication of a list-shell block. Performance, business-logic, and dead-code tracks are clean.

## Findings

### CRITICAL (3)
- [x] [CRITICAL] security: backend/drizzle/20260727152656_custom_23623615/migration.sql:2397-2411 — New Drizzle-tracked migration seeds a default super-admin user with a hardcoded bcrypt password hash AND its plaintext (`Seed_Pass1!`) as an inline SQL comment; the account is `is_super_admin=true`, ACTIVATED, and auto-assigned to the super_admin permission_group via the migration runner, so it ships to every environment (including prod) and is reachable by anyone who can read repo history or migrations; the plaintext comment leaks the credential in plain git log.
  → Fix: CONFIRMED (revised) — Remove the INSERT (and the plaintext SQL comment) from the Drizzle migration. Implement a post-deploy bootstrap path (NOT seeded into the migration):
    1. Read admin email + password from **environment variables** (e.g., `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`) — never hardcoded.
    2. Only seed the super-admin **when the `users` table has zero rows** (i.e., immediately after a fresh deploy). If any user exists, the bootstrap is a no-op.
    3. Assign the super_admin permission_group that's already created by the migrations (do NOT insert into `permissions`/`permission_groups`/`group_permissions` directly — forbidden in seeds layer).
    4. Use the `seedOrGet` idempotent pattern; `logger` (no `console.*`); error strings via `getServerTranslations(locale, "<namespace>")` from `@/shared/locale/server-graphql`.
    5. On first login with the env-seeded super-admin account, prompt the user (optional) to update both the email and the password, so the env credentials are not the long-term production credentials.
    6. Rotate the leaked password (`Seed_Pass1!`) — it's now in git history.
- [x] [CRITICAL] deploy-safety: backend/drizzle/20260725202529_combined_custom_logic/snapshot.json — snapshot.json DELETED in this range; its id `7047d8ee-4b5e-4946-81c2-94ccda95d4c6` is still referenced by `20260727051702_majestic_sentinel/snapshot.json` prevIds=["7047d8ee..."], breaking the drizzle snapshot chain — future `drizzle-kit generate` walks prevIds and will fail to resolve the predecessor.
  → Fix: CONFIRMED — Keep the deletion; edit `backend/drizzle/20260727051702_majestic_sentinel/snapshot.json` `prevIds` to point to the actual predecessor snapshot.json that still exists in the repo. Verify the prevIds chain walks end-to-end with `drizzle-kit generate` (or equivalent snapshot-chain walk).
- [x] [CRITICAL] deploy-safety: backend/db/migration/3-system_permissions_and_groups.sql:36 — In-place rewrite silently DROPPED `CREATE INDEX IF NOT EXISTS suggestions_deleted_at_idx ON suggestions (deleted_at);` (present in old file line 36, absent in new file); the index is also NOT present anywhere in the new `20260727152656_custom_23623615/migration.sql`, so on fresh deploys the `suggestions.deleted_at` index is never created (lost DDL, silent performance regression).
  → Fix: CONFIRMED — Re-add `CREATE INDEX IF NOT EXISTS suggestions_deleted_at_idx ON suggestions (deleted_at);` to `backend/db/migration/3-system_permissions_and_groups.sql`.

### WARNING (3)
- [x] [WARNING] deploy-safety: backend/db/scripts/ensureIdempotentMigrations.ts:94 — `writeFileSync(sqlPath, idempotentSql)` writes migration files non-atomically with no backup/staging and no temp-file rename; if the process crashes mid-loop, some `migration.sql` files are rewritten and others left original, leaving committed migrations in a half-rewritten inconsistent state on disk — and this runs on every `bun db migrate`, mutating committed SQL files at deploy time.
  → Fix: CONFIRMED — Write to a `.tmp` sibling then `fs.renameSync` (atomic on POSIX). Compare before/after to skip unchanged files. Keep `logger.log/error/warn` (no `console.*`), no new dependencies.
- [x] [WARNING] deploy-safety: backend/db/scripts/ensureIdempotentMigrations.ts:5 — `DRIZZLE_DIR = "./backend/drizzle"` is a relative path resolved against `process.cwd()`; if `bun db migrate` is invoked from a different working directory (CI step, Docker WORKDIR mismatch), `existsSync("./backend/drizzle")` returns false and the transformer silently no-ops, leaving idempotency fixes unapplied on that environment.
  → Fix: CONFIRMED — Resolve `DRIZZLE_DIR` against `import.meta.dir` (Bun) so the path is cwd-independent.
- [x] [WARNING] duplication: frontend/desktop/views/dashboard/admin/home/adminDashboard.desktop.tsx:105-148 — Desktop `adminDashboard.desktop.tsx` lines 105-148 (loading/empty/Stack.map/PaginationControls) and `scheduleOverview.desktop.tsx` lines 140-183 duplicate an identical ~44-line block with only minor `sx` differences; mobile tier avoids this by delegating to `MobileCardList` via `renderSkeleton`/`renderEmptyState`; recommend extracting a `DesktopCardList` primitive mirroring `MobileCardList` so both desktop views pass rendering slots instead of re-implementing the shell.
  → Fix: CONFIRMED — Extract a viewport-agnostic `ScheduleOverviewListShell` component (NOT `DesktopCardList`, which `frontend/desktop/AGENTS.md` forbids) into `frontend/common/views/dashboard/admin/home/components/ScheduleOverviewListShell.tsx`. Slot-prop shape mirroring `MobileCardList`: `rows`, `renderItem`, `getKey`, `loading`, `emptyMessage`, `renderSkeleton`, `renderEmptyState`, `paginationOptions` (typed via `ListPaginationOptions` from `@/frontend/common/components/ui/filter/listPaginationOptions`), `sx`. Both desktop views delegate via slot props. Follow MUI v9 sx rules (no style props on Stack/Box/Typography, theme palette only via `sx={(theme) => ({...})}`), use existing `PaginationControls` from `@/frontend/common/components/ui` (NOT MUI `Pagination`), no `useMediaQuery`/`useViewport`/`ViewportContext`, strings via ViewModel props (`t`, `emptyMessage`) — no new `useAppTranslation` calls inside the shell. Run per-file verification loop (tsgo → biome → lint-queue-client) on the NEW file BEFORE importing it elsewhere.

### SUGGESTION (2)
- [x] [SUGGESTION] deploy-safety: backend/drizzle/20260727152656_custom_23623615/migration.sql:1078,2752 — New custom migration contains destructive `DELETE FROM group_permissions WHERE group_id IN (...) AND permission_id IN (...)` statements with no row-count guard or WHERE-scope assertion; idempotent on re-run only because the DELETE becomes a no-op once rows are gone, but there is no rollback story if a future modified-delta re-runs against a table where permissions were reassigned.
  → Fix: CONFIRMED — Wrap each `DELETE FROM group_permissions WHERE group_id IN (...) AND permission_id IN (...)` in a PL/pgSQL DO block that uses `GET DIAGNOSTICS row_count; IF row_count != expected THEN RAISE EXCEPTION ...` to assert the expected row count. This provides rollback safety if a future re-run hits a table with reassigned permissions. Keep the SQL-only DO-block assertions (no logger/console in SQL).
- [x] [SUGGESTION] deploy-safety: backend/db/scripts/migrate.ts:37 — `ensureIdempotentMigrations()` is invoked UNGUARDED inside `runMigrations` (after `applyCustomMigrations`), mutating committed migration SQL files as a side effect of every migrate run; in-place rewriting of already-applied migrations is silently inert on existing DBs (drizzle keys `getMigrationsToRun` by folder name, not content hash) but the rewritten files are committed to git, creating a mismatch between what ran historically (pre-rewrite SQL) and what fresh deploys run (rewritten SQL).
  → Fix: CONFIRMED — Add a no-op short-circuit at the top of `ensureIdempotentMigrations()` so it returns immediately without rewriting when every `migration.sql` in `DRIZZLE_DIR` is already idempotent (e.g., header marker present and no statements need wrapping). Keep the invocation in `migrate.ts`. This makes the transformer idempotent by construction and stops mutating committed SQL on every run.

### Tracks with no findings
- performance: CLEAN — Schedule Overview refactor is presentation-only, bounded by server pagination (page size 10), no N+1, no new hooks/listeners/subscriptions, no cache invalidation changes, no unbounded rendering.
- business-logic: CLEAN — Drizzle outer transaction protects DO-block trigger disable/enable restructure; idempotency transformer correctly skips already-idempotent statements; UI status mapping delegates to existing `resolveScheduleInstanceDisplayStatus`; null/undefined student/teacher ids fall through to existing guards.
- dead-code: CLEAN — All new files (`scheduleOverviewCard.desktop.tsx`, `ensureIdempotentMigrations.ts`) and new exports (`ScheduleOverviewCardSkeleton`, `ScheduleOverviewEmptyState`, `renderSkeleton`/`renderEmptyState` props) are referenced by tier views or `migrate.ts`; the mobile card file was trimmed to a thin wrapper, reducing rather than adding dead code.

## Recommended Actions

1. **Remove the hardcoded super-admin seed from the Drizzle-tracked migration.** Replace it with a post-deploy bootstrap path (NOT a migration): read admin email + password from environment variables (`ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD`); only seed when the `users` table is empty (immediately after a fresh deploy); assign the existing `super_admin` permission group (don't touch `permissions`/`permission_groups`/`group_permissions` directly — forbidden in seeds layer); use `seedOrGet`, `logger`, `getServerTranslations`; on first login, prompt the env-seeded super-admin to optionally update both email and password. Rotate the leaked `Seed_Pass1!` (it's in git history).
2. **Restore the `20260725202529_combined_custom_logic/snapshot.json`** (or update `20260727051702_majestic_sentinel/snapshot.json` `prevIds` to point to the actual predecessor that still exists) so `drizzle-kit generate` can walk the snapshot chain.
3. **Re-add `CREATE INDEX IF NOT EXISTS suggestions_deleted_at_idx ON suggestions (deleted_at);`** to either `3-system_permissions_and_groups.sql` or the new custom migration so fresh deploys don't lose the index.
4. **Make `ensureIdempotentMigrations` atomic and cwd-independent:** write to a temp file then rename (atomic on POSIX); resolve `DRIZZLE_DIR` relative to a known anchor (e.g., `import.meta.dir`/`__dirname`) instead of `process.cwd()`; only rewrite files that actually changed (compare before writing).
5. **Extract a viewport-agnostic `ScheduleOverviewListShell`** into `frontend/common/views/dashboard/admin/home/components/` (NOT `DesktopCardList` — `frontend/desktop/AGENTS.md` forbids standalone `Desktop*`-prefixed primitives) so the two desktop schedule-overview views delegate the loading/empty/list/pagination shell via slot props (`renderSkeleton`/`renderEmptyState`/`renderItem`/`paginationOptions`) rather than duplicating it. Mirror `MobileCardList`'s slot-prop shape. See "Layer Compliance Notes" for full implementer guidance.
6. **Add row-count guards or assertions** around the destructive `DELETE FROM group_permissions` statements, or wrap them in a transaction-scoped DO block that asserts expected scope.
7. **Gate `ensureIdempotentMigrations()`** so it does not mutate committed migration SQL as a side effect of every migrate run (e.g., run it only in a dedicated `bun db ensure-idempotent` script, or make it idempotent-by-construction with a no-op short-circuit when files are already transformed).

## Layer Compliance Notes

Validated via `plan-review` skill against root `AGENTS.md` + layer-specific AGENTS.md files (`backend/db/seeds/AGENTS.md`, `backend/db/migration/`, `backend/drizzle/`, `backend/db/scripts/`, `backend/services/AGENTS.md`, `backend/graphql/AGENTS.md`, `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`, `frontend/views/AGENTS.md`).

### HARD VIOLATION — Recommended Action #5 (DesktopCardList primitive)

```
[FRONTEND/DESKTOP] frontend/desktop/components/ui/: no standalone Desktop*-prefixed primitives
  → Expected: frontend/desktop/AGENTS.md §§1, 3, 5 explicitly state "DesktopCardGrid does NOT
              exist — there are no standalone Desktop*-prefixed primitives" (only 3 tier-paired
              .desktop.* variants are allowed: DateNavigator, LocaleAdornmentSwitch, LocalizedStringDrawer).
              Shared cross-tier primitives live under frontend/common/components/ui/ or frontend/common/views/...
  → Plan has: "Extract a DesktopCardList primitive mirroring MobileCardList" — this name/shape
              directly contradicts the desktop module contract.
  → Required revision: Extract the loading/empty/list/PaginationControls shell into a
              VIEWPORT-AGNOSTIC component (no .mobile/.desktop suffix, no Desktop* prefix).
              Preferred home: frontend/common/views/dashboard/admin/home/components/ScheduleOverviewListShell.tsx
              (both desktop views already import shared skeletons/empty-state from there).
              Slot-prop shape mirroring MobileCardList: rows, renderItem, getKey, loading,
              emptyMessage, renderSkeleton, renderEmptyState, paginationOptions (typed via
              ListPaginationOptions from @/frontend/common/components/ui/filter/listPaginationOptions), sx.
```

### IMPLEMENTER GUIDANCE for the frontend duplication fix

- Do NOT create `DesktopCardList` (hard AGENTS.md violation).
- New shared component lives at `frontend/common/views/dashboard/admin/home/components/ScheduleOverviewListShell.tsx`.
- Use `PaginationControls` from `@/frontend/common/components/ui` (already in use — NOT MUI `Pagination`).
- MUI v9: all wrapper styles via `sx` prop only — NO style props on Stack/Box/Typography (no `spacing`, `gap`, `alignItems`, `fontWeight`, `mb`, etc. as direct props).
- Theme: no hardcoded colors — use `sx={(theme) => ({...})}` with `theme.palette.onSurface`/`onSurfaceVariant`.
- Strings via ViewModel props (`t`, `emptyMessage`) — do NOT introduce new `useAppTranslation` calls inside the shell.
- Import aliases only (`@/frontend/...`, `@/shared/...`) — never relative across layers, never `@/backend/**`.
- No `useMediaQuery`, `useViewport`, `ViewportContext` imports.
- Run per-file verification loop (tsgo → biome → lint-queue-client) on the new file BEFORE importing it elsewhere.

### CROSS-FILE DEPENDENCY (orchestrator-coordinated)

Action #2 (snapshot.json restore) likely requires editing `backend/drizzle/20260727051702_majestic_sentinel/snapshot.json` `prevIds` IN ADDITION TO restoring the deleted `20260725202529_combined_custom_logic/snapshot.json`. A subagent fixing one snapshot file must NOT silently edit the other — report as `CROSS-FILE DEPENDENCY` so the orchestrator coordinates both edits as one atomic operation. Verify with `drizzle-kit generate` (or equivalent snapshot-chain walk) after the fix.

### Other layers — NO VIOLATIONS

- `backend/db/seeds/` (Action #1): seeders import from `@/backend/services/**` (NOT `@/backend/db/**`, no schema/repo/drizzleDb/migrations imports). Must use `seedOrGet` idempotent pattern. Must use `logger` from `@/backend/lib/logger` (no `console.*`). Error strings via `getServerTranslations(locale, "<namespace>")` from `@/shared/locale/server-graphql` (NOT deprecated `getBackendTranslations`). Must NOT insert/update `permissions`/`permission_groups`/`group_permissions` directly (FORBIDDEN per seeds AGENTS.md — those are owned by `backend/db/migration/` SQL). NODE_ENV gating is consistent with the seeds layer's stated purpose.
- `backend/db/migration/` + `backend/drizzle/` (Actions #2, #3, #6): restoring snapshot.json, re-adding the `suggestions_deleted_at_idx` index, and wrapping `DELETE FROM group_permissions` in DO-block assertions all target the migration-owned SQL surface — correct layer. Keep DO-block assertions as SQL only (no logger/console in SQL).
- `backend/db/scripts/` (Actions #4, #7): must keep using `logger.log/error/warn` (already in use — no `console.*`). `import.meta.dir` (Bun) is the correct cwd-independent anchor. `fs.renameSync` after writing to a `.tmp` sibling is pure-stdlib (no new deps). The new package.json script entry for gating (e.g., `bun db ensure-idempotent`) must NOT reintroduce `reset`/`cleanGenerate` terms (repo policy forbids those).

## Fix Status

- Total findings: 8
- Fixed: 0 / 8
- Remaining: 8
