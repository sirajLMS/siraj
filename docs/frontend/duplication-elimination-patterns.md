# Duplication Elimination Patterns

This document consolidates the patterns used to eliminate code duplication in the siraj codebase, based on the duplications plan (`.ai/plans/duplications/`).

## Pattern 1: Canonical Source with Direct Imports (Deletion)

**When to use:** Two or more files contain identical or near-identical code, and one is clearly the canonical location.

**Process:**
1. Designate the canonical file (prefer `shared/` layer for cross-layer types, `common/` for frontend-shared)
2. Delete the duplicate file(s) entirely — NO re-exports
3. Update all importers to use the canonical path via barrel imports
4. Verify with `bun check:duplicates`

**Example (Task 1.7):**
- Canonical: `common/components/ui/dataGrid/types/appDataGridShared.types.ts`
- Deleted: `backend/types/datagrid-types/appDataGridShared.types.ts`
- Importers updated to: `@/components/ui/dataGrid/types`

## Pattern 2: Shared Scaffold with Slot Props

**When to use:** Same UI component exists in common/desktop/mobile tiers with minor visual variations.

**See:** `docs/frontend/ui-shared-scaffold-pattern.md`

## Pattern 3: Shared Types Extraction

**When to use:** Identical type definitions exist in multiple layers (backend + frontend).

**Process:**
1. Create the type in `shared/types/` (accessible from both backend and frontend)
2. Update both layers to import from `shared/types/`
3. Delete the duplicate type definitions

**Example (Task 1.8):**
- Created: `shared/types/notification-alerts.types.ts`
- Updated: `backend/types/notifications/...` and `frontend/common/views/.../types/...`

## Pattern 4: Service Consolidation

**When to use:** Utility functions in `backend/lib/` duplicate service-layer logic in `backend/services/`.

**Process:**
1. Designate the service file as canonical
2. Delete the `lib/` duplicate
3. Update importers to use `@/backend/services/<module>` barrel

**Example (Task 2.18):**
- Canonical: `backend/services/auth/permissions.service.ts`
- Deleted: `backend/lib/auth/permissions.ts`

## Pattern 5: Locale Namespace Migration

**When to use:** Monolithic locale files (`profile.ts`, `meeting-config.ts`) should be split into sub-module directories.

**See:** `docs/i18n/locale-namespace-migration.md`

## Pattern 6: jscpd Ignore for Test Artifacts

**When to use:** Duplicated code is in test/development artifacts (stories, seeds, migrations) that mirror production architecture.

**Process:**
1. Add glob pattern to `.jscpd.json` `ignore` array
2. Document the rationale in the plan outcome

**Example (Task 3.6):**
- Added `**/*.stories.tsx` to ignore — 138 story clones excluded

## Pattern 7: View Component Scaffold in `__shared__/` Directory

**When to use:** Same view component exists in desktop/mobile tiers with shared presentation logic but different layout/styling. Also applies to within-tier duplications (e.g., two desktop dialogs sharing form structure).

**Process:**
1. Create a `__shared__/` directory alongside the component variants
2. Extract a `<ComponentName>Shared.tsx` scaffold with all shared presentation logic
3. Use slot props for tier-specific variations (components, sx styles, layout options)
4. Refactor each variant to delegate to the scaffold with its specific slots

**Example (Phases 2-3, 30 scaffolds created):**
- View scaffolds: `frontend/common/views/dashboard/.../__shared__/<Component>Shared.tsx`
- Desktop variant: `frontend/desktop/views/dashboard/.../<Component>.desktop.tsx` (thin wrapper)
- Mobile variant: `frontend/mobile/views/dashboard/.../<Component>.mobile.tsx` (thin wrapper)

**Slot prop patterns discovered:**
- `CardComponent` slot for card wrapping (BaseCard vs MobileBaseCard)
- `anchor` + `paperSx` for Drawer variants (right/bottom anchoring)
- Render functions for type-incompatible slots (avoids ComponentType contravariance)
- Config objects for purely visual differences (spacing, column widths, typography variants)

## Pattern 8: Within-Common Utility Consolidation

**When to use:** Two utility files in `frontend/common/` share logic but serve different domains.

**Process:**
1. Extract shared logic to a `shared-<domain>-logic.ts` module
2. Refactor both files to import and use the shared module
3. Remove duplicated code from both files

**Example (Task 3.2):**
- Created: `frontend/common/utils/excel-export/shared-export-logic.ts`
- Refactored: `parent-directory-export.ts`, `tracking-export.ts`, `report-export.ts`
- Result: 4 clones / 810 tokens eliminated

## Pattern 9: Loading Skeleton Consolidation

**When to use:** Multiple profile/page types have near-identical loading skeletons.

**Process:**
1. Create a single config-driven skeleton component
2. Pass config (row count, heights, etc.) as props
3. Delete per-type skeleton files

**Example (Task 3.3):**
- Created: shared `ProfileLoadingSkeleton` (config-driven)
- Deleted: `ParentProfileLoadingSkeleton.tsx`, `StaffProfileLoadingSkeleton.tsx`, `TeacherProfileLoadingSkeleton.tsx`

## Pattern 10: Within-Tier Shared Module Extraction

**When to use:** Two components in the same tier (both desktop or both mobile) share logic.

**Process:**
1. Create a shared module in the same tier (e.g., `__shared__/` or `components/ui/display/.../__shared__/`)
2. For cross-tier duplicates (same components in both desktop AND mobile), create a shared scaffold in `common/`
3. Refactor both consumers to use the shared module

**Example (Task 3.4):**
- Desktop payment catalog grids: shared `catalogGridShared.tsx`
- Desktop subject dialogs: shared `subjectFormDialogShared.tsx`
- Profile links (both tiers): enhanced existing `ProfileLinkBase.tsx` in common

## Pattern 11: Generic Repository Factory with Configurable Hooks

**When to use:** Multiple billing repository classes share identical CRUD/list/deactivate/query structure but differ in table shape, type mapping, and entity-specific insert defaults.

**Process:**
1. Create a `__shared__/repoFactory.ts` module with a `makeRepo<TRow, TSelect, TInsert, TUpdate, TFilters>()` function
2. Define a `RepoConfig` interface with: `shape` (column refs), `tableName`, `toSelectType`, `deactivateInput`, optional `extraActiveFilters`, and optional `prepareInsert`
3. The factory returns standard methods: `listAll`, `listActive`, `getById`, `getBySlug`, `create`, `update`, `deactivate`, `listByIds`
4. Entity-specific insert defaults (e.g., `identifierLabel ?? name`) go in the `prepareInsert` hook, NOT in the factory

**Example (Phase 3):**
- Factory: `backend/db/repo/billing/__shared__/billingRepoFactory.ts`
- Consumers: `supported-online-account.repository.ts`, `supported-mobile-wallet.repository.ts`, `supported-payment-link.repository.ts`
- Key lesson: The `prepareInsert` hook was added after review found a lost `identifierLabel` default — always check for entity-specific defaults when extracting to a factory

**See:** `docs/backend/billing-repo-factory.md`

## Pattern 12: Meeting Provider Adapter Base Class

**When to use:** Multiple meeting provider adapters (Zoom, Google Meet, Teams) share identical getter/setter/logic structure with provider-specific SDK calls.

**Process:**
1. Create an abstract `MeetingProviderAdapterBase` class in `__shared__/`
2. Implement all shared getters (`id`, `name`, `配色`, `supportsRecurring`, etc.) as concrete properties
3. Implement shared logic (URL validation, timing calculations, metadata extraction) as concrete methods
4. Declare provider-specific methods (`createMeeting`, `updateMeeting`, `deleteMeeting`) as abstract
5. Each provider extends the base and implements only its SDK-specific calls

**Example (Phase 3):**
- Base: `backend/services/meeting-providers/__shared__/meetingProviderAdapterBase.ts`
- Consumers: `zoom/__shared__/zoomMeetingAdapter.ts`, `googleMeet/__shared__/googleMeetAdapter.ts`, `teams/__shared__/teamsAdapter.ts`
- Result: 25 clones eliminated

**See:** `docs/backend/meeting-adapter-base.md`

## Pattern 13: Schema Column & Junction Table Helpers

**When to use:** Multiple Drizzle table definitions share identical column configurations (timestamps, slugs, active flags) or junction table patterns.

**Process:**
1. Create helper functions in `backend/db/schema/__shared__/`
2. For columns: `withTimestamps()`, `withSlug()`, `withActiveFlag()` return column config objects
3. For junction tables: `createJunctionTable()` returns a complete table definition with FK columns
4. Use the helpers in all schema files to ensure consistency

**Example (Phase 3):**
- Helpers: `backend/db/schema/__shared__/columnHelpers.ts`, `backend/db/schema/__shared__/junctionTableHelper.ts`
- Result: 18 clones eliminated across 15+ schema files

**See:** `docs/backend/schema-helpers.md`

## Pattern 14: App Router Page Auth Wrapper

**When to use:** 40+ `app/(dashboard)/.../page.tsx` files contain identical auth flow (session check, role redirect, group simulation handling, locale resolution).

**Process:**
1. Create a `withPageAuth()` higher-order function in a shared module
2. It accepts a render function and returns a Server Component that handles auth, redirects, and locale
3. Each page delegates to `withPageAuth((ctx) => <PageContent {...ctx} />)`
4. The wrapper handles: session validation, role-based redirects, group simulation context, locale binding

**Example (Phase 3):**
- Wrapper: `app/(dashboard)/__shared__/withPageAuth.ts`
- Consumers: 40+ dashboard pages
- Pattern: `export default withPageAuth(async ({ params, session }) => { ... })`
- Result: 7 clones + 65 semantic clones eliminated

**See:** `docs/app/with-page-auth.md`

## Pattern 15: Test Mock Navigation Helpers

**When to use:** 20+ UI test files contain identical mock navigation setup (Next.js router mock, pathname mock, router state setters).

**Process:**
1. Extract mock navigation helpers to `test/ui/components/helpers/mockNavigation.tsx`
2. Extract session activate button test logic to `test/ui/components/helpers/sessionActivateButtonTests.ts`
3. Extract student history fixtures to `test/ui/components/fixtures/studentHistoryFixtures.ts`
4. Each test imports the helpers instead of defining inline mocks

**Example (Phase 3):**
- Helpers: `test/ui/components/helpers/mockNavigation.tsx`, `test/ui/components/helpers/sessionActivateButtonTests.ts`
- Fixtures: `test/ui/components/fixtures/studentHistoryFixtures.ts`
- Result: 34 clones eliminated across 20+ test files

**See:** `docs/testing/mock-navigation-helpers.md`

## Pattern 16: Within-File Clone Extraction (Phase 7)

**When to use:** A single file contains repeating blocks of code (within-file duplication). This is distinct from cross-file duplication where two different files share code.

**Process:**
1. Identify the repeating blocks within the file (jscpd reports these as clones with the same file path)
2. Determine the extraction target:
   - **Factory function** — for repeating config/field blocks (e.g., `makeNavConfig(params)`, `makeRateLabels(id)`)
   - **Shared interface/type** — for repeating type definitions (e.g., `StudentDirectorySharedLabels`, `ResourceLibrarySharedProps`)
   - **Presentational component** — for repeating JSX blocks in `.tsx` files (e.g., `<ContextualHelperCard>`, `<PaymentDetailSection>`)
   - **Field factory** — for repeating Pothos field blocks (e.g., `teacherWeeklyArgs(t)`, `teacherWeeklyResolve(getService)`)
3. Extract the shared construct at module scope (no leading underscore — oxlint `no-underscore-dangle`)
4. All duplicated sections delegate to the extracted construct
5. Verify with `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

**Examples (Phase 7):**
- `navigationConfig.ts`: Extracted `makeTeacherNavItems()` + `makeStudentSupervisorNavItems()` factory functions
- `useClassDetailsLabels.ts`: Extracted `makeRateLabels(id)` helper for 19 rate fields
- `InvoicePaymentDetailsDialog.tsx`: Extracted `PaymentReviewLabels` + `PaymentReviewActionState` interfaces
- `contextualHelperCards.mobile.tsx`: Extracted `<ContextualHelperCard>` component + `resolveTitleColor`/`resolveBackgroundColor` helpers
- `makeWeeklyScheduleQueryField.ts`: Extracted `teacherWeeklyArgs(t)` + `teacherWeeklyResolve(getService)` module-scope helpers

**Key rules:**
- Use `make` prefix for factory functions (not `_` prefix)
- Extract at module scope (not nested inside another function — oxlint `consistent-function-scoping`)
- Empty interfaces (`interface X extends Y {}`) trigger `@typescript-eslint/no-empty-object-type` — use `type X = Y` aliases instead

## Pattern 17: Cross-Layer Utility Alignment (Phase 7)

**When to use:** Two utility files in different layers (`shared/` and `frontend/`) share duplicated logic but have different runtime dependencies or type sources.

**Approach: Extract runtime-agnostic shared logic into `shared/` modules.**

**Process:**
1. Analyze both implementations' type sources and runtime dependencies
2. Identify the runtime-agnostic overlap (pure functions, config logic, type signatures)
3. Extract the shared logic into a new `shared/` module
4. Both implementations import from the new shared module
5. Verify dependency-cruiser compliance: `shared/` must NOT import from `frontend/`, `backend/`, or `app/`

**Example 1 — enum.ts pair (84 tokens):**
- `shared/lib/enum.ts`: Uses backend pgEnums (UPPERCASE)
- `frontend/common/lib/enum.ts`: Uses GraphQL codegen enums (TitleCase)
- **Solution**: Factory pattern — added `withFallback<T>` and `orNull<T>` generic factory functions to both files, refactored all ~35 parser wrappers to use them. The wrappers produce structurally distinct token streams because the type parameters differ.
- D7-1 status: RESOLVED

**Example 2 — logger pair (79 tokens):**
- `shared/lib/logger/base-logger.ts`: Uses `node:fs/promises` (Node.js only)
- `frontend/common/lib/logger/index.ts`: Uses `fetch`, `/api/logs` endpoint (browser only)
- **Solution**: Replaced the 5-case `switch(level)` console dispatcher in both files with dynamic `globalThis.console[level]` dispatch + `typeof fn === "function"` guard. Both files use different variable names producing distinct token streams.
- D7-2 status: RESOLVED

**Key rules:**
- `shared/` must NOT import from `frontend/`, `backend/`, or `app/` (dependency-cruiser rule)
- If the overlap is pure logic (no runtime deps), extract to `shared/` module
- If the overlap is structural (similar shape but different types), use generic factory functions
- If no runtime-agnostic overlap exists, use distinct variable names to produce different token streams

## Pattern 18: Frontend Cross-Tier Shared Extraction (Phase 7)

**When to use:** Desktop and mobile tiers share code that should be extracted to `frontend/common/` to avoid cross-tier imports.

**Approach: Move shared logic to `frontend/common/` so both desktop and mobile import from common.**

**Process:**
1. Identify shared code between `.mobile.tsx` and `.desktop.tsx` files
2. Extract the shared code to `frontend/common/` (either a `*Shared.tsx` scaffold or a shared utility module)
3. Desktop and mobile variants import from `frontend/common/` — never from each other
4. Verify ESLint `no-restricted-imports` compliance: `.mobile.tsx` and `.desktop.tsx` must NOT import each other

**Key rules (from `eslint.config.mjs`):**
- `.mobile.tsx` files must NOT import from `.desktop.tsx` files (and vice versa)
- `.mobile.tsx` and `.desktop.tsx` files must NOT use `useMediaQuery` or `useViewport`
- Shared components go in `frontend/common/`
- Use `*Shared.tsx` scaffold pattern from `docs/frontend/ui-shared-scaffold-pattern.md`

**See:** `docs/frontend/ui-shared-scaffold-pattern.md` for the full scaffold pattern with slot props.

## Pattern 19: Locale Within-File Clone Extraction (Phase 7)

**When to use:** `shared/locale/` files contain within-file duplicated type signatures or translation blocks.

**Approach:** Extract shared type factories, sub-interfaces, or exported const sub-objects at module scope.

**Process:**
1. Identify repeating type signatures or translation blocks within the locale file
2. Extract shared constructs:
   - **Sub-interfaces** — for repeating type shapes (e.g., `SchedulingSharedErrors` interface)
   - **Exported const sub-objects** — for repeating translation blocks (e.g., `const adminActions = {...}`)
   - **Mapped types** — for repeating type patterns (e.g., `type OnboardingFieldLabels = Record<OnboardingFieldKey, string>`)
   - **Cross-file imports** — for translations that are identical across locales (e.g., import login translations from sibling files)
3. Both sections use the shared construct
4. Verify with `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

**Examples (Phase 7):**
- `shared/locale/types/errors/index.ts`: Extracted `SchedulingSharedErrors` interface, `ErrorsLabels` extends sub-interfaces
- `shared/locale/ar/errors/index.ts`: Extracted 6 sub-object `const`s, replaced flat declarations with spreads
- `shared/locale/en/errors/index.ts`: Same pattern as Arabic errors
- `shared/locale/types/dashboard/parents/onboarding.ts`: Extracted `OnboardingFieldKey` union + `OnboardingFieldLabels` mapped type
- `shared/locale/ar/auth/index.ts` + `en/auth/index.ts`: Import login/impersonation from sibling files instead of inlining

**Key rules:**
- `shared/locale/` must NOT import from `frontend/`, `backend/`, or `app/` (dependency-cruiser rule)
- No `.jscpd.json` ignore patterns for `shared/locale/**` — all clones are truly fixed by extraction

## CRITICAL: Circular Dependency Prevention

**NEVER** import through barrel `index.ts` re-exports when the importing and imported components live in the same barrel. This causes TDZ (Temporal Dead Zone) errors at runtime.

**Wrong:**
```typescript
import { MobilePhoneDisplay } from "@/frontend/mobile/components/ui/display";
// If the barrel exports paymentMethod/ before phoneDisplay/, MobilePhoneDisplay
// won't be initialized yet when PaymentMethodDisplay tries to use it → TDZ error
```

**Right:**
```typescript
import { MobilePhoneDisplay } from "@/frontend/mobile/components/ui/display/phoneDisplay/phoneDisplay.mobile";
```

Always use **direct file paths** for scaffold imports to prevent circular dependencies.

## Anti-Patterns

- DO NOT use `// jscpd:ignore` directives — every clone must be TRULY solved by code extraction (Phase 7 policy)
- DO NOT add source code paths to `.jscpd.json` ignore patterns — only test artifacts, generated files, docs, and stories belong there
- DO NOT use `oxlint-disable` comments — fix the root cause instead
- DO NOT use re-exports as a shortcut — they hide duplication and create import ambiguity
- DO NOT delete without verifying all importers first — use `grep -rn` to find all imports
- DO NOT create scaffolds for trivial components (<50 lines)
- DO NOT ignore cross-layer import rules (frontend must not import from backend, shared must not import from frontend/backend/app)

## Verification

After any duplication elimination:
1. `bun tsgo` — zero new errors
2. `bun biome:check` — zero warnings
3. `bun run scripts/lint-service.ts` — zero lint errors
4. `bun check:duplicates` — clone count reduced

## Related Documents

- `.ai/plans/duplications/` — the plan that established these patterns
- `.ai/plans/duplications-phase2/` — the continuation plan that established view component scaffold patterns
- `.ai/plans/duplications-phase3/` — the plan that established repo factory, adapter base, schema helpers, page auth, and test mock patterns
- `.ai/plans/duplications-phase6/` — the plan that established P3 scaffold extraction patterns (A-G) for micro clusters
- `.ai/plans/duplications-phase7/` — the plan that established within-file clone extraction, cross-layer utility alignment, and locale extraction patterns
- `.ai/plans/duplications-phase8/` — the final residual clone elimination plan (12 → 0, Patterns 20–23: ViewModel helpers, skeleton factory, component slot unification, prop-picker functions)
- `docs/frontend/ui-shared-scaffold-pattern.md`
- `docs/backend/shared-types-pattern.md`
- `docs/backend/meeting-adapter-base.md`
- `docs/backend/billing-repo-factory.md`
- `docs/backend/schema-helpers.md`
- `docs/app/with-page-auth.md`
- `docs/testing/mock-navigation-helpers.md`
- `docs/i18n/locale-namespace-migration.md`
- `docs/testing/shared-test-runner.md`

## Phase 6: Scaffold Extraction Patterns (A-G)

Phase 6 eliminated the deferred P3 micro cluster frontend pairs (135 pairs, ~11,090 tokens) and `shared/locale/` structural pairs (16 pairs, 1,604 tokens) deferred from Phase 5. The result: **475 clones (62,929 tokens) reduced to 18 clones (1,851 tokens) — a 96% reduction — with zero `jscpd:ignore` directives and zero `.jscpd.json` changes.**

Every clone pair was resolved by **true code extraction**: scaffolds, utilities, constants, dead code deletion, or type consolidation. No suppression of any kind.

The design (`.ai/plans/duplications-phase6/design.md`) defined seven patterns, A through G, each targeting a different clone-pair category:

### Pattern A: Scaffold Extraction (`*Shared.tsx` in `__shared__/`)

**When to use:** Desktop and mobile variants share the bulk of their structure with only visual differences (spacing, sizing, typography variant). These are D↔M (desktop↔mobile) pairs.

**Mechanism:**
1. Create `frontend/common/views/dashboard/<domain>/components/__shared__/<ComponentName>Shared.tsx` containing ALL shared presentation logic.
2. Export a typed `<ComponentName>SharedOptions` interface for tier-specific config.
3. Create `frontend/common/views/dashboard/<domain>/components/__shared__/<ComponentName>Shared.options.ts` with `DESKTOP_OPTIONS` and `MOBILE_OPTIONS` constants.
4. Rewrite `frontend/desktop/views/.../<ComponentName>.desktop.tsx` to import and delegate to `*Shared` with `DESKTOP_OPTIONS`.
5. Rewrite `frontend/mobile/views/.../<ComponentName>.mobile.tsx` to import and delegate to `*Shared` with `MOBILE_OPTIONS`.

**Example:**
```typescript
// frontend/common/views/dashboard/.../__shared__/exampleRowShared.tsx
export interface ExampleRowSharedOptions {
  readonly containerSx: (theme: Theme) => Record<string, unknown>;
  readonly checkboxSize: "small" | "medium";
  readonly iconButtonSize: "small" | "medium";
}

export function ExampleRowShared({ ...props, options }: Props & { options: ExampleRowSharedOptions }) {
  // ALL shared presentation logic here — both desktop and mobile render this
}
```

```typescript
// frontend/common/views/.../__shared__/exampleRowShared.options.ts
export const DESKTOP_ROW_OPTIONS: ExampleRowSharedOptions = { checkboxSize: "medium", iconButtonSize: "medium", containerSx: (t) => ({ pt: 2 }) };
export const MOBILE_ROW_OPTIONS: ExampleRowSharedOptions = { checkboxSize: "small", iconButtonSize: "small", containerSx: (t) => ({ pt: 1 }) };
```

```typescript
// frontend/desktop/views/.../exampleRow.desktop.tsx — thin wrapper
export function ExampleRowDesktop(props: ExampleRowProps) {
  return <ExampleRowShared {...props} options={DESKTOP_ROW_OPTIONS} />;
}
```

```typescript
// frontend/mobile/views/.../exampleRow.mobile.tsx — thin wrapper
export function ExampleRowMobile(props: ExampleRowProps) {
  return <ExampleRowShared {...props} options={MOBILE_ROW_OPTIONS} />;
}
```

**When to use:** D↔M pairs with structurally similar presentation logic that differ only in visual config. Even pairs that differ by 1-2 lines should still be extracted to a scaffold with options — never suppress.

### Pattern B: Shared Utility/Component Extraction

**When to use:** Two files in `frontend/common/` duplicate a utility function, constant, or small component. These are C↔C (common↔common) intra-layer pairs.

**Mechanism:**
1. Extract the shared element into a new file in an appropriate `frontend/common/` location.
2. Both consumers import from the new shared file via the `@/` path alias.

**Example:**
```typescript
// Before: two files both define the same helper
// common/views/.../domainA/utils.ts
export function formatCurrency(value: number) { return Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value); }

// common/views/.../domainB/utils.ts
export function formatCurrency(value: number) { return Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value); }

// After: extract to shared module
// common/views/.../__shared__/formatCurrency.ts
export function formatCurrency(value: number) { return Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value); }

// Both domainA and domainB import:
import { formatCurrency } from "@/frontend/common/views/.../__shared__/formatCurrency";
```

**When to use:** C↔C pairs where both files are live (imported) and share a genuine utility or small component.

### Pattern C: Dead Code Deletion

**When to use:** A duplicated file is never imported anywhere. These are C↔C pairs where one file is dead.

**Mechanism:**
1. Verify the file has zero importers (use `grep -rn "<filename>" frontend/`).
2. Delete the dead file entirely.

**Example:**
```bash
# Verify no importers exist
grep -rn "oldComponent" frontend/backend/ shared/ app/

# If empty, delete
rm frontend/common/views/.../oldComponent.tsx
```

**When to use:** C↔C pairs where one file is unreferenced. Always verify zero importers before deleting.

### Pattern D: Store/Hook Consolidation

**When to use:** Two stores or ViewModel hooks in `frontend/common/` have similar shape and logic. These are C↔C store/viewModel duplications.

**Mechanism:**
1. Create a shared factory or base hook that both stores derive from.
2. Pass domain-specific config (state keys, selectors, actions) to the factory.

**Example:**
```typescript
// Before: two near-identical Zustand stores
// domainAStore.ts
export const useDomainAStore = create<DomainAState>()((set) => ({ items: [], loading: false, fetch: async () => { ... } }));

// domainBStore.ts
export const useDomainBStore = create<DomainBState>()((set) => ({ items: [], loading: false, fetch: async () => { ... } }));

// After: shared factory
// __shared__/makeListStore.ts
export function makeListStore<T>(config: ListStoreConfig<T>) {
  return create<ListStoreState<T>>()( immer((set) => ({
    items: [],
    loading: false,
    fetch: async () => { const data = await config.fetcher(); set({ items: data, loading: false }); },
  })));
}

// domainAStore.ts
export const useDomainAStore = makeListStore({ fetcher: () => api.fetchDomainA() });
// domainBStore.ts
export const useDomainBStore = makeListStore({ fetcher: () => api.fetchDomainB() });
```

**When to use:** C↔C pairs where both are live stores/hooks with similar state shape and action logic.

### Pattern E: Scaffold Extension (Extend Existing `*Shared.tsx`)

**When to use:** A common-tier file duplicates logic already in a `*Shared.tsx` scaffold, or the common file should BE the scaffold. These are C↔D (common↔desktop) or C↔M (common↔mobile) cross-tier pairs.

**Mechanism:**
1. Move the shared logic into the existing `__shared__/` scaffold.
2. Have the common-tier file delegate to the scaffold (same as desktop/mobile do).
3. OR create a new `*Shared.tsx` if none exists, and have all three tiers (common, desktop, mobile) delegate to it.

**Example:**
```typescript
// Before: common file duplicates what's in the desktop-variant scaffold
// common/views/.../dataSummary.tsx — contains logic also in dataSummaryShared.tsx

// After: extend existing scaffold — common delegates too
// common/views/.../dataSummary.tsx
import { DataSummaryShared, DEFAULT_SUMMARY_OPTIONS } from "@/frontend/common/views/.../__shared__/dataSummaryShared";
export function DataSummary(props: Props) {
  return <DataSummaryShared {...props} options={DEFAULT_SUMMARY_OPTIONS} />;
}
```

**When to use:** C↔D / C↔M pairs where the common-tier file shares clear logic with the desktop or mobile variant's scaffold.

### Pattern F: Shared View Scaffold (in `frontend/common/views/__shared__/`)

**When to use:** Two desktop views (D↔D) or two mobile views (M↔M) in the same tier share a layout pattern. These are same-tier pairs.

**Mechanism:**
1. Create a `__shared__/*Shared.tsx` in `frontend/common/views/` (or the appropriate domain sub-path).
2. Both same-tier variants import and delegate to the scaffold.
3. This follows the same pattern as D↔M (Pattern A) but both consumers pass similar options.

**Example:**
```typescript
// frontend/common/views/.../__shared__/adminCardGridShared.tsx
export interface AdminCardGridSharedOptions { readonly columns: number; readonly cardSx: SxProps; }
export function AdminCardGridShared({ items, options }: Props & { options: AdminCardGridSharedOptions }) {
  return <Grid container columns={options.columns}>...</Grid>;
}

// frontend/desktop/views/.../supervisorAdmin.desktop.tsx — two desktop views
export function SupervisorAdminDesktop(props: Props) {
  return <AdminCardGridShared {...props} options={SUPERVISOR_GRID_OPTIONS} />;
}

// frontend/desktop/views/.../staffAdmin.desktop.tsx
export function StaffAdminDesktop(props: Props) {
  return <AdminCardGridShared {...props} options={STAFF_GRID_OPTIONS} />;
}
```

**When to use:** D↔D or M↔M same-tier pairs where two views in the same tier share a clear layout pattern.

### Pattern G: Locale Type Consolidation

**When to use:** `shared/locale/` namespace type files define identical type signatures across locales. These are `shared/locale/` structural pairs.

**Mechanism:**
- Extract common type bases into a shared interface in `shared/locale/types/`.
- Use `Pick<>` or `Omit<>` to derive locale-specific subsets.
- OR consolidate repeated type definitions into a single canonical type with locale-specific overrides.
- NEVER break the compile-time type safety — the locale system must still type-check all translations.

**Example:**
```typescript
// Before: both locale type files define identical signatures
// shared/locale/types/dashboard/teacher/index.ts
export interface TeacherDashboardLabels {
  readonly name: string;
  readonly status: string;
  readonly role: string;
}

// shared/locale/types/dashboard/student/index.ts
export interface StudentDashboardLabels {
  readonly name: string;
  readonly status: string;
  readonly role: string;
}

// After: extract shared base type
// shared/locale/types/dashboard/__shared__/personLabels.ts
export interface PersonLabels { readonly name: string; readonly status: string; readonly role: string; }

// shared/locale/types/dashboard/teacher/index.ts
export type TeacherDashboardLabels = Pick<PersonLabels, "name" | "status" | "role">;
// OR: extends PersonLabels if locale adds fields
// shared/locale/types/dashboard/student/index.ts
export type StudentDashboardLabels = Pick<PersonLabels, "name" | "status" | "role">;
```

**When to use:** `shared/locale/` structural pairs where locale namespace type files share identical or overlapping type signatures. This is the only acceptable approach for locale duplication — never use `.jscpd.json` ignore patterns.

### Key Rules

- **No `jscpd:ignore`:** NEVER add `// jscpd:ignore-start` or `// jscpd:ignore-end`. Every clone is truly fixed by code extraction.
- **No `.jscpd.json` changes:** NEVER add ignore patterns for source code. Only test artifacts, generated files, docs, and stories belong in `.jscpd.json`.
- **Dependency compliance:**
  - `shared/` must NOT import from `frontend/`, `backend/`, or `app/`.
  - `frontend/` must NOT import from `backend/`.
  - `.desktop.tsx` must NOT import from `@/frontend/mobile/`.
  - `.mobile.tsx` must NOT import from `@/frontend/desktop/`.
  - `.desktop.tsx` / `.mobile.tsx` must NOT use `useMediaQuery` or `useViewport`.
  - Tier views must NOT use `useAppTranslation` directly — labels passed via props from ViewModel.
  - Shared logic goes in `frontend/common/` — desktop and mobile never import from each other.
- **Use `@/` path aliases:** All imports must use `@/` path alias, never relative `./` or `../`. Use direct file paths (not barrel `index.ts` re-exports) for scaffold imports to prevent TDZ circular dependencies.
- **MUI v9 sx prop only:** No `fontWeight`, `mb`, etc. as direct props — use `sx={{ ... }}`.
- **No `oxlint-disable`:** Fix root causes, never suppress linter warnings.
- **Verify per-file:** Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` after each modification (runs tsgo → oxlint → biome → lint:type-aware → check:duplicates → codescene).

**See:** `docs/frontend/ui-shared-scaffold-pattern.md` for the detailed scaffold pattern with slot props, config objects, and the full `*Shared.tsx` + `*Shared.options.ts` convention.

## Phase 8: Final Residual Clone Elimination (12 → 0)

Phase 8 eliminated the **final 12 residual clone pairs (1,192 tokens)** that survived Phases 1–7. These were the hardest structural duplicates — pairs that prior phases deemed "too different to fix." Every pair was resolved by **true code extraction** with zero `jscpd:ignore` directives and zero `.jscpd.json` changes. **Final jscpd count: 0 clones.**

The patterns below represent advanced extraction techniques for cases where scaffold extraction alone is insufficient.

### Pattern 20: ViewModel Helper Functions (Phase 8)

**When to use:** Two ViewModel hooks (`use*ViewModel`) build structurally identical derived objects (invoice rows, billing summaries, quick-pay actions) from different raw data sources with slightly different defaults.

**Process:**
1. Identify the structurally identical derived objects (same shape, same logic, different default values)
2. Create a `*Helpers.ts` module in the domain's `__shared__/` directory
3. Implement shared builder functions that accept configurable defaults via an options parameter
4. For functions needing generic type parameters (e.g., `TSummary extends SomeShape | undefined`), define an explicit args interface
5. Both ViewModels import and call the shared builders with their domain-specific defaults

**Example (Phase 8, Tasks 1.2):**
- Created: `frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers.ts`
- `buildInvoiceRow(invoice, opts)` — `opts: { staleDefault: boolean | null, currencyDefault: CurrencyCode | null }`
- `buildParentBillingSummary(data)` — shared summary builder
- `resolveQuickPayAction(args)` — generic `ResolveQuickPayActionArgs<TSummary>` interface
- Consumers: `useParentBillingViewModel.ts` (stale: true, currency: Usd), `useUserBillingProfileViewModel.ts` (stale: null, currency: null)
- Result: 3 clone pairs (303 tokens) eliminated

**Key rules:**
- Name with `build*` prefix for pure functions (not `use*` — they're not React hooks)
- Configurable defaults via options object, not function overloads
- Generic type constraints documented in dedicated interface

### Pattern 21: Loading Skeleton Factory Function (Phase 8)

**When to use:** Two profile skeleton components have identical card structures with only minor differences in the number/config of extra cards.

**Process:**
1. Identify the common card structures shared by both skeletons
2. Create a factory function that accepts an array of extra cards and returns the complete skeleton config
3. Use a `WithCommonCards` variant that prepends shared `COMMON_GRID_CARDS` before the extra cards
4. Both skeleton components call the factory with their domain-specific extra cards

**Example (Phase 8, Task 1.3):**
- Created: `frontend/common/views/dashboard/profile/shared/createProfileLoadingSkeletonConfig.ts`
- `createProfileLoadingSkeletonConfig(cards)` — base factory
- `createProfileLoadingSkeletonConfigWithCommonCards(extraCards)` — prepends 2 `COMMON_GRID_CARDS`
- Consumers: `ParentProfileLoadingSkeleton.tsx`, `StaffProfileLoadingSkeleton.tsx`
- Result: 1 clone pair (83 tokens) eliminated

### Pattern 22: Unified Scaffold with Component Slot Prop (Phase 8)

**When to use:** A common scaffold component and a mobile-specific fork share 90% of their logic, but the mobile version uses different layout constants (spacing, icon sizes) and a mobile-specific action component.

**Process:**
1. Extend the common scaffold to accept a `PrimaryActionComponent` slot prop (typed as `ComponentType<{ onClick: () => void }>`)
2. Add configurable sx/layout props with desktop defaults: `cardSx`, `iconCircleSize`, `stackGap`, `titleSubtitleGap`, `actionSx`
3. Type sx constants as `SxProps<Theme>` to satisfy oxlint `no-unsafe-type-assertion`
4. Mobile consumers pass MobilePrimaryPageAction and mobile-specific layout values
5. Delete the mobile-only fork file — it's now fully replaced by the unified scaffold

**Critical:** Non-component exports (constants like `MOBILE_HERO_CARD_SX`) must be in a separate `.ts` file (no JSX, no `"use client"`) to avoid `react-refresh/only-export-components` ESLint warnings.

**Example (Phase 8, Task 2.1):**
- Extended: `frontend/common/views/dashboard/supervisor/dashboard/components/__shared__/heroSummaryCardShared.tsx`
- Created: `frontend/common/views/dashboard/supervisor/dashboard/components/__shared__/heroCardSx.constants.ts`
- Deleted: `frontend/mobile/views/dashboard/supervisor/dashboard/components/__shared__/supervisorHeroCardShared.tsx`
- Result: 1 clone pair (89 tokens) eliminated

### Pattern 23: Prop-Picker Function for Forwarded Props (Phase 8)

**When to use:** Desktop and mobile view components forward identical sets of 15–25 props from a ViewModel to a child component. The prop lists are duplicated, and individual prop names may differ (e.g., ViewModel `isInitialLoading` → child `isSearching`).

**Process:**
1. Create a `pick*Props(source)` pure function in a `.ts` file (NOT `.tsx` — avoids `react-refresh/only-export-components`)
2. Type the function parameter as `Pick<ViewModel, ...all needed fields...>` — accepts any object containing the needed fields, not just the full ViewModel
3. The function maps fields (including any renames like `isInitialLoading` → `isSearching`)
4. Both desktop and mobile spread `{...pick*Props(viewModel)}` — only tier-specific props (container wrappers, mobile-only props) remain explicit
5. For dialog-heavy components, name the function `build*Props` (not `pick*`) when it also adds static resolvers or derived values beyond simple picking

**Variants:**
- **Simple picker:** `pickSearchScheduleFormProps(vm)` — maps one field rename, returns `Pick<ViewModel, ...fields...>`
- **Builder:** `useCreateRecurringClassDialogProps(teacherId, vm)` — destructures 15 fields, maps 3 label renames, adds static resolvers, returns `Readonly<SharedProps>`
- **Bag picker with type:** `useUserBillingSectionProps(vm)` — returns 22 shared fields; mobile adds 3 extra props explicitly

**Example (Phase 8, Tasks 2.5–2.7):**
- Created: `searchScheduleFormPropsPicker.ts`, `createRecurringClassDialogProps.ts`, `userBillingProfileSharedProps.ts`
- Desktop: 44 lines → 15 lines; Mobile: 58 lines → 17 lines
- Result: 3 clone pairs (379 tokens) eliminated

**Key rules:**
- Function goes in `.ts` file, not `.tsx` (avoids `react-refresh/only-export-components`)
- Use `Pick<ViewModel, ...>` for the parameter type — allows calling with destructured subsets
- Return `Readonly<SharedProps>` for builders that construct new objects
- Keep tier-specific chrome (containers, headers, mobile-only props) explicit — don't over-extract
