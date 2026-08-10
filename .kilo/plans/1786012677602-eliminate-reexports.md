# Plan: Eliminate Re-exports and Fix Import Errors

## Context

`bun lint:type-aware` reports 400 problems (190 errors, 210 warnings). This plan targets **only the `import-x/export` errors** (re-export conflicts) and the one **`import-x/no-duplicates`** error. All fixes remove ambiguous re-exports so each name has a single canonical export source.

Out of scope: `import-x/no-named-as-default` warnings (logger default import pattern — separate decision), SonarJS rule violations (separate quality-gate task), TS project-service parsing errors for config files (tsconfig change).

## Core Pattern

All conflicts share the same root cause: a file re-exports a name from another module while the owning module is also exported through the same barrel. The fix is always one of:
1. **Remove the explicit re-export** from the non-canonical file (keep the owning module's `export *`).
2. **Remove the `export *`** that pulls in the owning module (keep the explicit re-export).
3. **Convert to side-effect import** (`import "./x";`) when the module has no named exports.

## Enforcement (per-file, every step)

After each file edit, verify that file before moving on:

```bash
bun run scripts/lint-service.ts --type-aware -f <changed-file> --id reexport-<taskN>
```

The `--type-aware` flag runs tsgo-equivalent import resolution. Exit code 0 = clean. Fix all reported errors on that file before proceeding. Between tasks, run `bun tsgo` to confirm no broken imports propagated.

## Tasks (ordered by dependency: leaves first)

### Task 1: backend/db barrel — `relations`, HTTP client fns

**Files:** `backend/db/index.ts` (edit), `backend/db/drizzleDb.ts` (small edit), `backend/db/gqlSchemaBuilder.ts` consumer (edit if needed)

**Evidence:**
- `backend/db/drizzleDb.ts:96-98` explicitly re-exports `getActiveHttpProvider`, `isNeonHttpEligible` (from `connection-strategy`), `clearHttpClientSingleton`, `getNeonHttpClient`, `getNeonHttpDb` (from `http-client`), and `relations` (from `drizzleRelations`).
- `drizzleDb.ts:100` uses `typeof relations` for the `DrizzleRelations` type — so `relations` MUST remain importable from `drizzleDb` OR the type must be rewritten.
- Consumers confirmed: `backend/db/test/http-client.test.ts:2` imports `getNeonHttpClient`, `getNeonHttpDb` from `@/backend/db`; `backend/graphql/gqlSchemaBuilder.ts:13` imports `relations` from `@/backend/db/drizzleDb`.
- `backend/db/index.ts:2` (`export * from "@/backend/db/drizzleDb"`) + line 3 (`export * from "@/backend/db/drizzleRelations"`) → duplicate `relations`. Lines 2 + 5 (`export * from "@/backend/db/http-client"`) → duplicate HTTP client fns.

**Action (chose barrel-only change to preserve all consumer import paths):**
1. **In `backend/db/index.ts`**: split the `export *` so each name comes from exactly one source:
   - Keep `export * from "@/backend/db/drizzleDb"` (it owns `db`, `queryDb`, `clearDbConnectionSingleton`, `getDrizzleDbPool`, etc. AND intentionally re-exports `relations` + HTTP client fns for legacy convenience).
   - Change line 3 to **named** re-export of non-conflicting exports from `drizzleRelations` (only `relations` lives there, so drop the line entirely — `drizzleDb` already re-exports `relations`).
   - Change line 5 to named re-export of non-conflicting exports from `http-client` — but `http-client.ts` ONLY exports `getNeonHttpClient`, `getNeonHttpDb`, `clearHttpClientSingleton`, all of which `drizzleDb` already re-exports. Drop the `export * from "@/backend/db/http-client"` line entirely.
2. **In `backend/db/drizzleDb.ts`**: leave lines 96-98 intact (they're the convenience re-exports the consumers rely on). Line 100 `DrizzleRelations` stays valid.
3. **No consumer edits**: `gqlSchemaBuilder.ts` still gets `relations` from `drizzleDb`; `http-client.test.ts` gets HTTP fns from `@/backend/db` via `drizzleDb`'s re-export.

Result: each conflicting name has ONE path — `drizzleDb`'s explicit re-export — and the barrel no longer independently `export *`s the duplicate sources.

**Verify:**
```bash
bun tsgo  # drizzleDb internal usages + consumers still resolve
bun run scripts/lint-service.ts --type-aware -f backend/db/index.ts --id reexport-1
bun run scripts/lint-service.ts --type-aware -f backend/db/drizzleDb.ts --id reexport-1
```

**AGENTS.md rule:** `backend/AGENTS.md` — `queryDb(tx)` from `@/backend/db` canonical DB handle; preserving the barrel's public surface avoids breaking repository consumers that import DB helpers via the barrel.

---

### Task 2: backend/storage — `StorageService` type

**Files:** `backend/storage/storage.service.ts` (edit), `backend/storage/storage.service.interface.ts` (no edit)

**Evidence:**
- `storage.service.ts:113` does `export * from "@/backend/storage/disk/storage.service.interface"` (which defines `StorageService`).
- `storage.service.ts:116` ALSO does `export type { StorageService };` — duplicate of the same name.
- `backend/storage/index.ts:1` adds a THIRD path: `export type { StorageService } from ".../storage.service.interface"`.

**Action:**
1. Remove line 116 from `storage.service.ts` (`export type { StorageService };`).
2. Remove lines 1 from `backend/storage/index.ts` (`export type { StorageService } from "...interface"`); keep line 2 `export * from "...interface"`.

**Verify:**
```bash
bun run scripts/lint-service.ts --type-aware -f backend/storage/storage.service.ts --id reexport-2
bun run scripts/lint-service.ts --type-aware -f backend/storage/index.ts --id reexport-2
```

**AGENTS.md rule:** `backend/types/AGENTS.md` — single canonical type definition per entity; the interface file is canonical.

---

### Task 3: backend/types barrel — `SessionConfig*`, `TeacherOwnProfileUpdateInput`

**Files:** `backend/types/users/session-config.types.ts` (edit), `backend/types/profile/profile.types.ts` (edit)

**Evidence (confirmed):**
- `TeachersOwnProfileUpdateInput` is **defined** in `backend/types/teachers/teacher.types.ts:179`.
- `backend/types/profile/profile.types.ts:22` explicitly re-exports it: `export type { ..., TeacherOwnProfileUpdateInput };` → conflicts with `backend/types/index.ts:20` which also does `export * from "./teachers"`. Lint flags lines 12 & 20.
- `SessionConfigSelectType` / `SessionConfigInsertType` are **defined** in `backend/types/auth/auth.types.ts` (auth owns `session_config` table per `auth.types.ts:6` comment).
- `backend/types/users/session-config.types.ts:11` re-exports them: `export type { SessionConfigInsertType, SessionConfigSelectType } from "@/backend/types/auth/auth.types";` → conflicts with `backend/types/index.ts:2` (`export * from "./auth"`) AND `export * from "./users"` (line 21). Lint flags lines 2 and 21.

**Action:**
1. In `session-config.types.ts`: remove line 11 (the `export type { ... }` re-export). Keep `SessionConfigUpsertInput` (the new type this file owns). Consumers of `SessionConfigSelectType`/`SessionConfigInsertType` get them from the auth domain via the barrel — already the canonical path.
2. In `profile.types.ts`: remove `TeacherOwnProfileUpdateInput` from line 22's re-export list, keeping `ProfileAudience, ProfileMode, ProfileScope` if they are enum re-exports (verify each is defined in `@/backend/enum`, not in profile). Profile package should NOT re-export teacher-owned types.

**Verify (check no consumer imported these from the wrong barrel path):**
```bash
# Confirm no code imports via the non-canonical paths:
rg "SessionConfigSelectType" backend/ --type ts -l   # all should resolve via auth
rg "TeacherOwnProfileUpdateInput" backend/ --type ts -l
bun tsgo
bun run scripts/lint-service.ts --type-aware -f backend/types/users/session-config.types.ts --id reexport-3
bun run scripts/lint-service.ts --type-aware -f backend/types/profile/profile.types.ts --id reexport-3
bun run scripts/lint-service.ts --type-aware -f backend/types/index.ts --id reexport-3
```

**AGENTS.md rule:** `backend/types/AGENTS.md` — single canonical type per entity; define once in the owning domain, no cross-domain re-exports.

---

### Task 4: backend/graphql/pothos/auth — `UserPothosObject`

**Files:** `backend/graphql/pothos/auth/auth.pothos.ts` (edit)

**Evidence (confirmed):**
- `UserPothosObject` is **defined** in `backend/graphql/pothos/users/user.pothos.ts:15`.
- `backend/graphql/pothos/auth/auth.pothos.ts:2` imports it: `import { UserPothosObject } from "@/backend/graphql/pothos/users";` and line 11 explicitly re-exports it: `export { UserPothosObject };`.
- `backend/graphql/pothos/index.ts:7` (`export * from "./auth"`) + line 26 (`export * from "./users"`) → duplicate at the root.

**Action:** Remove line 11 (`export { UserPothosObject };`) from `auth.pothos.ts`. The import (line 2) stays since it's used by the `user` fields (lines 48-65 referenced in the audit). Only the re-export is removed.

**Verify:**
```bash
# Confirm no auth consumer imported UserPothosObject *from* auth barrel:
rg "UserPothosObject" backend/graphql/pothos/auth/ --type ts
bun tsgo
bun run scripts/lint-service.ts --type-aware -f backend/graphql/pothos/auth/auth.pothos.ts --id reexport-4
bun run scripts/lint-service.ts --type-aware -f backend/graphql/pothos/index.ts --id reexport-4
```

**AGENTS.md rule:** `backend/graphql/pothos/AGENTS.md` — single canonical object type per entity; `users` owns `UserPothosObject`.

---

### Task 5: backend/graphql/pothos/permissions barrel

**Files:** `backend/graphql/pothos/permissions/permission-group-simulation.objects.pothos.ts` (no edit), `backend/graphql/pothos/permissions/index.ts` (edit)

**Evidence (confirmed):**
- `permission-group-simulation.objects.pothos.ts` **defines** all 4 object refs (`SimulatablePermissionGroupPothosObject`, `PermissionGroupSimulationStatusPothosObject`, `StartPermissionGroupSimulationResponsePothosObject`, `EndPermissionGroupSimulationResponsePothosObject`).
- `permission-group-simulation.pothos.ts` defines NONE (0 `export const`).
- `permissions/index.ts:1` does `export * from "./permission-group-simulation.objects.pothos"` + line 2 does `export * from "./permission-group-simulation.pothos"`. The lint flags BOTH lines for each of the 4 names — meaning the simulation file re-exports the same names from the objects file.

**Action:** Inspect `permission-group-simulation.pothos.ts` for an `export { ... }` or `export * from "./permission-group-simulation.objects.pothos"` line. Remove that re-export (the file likely imports and re-exports to keep mutations next to objects). If `permission-group-simulation.pothos.ts` only imports for local use, the conflict resolves by leaving barrel line 1 only (remove line 2's `export *` if it has no own exports to expose). Decide by reading the file first.

**Verify:**
```bash
bun tsgo
bun run scripts/lint-service.ts --type-aware -f backend/graphql/pothos/permissions/index.ts --id reexport-5
bun run scripts/lint-service.ts --type-aware -f backend/graphql/pothos/permissions/permission-group-simulation.pothos.ts --id reexport-5
```

**AGENTS.md rule:** `backend/graphql/pothos/AGENTS.md` — single canonical object per entity; objects file owns the refs.

---

### Task 6: backend/graphql/pothos/cron — empty barrel

**Files:** `backend/graphql/pothos/cron/index.ts` (edit)

**Evidence (confirmed):**
- `cron.pothos.ts` has **zero** `export` statements (only side-effect `gqlSchemaBuilder.queryField(...)` / `.mutationField(...)` registrations at module top level). Confirmed by reading the file — no `const X = ...; export X;` exports.
- `cron/index.ts:1` does `export * from "./cron.pothos";` → lint error "No named exports found in module './cron.pothos'".
- `backend/graphql/pothos/index.ts:12` re-exports cron barrel → cascades the error.

**Action:** Replace `cron/index.ts` content with a side-effect import:
```typescript
// Side-effect import: registers Cron query/mutation fields with gqlSchemaBuilder.
import "./cron.pothos";
```

**Verify:**
```bash
bun tsgo
bun run scripts/lint-service.ts --type-aware -f backend/graphql/pothos/cron/index.ts --id reexport-6
bun run scripts/lint-service.ts --type-aware -f backend/graphql/pothos/index.ts --id reexport-6
```

**AGENTS.md rule:** `backend/graphql/pothos/AGENTS.md` — side-effect barrel imports are an established Pothos registration pattern.

---

### Task 7: frontend/common_components/ui barrel — 20+ duplicate UI exports

**Files:** `frontend/common/components/ui/index.ts` (edit), `frontend/common/components/ui/container/index.ts` (edit)

**Evidence:** Two layers of duplicate paths:
- Root `ui/index.ts` mixes `export *` (exposing submodule components) with explicit re-exports of those same components (e.g. line 1 `export * from "./badge"` + line 2 `export { StatusBadge }`).
- `container/index.ts:1` ALSO re-exports `ExportButton, FilterButton, PrimaryPageAction` from `button/ActionButtons` — so those 3 names reach the root via 3 paths: `./button` (root line 3), `./container` (root line 7) → `container` line 1, and root explicit line 4. Lint flags all.

Duplicate names flagged: `StatusBadge`, `ExportButton`, `FilterButton`, `PrimaryPageAction`, `ActionIconLink`, `HorizontalScrollRow`, `SectionPanel`, `MeetingJoinAction`, `PersonProfileLink`, `PersonProfileLinkCell`, `TimezoneDisplay`, `DateNavigator`, `ListPaginationOptions`, `buildServerPaginationOptions`, `PaginationControls`, `FormErrorSnackbar`, `FormSuccessSnackbar`.

**Action:**
1. **In `frontend/common/components/ui/container/index.ts`**: remove line 1 (`export { ExportButton, FilterButton, PrimaryPageAction } from ".../button/ActionButtons"`) — it wrongly leaks button exports into the container barrel. Button components belong to the `./button` barrel only.
2. **In `frontend/common/components/ui/index.ts`**: keep the `export * from "./<subdir>"` lines (1, 3, 6, 7, 13, 18, 23, 26, 27, 28) and REMOVE the redundant explicit re-export lines (2, 4, 5, 8, 9, 14, 15, 16, 17, 19, 20, 21, 22, 24, 25). Each removed name is still provided by the corresponding sub-barrel's `export *`.
3. Preserve `filter/listPaginationOptions` exports — re-check `filter/index.ts` to confirm it re-exports `buildServerPaginationOptions` and `ListPaginationOptions`. The `filter/index.ts` read earlier shows it re-exports `DateNavigator`, `listPaginationOptions`, `PaginationControls`, `getServerPaginationOptions`, `isServerPagination` — but NOT `buildServerPaginationOptions`. So keep root line 21 `export { buildServerPaginationOptions } from "./filter/listPaginationOptions"` as the single path (remove root line 19 `export { DateNavigator }` — covered by `./filter`; remove line 22 `export { PaginationControls }` — covered by `./filter`; keep line 20 `export type { ListPaginationOptions }` only if `filter/index.ts` doesn't export the type — it DOES via `./listPaginationOptions`, so remove line 20 too).
4. DataGrid exports (lines 10-12) have no sub-barrel → keep as-is.

**Final verified barrel for `ui/index.ts`:**
```typescript
export * from "./badge";
export * from "./button";
export * from "./card";
export * from "./container";
export * from "./display";
export * from "./filter";
export * from "./form";
export * from "./input";
export * from "./state";
export * from "./story/StoryBookPageContainer";
export { AppDataGrid, type AppDataGridProps } from "./dataGrid/AppDataGrid";
export { AppDataGridLoadingOverlay } from "./dataGrid/AppDataGridLoadingOverlay";
export { AppDataGridNoRowsOverlay } from "./dataGrid/AppDataGridNoRowsOverlay";
export { buildServerPaginationOptions } from "./filter/listPaginationOptions";
```
Verify `buildServerPaginationOptions` is exported via `filter/index.ts` — if yes after auditing, drop this last explicit line too. If `ListPaginationOptions` type isn't in `filter/index.ts`, add a single `export type { ListPaginationOptions } from "./filter/listPaginationOptions"`.

**Verify:**
```bash
bun tsgo  # catches any broken consumer import (94 consumers)
bun run scripts/lint-service.ts --type-aware -f frontend/common/components/ui/container/index.ts --id reexport-7
bun run scripts/lint-service.ts --type-aware -f frontend/common/components/ui/index.ts --id reexport-7
```

**AGENTS.md rule:** `frontend/common/components/ui/AGENTS.md` — named exports only from `index.ts` barrels; never re-export `Mobile*`/`Desktop*`; sub-barrels own their domain components (button components come from `./button`, not `./container`).

---

### Task 8: frontend/common/views classes/details — duplicate `ActionFeedbackState` definition

**Files:** `frontend/common/views/dashboard/classes/details/types.ts` (edit)

**Evidence:** `ActionFeedbackState` interface is defined at lines 3-6 AND again at lines 55-58 (duplicate). TypeScript merges them silently, but lint flags `import-x/export` lines 3 & 55. The duplicate is clearly a copy-paste artifact — both have identical shape (`message: string; severity: "success" | "error"`).

**Action:** Remove lines 55-58 (the second definition). Keep lines 3-6 (the first). All usages already reference the first definition's hoisted binding.

**Verify:**
```bash
bun tsgo
bun run scripts/lint-service.ts --type-aware -f frontend/common/views/dashboard/classes/details/types.ts --id reexport-8
```

---

### Task 9: frontend/mobile components/ui barrel — MobilePage* duplicates

**Files:** `frontend/mobile/components/ui/container/index.ts` (edit)

**Evidence (now confirmed):** `container/index.ts` line 16 does `export * from "@/frontend/mobile/components/ui/container/page"`. So the root `mobile/components/ui/index.ts` line 6 (`export * from "./container"`) and line 7 (`export * from "./container/page"`) BOTH reach `MobilePageContainer`, `MobilePageHeader`, and their Props types → duplicate. 49 consumers import `MobilePage*` from the root barrel `@/frontend/mobile/components/ui`; the root barrel must keep exporting them via line 7 only.

**Action:** Remove line 16 (`export * from "@/frontend/mobile/components/ui/container/page"`) from `frontend/mobile/components/ui/container/index.ts`. The root barrel's line 7 remains the single path; line 6's `export * from "./container"` no longer transitively re-exports page names.

**Verify:**
```bash
# Confirm no consumer imports MobilePage* from the container barrel directly:
rg "MobilePage(Container|Header)" frontend/ --type tsx | rg "container/ui\"|container/ui/index" 
bun tsgo
bun run scripts/lint-service.ts --type-aware -f frontend/mobile/components/ui/container/index.ts --id reexport-9
bun run scripts/lint-service.ts --type-aware -f frontend/mobile/components/ui/index.ts --id reexport-9
```

**AGENTS.md rule:** `frontend/mobile/AGENTS.md` — Mobile*-prefixed primitives exported via the top-level `components/ui/index.ts`; the page subgroup has its own entry but the duplicate transitive path must be removed.

---

### Task 10: frontend/common/providers/theme barrel — MuiProvider no named exports

**Files:** `frontend/common/providers/theme/index.ts` (edit)

**Evidence (confirmed):**
- `MuiProvider.tsx:16` uses `export default function MuiProvider(...)` — a **default** export, not named.
- `theme/index.ts:2` does `export * from "@/frontend/common/providers/theme/MuiProvider"` → lint: "No named exports found".
- `LtrScope.tsx` and `ThemeProvider.tsx` — verify they use named exports (LtrScope starts with named exports based on the read).

**Action:** Replace line 2 in `theme/index.ts`:
```typescript
export { default as MuiProvider } from "@/frontend/common/providers/theme/MuiProvider";
```
Keep lines 1, 3, 4 (LtrScope, ThemeProvider, theme) if they use named exports.

**Verify:**
```bash
# Confirm consumers import MuiProvider correctly (likely `import { MuiProvider }` already, since default-as-named is the common pattern):
rg "MuiProvider" app/ frontend/ -n --type tsx | rg "import" | head
bun tsgo
bun run scripts/lint-service.ts --type-aware -f frontend/common/providers/theme/index.ts --id reexport-10
```

**Cross-layer rule:** App layout likely imports `MuiProvider` via this barrel; the `default as` re-export keeps the consumer import shape identical.

---

### Task 11: shared/locale barrel — `AppLocale` double export

**Files:** `shared/locale/index.ts` (edit), `shared/locale/types/message.ts` (edit)

**Evidence (confirmed):**
- `shared/locale/AppLocale.ts:2` defines `export type AppLocale = ...`.
- `shared/locale/index.ts:1` exports AppLocale directly: `export { type AppLocale, defaultLocale, locales } from "./AppLocale";`.
- `shared/locale/types/message.ts:132` re-exports: `export type { AppLocale } from "@/shared/locale/AppLocale.ts";`.
- `shared/locale/types/index.ts` does `export * from ... ` subtree → via `message.ts` exposes `AppLocale`.
- `shared/locale/index.ts:22` does `export * from "./types"` → second path to `AppLocale`. Lint flags lines 1 and 22.

**Action:** Remove line 132's `export type { AppLocale } from "..."` from `message.ts`. `AppLocale` stays canonical via `index.ts:1`. `message.ts` is a schema interface (`MessageSchema`) — it shouldn't re-export currency/locale enums anyway.

**Verify:**
```bash
# Confirm message.ts doesn't use AppLocale internally (it likely references AppLocale type in the schema; if so, keep an import, not a re-export):
rg "AppLocale" shared/locale/types/message.ts -n
bun tsgo
bun run scripts/lint-service.ts --type-aware -f shared/locale/index.ts --id reexport-11
bun run scripts/lint-service.ts --type-aware -f shared/locale/types/message.ts --id reexport-11
```

**AGENTS.md rule:** `shared/AGENTS.md` — public contract via `@/shared/locale` and `@/shared/locale/types`; `AppLocale` belongs in the root locale barrel since it's the locale-enum, not a message-schema type.

---

### Task 12: student.repository.ts — duplicate `enum` import

**Files:** `backend/db/repo/students/student.repository.ts` (edit)

**Evidence:** Lines 10-11:
```typescript
import { OrderSortDirection, StudentStatus } from "@/backend/enum";
import { ALLOWED_STATUS_TRANSITIONS } from "@/backend/enum/";   // trailing slash → resolves to same module
```
Lint: `import-x/no-duplicates` ("imported multiple times").

**Action:** Merge into one import (drop the trailing slash on the specifier):
```typescript
import { ALLOWED_STATUS_TRANSITIONS, OrderSortDirection, StudentStatus } from "@/backend/enum";
```

**Verify:**
```bash
bun tsgo
bun run scripts/lint-service.ts --type-aware -f backend/db/repo/students/student.repository.ts --id reexport-12
```

**AGENTS.md rule:** `backend/enum/AGENTS.md` — prefer deep imports; the barrel import is valid but must not be split across two lines for the same module.

---

## Tasks deliberately OUT OF SCOPE

- **`import-x/no-named-as-default` (logger)** — ~100 backend files do `import logger from "@/backend/lib/logger"` while `logger.ts` exports both `const logger` and `default logger`. Fixing requires a repo-wide decision: either drop the named export or rename imports. Separate task. The current plan removes **zero** of these by limiting edits to re-export files only.
- **`import-x/no-named-as-default-member` (React.createElement, useEffect)** — separate import-style task.
- **SonarJS errors** (`function-return-type`, `no-selector-parameter`, `no-redundant-optional`, `different-types-comparison`, `prefer-regexp-exec`, `no-alphabetical-sort`, `no-misleading-array-reverse`, `deprecation`, `unused-import`) — `bun quality-gate` / SonarQube workflow.
- **Config-file parsing errors** (`codegen.ts`, `drizzle.config.ts`, `next.config.ts`, `instrumentation.ts`, `proxy.ts`, `scripts/*.ts`, `vitest.config.ts`) — `tsconfig.json` `allowDefaultProject` overlaps project service; separate config task.

## Final Validation

After all 12 tasks complete:

1. **Targeted type-aware lint on every changed file** — already run per task.
2. **Global type check:**
   ```bash
   bun tsgo
   ```
   Expected: zero new errors.
3. **Full type-aware lint:**
   ```bash
   bun lint:type-aware 2>&1 | rg "import-x/(export|no-duplicates)" 
   ```
   Expected: zero matches. Remaining output = only the intentionally-deferred warnings/errors (logger, SonarJS, config parsing).
4. **Quality gate (optional, catches regressions):**
   ```bash
   bun quality-gate
   ```
   Expected: BASIC_CHECKS passes; CODESCENE/SONAR unaffected (no logic changes).
5. **Runtime smoke:**
   ```bash
   bun run dev   # server boots without module-resolution errors
   ```

## Risks

- **Multi-barrel consumers (highest impact): Tasks 7 & 9.** `frontend/common/components/ui` has 94 consumers; `MobilePage*` has 49. Mitigation: keep the barrel's public export surface identical — only the duplicate source paths change, never the exported names. `bun tsgo` immediately catches any broken consumer import.
- **Type canonical-ownership drift: Task 3.** Removing `TeacherOwnProfileUpdateInput` from `profile.types.ts:22` is safe ONLY if no consumer imports it via `@/backend/types` expecting it from `./profile`. The barrel still exports it via `./teachers`. Guarded by tsgo + the grep in the verify step.
- **Cron side-effect ordering: Task 6.** Changing `export *` → `import "./x";` is the standard Pothos pattern; the parent `pothos/index.ts` already does `export * from "./cron"`. The cron barrel is consumed ONLY by `pothos/index.ts` (side-effect import chain), so the change is local.
- **Task 1 reversal vs. Task 5**: Task 1 keeps re-exports in `drizzleDb` and trims the BARREL lines (because `drizzleDb.ts:100` depends on `typeof relations`). Task 5 keeps re-exports in the OBJECTS file and trims the SIMULATION barrel/file. Same principle — keep the canonical-owner's re-export; trim the non-owner's path — applied per-file based on where downstream type/`typeof` dependencies live.

---

## Success Criteria

- Zero `import-x/export` errors ("Multiple exports of name" and "No named exports found").
- Zero `import-x/no-duplicates` errors.
- `bun tsgo` clean.
- No consumer file's import statement changes (barrel public surface preserved).
- No logic changes anywhere — purely export-path de-duplication.
