# Design: Code Duplication Elimination — Phase 3

**Feature:** Code Duplication Elimination Phase 3
**Version:** 1.0
**Date:** 2026-08-11
**Predecessors:** Phase 1 (1,021→819), Phase 2 (819→580, frontend 718→457)

---

## 1. Design Goals

1. **Eliminate ≥70% of remaining clones** — 580→≤175 total (target ≤100), with priority on backend layers not yet addressed
2. **Zero regressions** — all tests pass, no behavioral changes, tsgo/biome/lint at 0 errors
3. **Reuse established patterns** — `*Shared.tsx` scaffolds, canonical-source-with-barrel-import, `.jscpd.json` ignore, generic factory functions
4. **Establish new backend patterns** — `MeetingAdapterBase`, `BillingRepoFactory`, `withPageAuth`, `makeFileJunctionTable`, `mockNextNavigation`
5. **Maximize parallelism** — 16 subagents per phase where files are independent
6. **Full test suite** — no deferral (learned from Phase 2's inconclusive 4.3)

---

## 2. Critical Policy

**NO RE-EXPORTS.** All duplicate files deleted entirely; importers use canonical direct imports. Exception: backwards-compat barrels explicitly justified.

**Direct module paths** for scaffolds and helpers in same directory (avoid circular dependency TDZ — learned from Phase 1/2). Never import through barrel `index.ts` when both files live in same barrel.

---

## 3. Key Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Generic `BillingRepoFactory<TSelect, TInsert>` | 3+ repos with identical CRUD skeleton; factory eliminates ~60% boilerplate per repo |
| 2 | `MeetingAdapterBase` abstract class | 3 adapters share ~80% logic; base class + config subclass eliminates 16 cross-file clones |
| 3 | `withPageAuth` higher-order function | 65 files repeat the same 4-line auth triplet; HoF reduces to 1 import + 1 function call |
| 4 | `makeFileJunctionTable(tableName, entityTable, entityIdColumn)` helper | 10 junction tables with identical column+index shape; helper eliminates ~180 lines |
| 5 | `mockNextNavigation(pathname?)` test helper | 15 files repeat ~40-line mock block; helper eliminates ~600 lines |
| 6 | `parsePaginationArgs` single canonical helper | 6+ copies + ~7 inline; single helper in `backend/graphql/utils/` |
| 7 | `ComplaintSuggestionBaseService` or shared helpers | 6 cross-file + 5 intra-file clones; near-identical service implementations |
| 8 | `FxAdapterBase` shared class | Fixer and OpenExchangeRates share ~70% logic |
| 9 | Schema `timestampColumns()` / `primaryKeyColumn()` helpers | 30+ timestamp, 60+ ID column duplications; helpers eliminate structural duplication |
| 10 | Phased backend→frontend→test→cross-layer→verification | Risk-based ordering: backend first (stable, well-tested), then frontend, then test infrastructure |
| 11 | 16-way parallel subagent dispatch per phase | User requested maximum speed; files within each phase are independent |
| 12 | `AdminSectionShared` with slot props | Extends Phase 2's `*Shared.tsx` pattern to frontend component clusters |

---

## 4. Phase Architecture

```
Phase 0: Baseline
  └─ Record tsgo/biome/lint/jscpd → deferred-items.md → outcome

Phase 1: Backend Service Adapter Consolidation (REQ-1, REQ-5, REQ-6, REQ-7, REQ-8)
  └─ 5 parallel subagent groups: meeting adapters, FX adapters, auth simulation, channel factories, cache adapters
  └─ Each group: extract base class/shared helpers → update variants → quality loop per file

Phase 2: Backend Service Logic Consolidation (REQ-2, REQ-3, REQ-26)
  └─ 3 parallel subagent groups: complaint/suggestion, meeting-config pair, intra-file clones
  └─ Each group: extract shared logic → update consumers → quality loop per file

Phase 3: Backend Repository & Types Consolidation (REQ-4, REQ-9, REQ-10, REQ-25)
  └─ 4 parallel subagent groups: billing repo factory, repo intra-file, types, mapper factory
  └─ Each group: extract factory/helpers → update repos → quality loop per file

Phase 4: Schema & Cross-Layer Helpers (REQ-21, REQ-22, REQ-23, REQ-24)
  └─ 4 parallel subagent groups: junction table helper, supported-* helper, timestamp/ID helper, pagination helper
  └─ Each group: create helper → update schema/resolvers → quality loop per file

Phase 5: App Router Consolidation (REQ-11, REQ-12, REQ-13)
  └─ 3 parallel subagent groups: withPageAuth extraction, profile page family, metadata title helper
  └─ Each group: create helper → update route files → quality loop per file

Phase 6: Frontend Component Clusters (REQ-17, REQ-18, REQ-19, REQ-20)
  └─ 4 parallel subagent groups: tab panels, quota views, admin sections, remaining pairs
  └─ Each group: extract shared → update variants → quality loop per file

Phase 7: Test Infrastructure (REQ-14, REQ-15, REQ-16)
  └─ 3 parallel subagent groups: mock navigation, student fixtures, desktop/mobile test factory
  └─ Each group: create helper → update test files → quality loop per file

Phase 8: Plan Review Gate (REQ-27)
  └─ @plan-review skill on all 3 plan files

Phase 9: Mid-Point Review Gate (REQ-28)
  └─ Parallel review-backend + review-types subagents

Phase 10: Post-Implementation Review Wave (REQ-29)
  └─ Parallel review-backend + review-frontend + review-types subagents → fix wave → re-verify

Phase 11: Final Verification (REQ-30)
  └─ jscpd → quality-gate:fresh → full test suite → baseline comparison → knowledge propagation
```

---

## 5. Backend Service Adapter Design

### 5.1 MeetingAdapterBase (REQ-1)

**Location:** `backend/services/meeting/__shared__/meetingAdapterBase.ts`

**Pattern:** Abstract base class with template method pattern

```typescript
abstract class MeetingAdapterBase implements MeetingAdapter {
  abstract readonly provider: MeetingProvider;
  abstract readonly meetingUrlPattern: RegExp;
  abstract readonly providerBaseUrl: string;

  // Shared logic: all 3 adapters share createMeeting, extractMeetingId, validateUrl
  async createMeeting(config: MeetingCreateConfig): Promise<MeetingCreateResult> { /* shared */ }
  extractMeetingId(url: string): string | null { /* shared */ }
  isUrlValid(url: string): boolean { /* shared */ }

  // Abstract: provider-specific API calls differ
  protected abstract callProviderApi(config: MeetingCreateConfig): Promise<ProviderMeetingResponse>;
  protected abstract transformResponse(response: ProviderMeetingResponse): MeetingCreateResult;
}
```

*Note: All types (`MeetingAdapter`, `MeetingProvider`, `MeetingCreateConfig`, `MeetingCreateResult`, `ProviderMeetingResponse`) MUST be imported from `@/backend/types/meeting.types.ts`.*

**Subclasses:** `GoogleMeetAdapter`, `MicrosoftTeamsAdapter`, `ZoomAdapter` — each ~30-50 lines (config + API call + response transform).

### 5.2 FxAdapterBase (REQ-5)

**Location:** `backend/services/fx/__shared__/fxAdapterBase.ts`

**Pattern:** Same abstract base class pattern

```typescript
abstract class FxAdapterBase implements FxProviderAdapter {
  abstract readonly provider: FxProvider;
  abstract readonly apiKeyEnvVar: string;

  async fetchRates(base: CurrencyCode, targets: CurrencyCode[]): Promise<FxRates> { /* shared */ }
  async convert(amount: number, from: CurrencyCode, to: CurrencyCode): Promise<number> { /* shared */ }

  protected abstract buildApiUrl(base: CurrencyCode, targets: CurrencyCode[]): string;
  protected abstract parseRatesResponse(response: unknown): Map<CurrencyCode, number>;
}
```

*Note: All types (`FxProviderAdapter`, `FxProvider`, `CurrencyCode`, `FxRates`) MUST be imported from `@/backend/types/fx.types.ts`.*

### 5.3 Auth Simulation Base (REQ-6)

**Location:** `backend/services/auth/__shared__/simulationBase.ts`

**Pattern:** Shared helper functions (not a class — services have different signatures)

```typescript
// Shared session-simulation logic extracted from impersonation + permission-group-simulation
async function createSimulationSession(params: SimulationParams, tx?: DBTx): Promise<SimulationSession> { /* shared */ }
async function endSimulationSession(sessionId: string, tx?: DBTx): Promise<void> { /* shared */ }
function validateSimulationTarget(targetUserId: string, currentUserId: string): void { /* shared */ }
```

*Note: All types (`SimulationParams`, `SimulationSession`, `DBTx`) MUST be imported from `@/backend/types/auth.types.ts` (or `@/backend/types/simulation.types.ts` if new file needed). If these types don't yet exist in `backend/types/`, create them there first — never define types locally in service files.*

---

## 6. Communication Service Consolidation Design (REQ-2)

### 6.1 ComplaintSuggestionBaseService

**Location:** `backend/services/communication/__shared__/complaintSuggestionBase.ts`

**Pattern:** Shared helper functions (services have different entity types but identical logic flow)

```typescript
// Shared CRUD + query logic for complaint and suggestion services
async function listByStatus<T extends BaseEntity>(status: string, repo: BaseRepo<T>, tx?: DBTx): Promise<T[]> { /* shared */ }
async function resolveEntity<T extends BaseEntity>(id: string, repo: BaseRepo<T>, tx?: DBTx): Promise<T | null> { /* shared */ }
async function addInternalNote<T extends BaseEntity>(id: string, note: string, repo: BaseRepo<T>, tx?: DBTx): Promise<T> { /* shared */ }
function buildResolutionResponse(resolved: boolean, resolution: string | null): ResolutionResult { /* shared */ }
```

*Note: All types (`BaseEntity`, `BaseRepo<T>`, `DBTx`, `ResolutionResult`) MUST be imported from `@/backend/types/`. If `BaseEntity`/`BaseRepo` don't exist yet, create them in `backend/types/communication.types.ts` first — never define types locally in service `__shared__/` files.*

**Consumer services:** `complaint.service.ts` and `suggestion.service.ts` import and call shared helpers, keeping their entity-specific mapping/type logic local.

---

## 7. Billing Repository Factory Design (REQ-4, REQ-25)

### 7.1 BillingRepoFactory

**Location:** `backend/db/repo/billing/__shared__/billingRepoFactory.ts`

**Pattern:** Generic factory function creating standard CRUD methods

```typescript
function makeBillingRepo<
  TSelect extends { id: string; direction: string; active: boolean },
  TInsert,
>(config: BillingRepoConfig<TSelect, TInsert>): BillingRepo<TSelect, TInsert> {
  return {
    listActive: async (tx?) => { /* shared query with direction filter */ },
    getById: async (id, tx?) => { /* shared */ },
    getBySlug: async (slug, tx?) => { /* shared */ },
    create: async (data, tx?) => { /* shared */ },
    update: async (id, data, tx?) => { /* shared */ },
    toSelectType: (row) => makeSelectMapper(row, config.enumCorrections),
  };
}
```

*Note: `BillingRepoConfig`, `BillingRepo<TSelect, TInsert>`, `TSelect`/`TInsert` must map to canonical `*SelectType`/`*InsertType` from `@/backend/types/billing.types.ts`. `makeSelectMapper` is a utility function that lives in `backend/db/repo/billing/__shared__/` (not in `backend/types/` which is pure type definitions).*

**Config:** `{ tableName, selectShape, insertShape, enumCorrections, slugColumn }`

**Consumers:** `supported-payment-method-repo.ts`, `supported-payment-method-file-repo.ts`, `supported-payout-method-repo.ts` — each becomes ~20-30 line config call.

### 7.2 directionFilter Extraction

**Location:** `backend/db/repo/billing/__shared__/directionFilter.ts`

```typescript
import { eq } from "drizzle-orm";
import { SupportedPaymentDirection } from "@/shared/constants/billing.enum";

function directionFilter(direction: SupportedPaymentDirection) {
  // Use String() to avoid oxlint no-unsafe-enum-comparison on pgEnum columns
  return eq(billingBase.direction, String(direction));
}
```

Eliminates 3 copies across billing repos. Uses `String()` cast per AGENTS.md oxlint `no-unsafe-enum-comparison` rule for pgEnum columns.

---

## 8. Schema Helper Design (REQ-21, REQ-22, REQ-23)

### 8.1 makeFileJunctionTable (REQ-21)

**Location:** `backend/db/schema/storage/__shared__/makeFileJunctionTable.ts`

```typescript
import { pgTable, uuid, text, timestamp, integer, primaryKey, index } from "drizzle-orm/pg-core";

// Use typed config object to avoid dynamic string-key access (no-unsafe-type-assertion)
interface FileJunctionConfig {
  tableName: string;
  // Column builders passed as typed functions — avoids string-key indexing
  entityIdColumn: (t: Record<string, unknown>) => unknown;
  indexName: string;
}

function makeFileJunctionTable(config: FileJunctionConfig) {
  return pgTable(config.tableName, {
    // entityId column is typed by the caller — no dynamic key access needed
    entityId: uuid("entity_id").notNull(),
    fileId: uuid("file_id").notNull(),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
  }, (t) => [
    primaryKey({ columns: [t.entityId, t.fileId] }),
    index(`${config.tableName}_file_idx`).on(t.fileId),
  ]);
}
```

*Note: Callers pass a typed config object; the helper uses fixed column names (`entityId`, `fileId`) with an `entity_id` DB column name. If the FK column name must vary per junction, use a `columnName` field in `FileJunctionConfig` and refer to `t[columnName]` via a typed `(t) => t[columnName]` accessor function — avoid raw `as` casts.*

**Consumers:** 10 junction tables in `storage/storage.ts` — each becomes a single function call.

### 8.2 supportedPaymentMethodBase (REQ-22)

**Location:** `backend/db/schema/billing/__shared__/supportedPaymentMethodBase.ts`

```typescript
function supportedPaymentMethodBase(tableName: string) {
  return {
    id: uuid("id").defaultRandom().primaryKey(),
    paymentMethodId: uuid("payment_method_id").notNull(),
    region: text("region").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
  };
}
```

**Consumers:** 3 supported-* table definitions become `pgTable("name", supportedPaymentMethodBase("name"), (t) => [...])`.

### 8.3 timestampColumns / primaryKeyColumn (REQ-23)

**Location:** `backend/db/schema/__shared__/columnHelpers.ts`

```typescript
function timestampColumns() {
  return {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()).notNull(),
  };
}

function primaryKeyColumn(name = "id") {
  return uuid(name).defaultRandom().primaryKey();
}
```

**Consumers:** All schema table definitions — spread into table config: `{ ...primaryKeyColumn(), ...timestampColumns(), ... }`.

---

## 9. App Router Auth Helper Design (REQ-11)

### 9.1 withPageAuth

**Location:** `backend/lib/auth/withPageAuth.ts`

**Pattern:** Higher-order function wrapping server components

```typescript
import { getServerUserContext } from "@/backend/lib/auth/server-context";
import { redirectToLogin } from "@/backend/lib/auth/redirect";
import { requirePermissionForPage } from "@/backend/lib/auth/permissions";
import type { PageProps } from "@/backend/types/page.types";
import type { UserContext } from "@/backend/types/auth.types";

function withPageAuth<T extends PageProps>(
  permission: string,
  handler: (ctx: UserContext, props: T) => Promise<JSX.Element>,
): (props: T) => Promise<JSX.Element> {
  return async (props: T) => {
    const ctx = await getServerUserContext();
    if (!ctx) return redirectToLogin();
    await requirePermissionForPage(ctx, permission);
    return handler(ctx, props);
  };
}
```

**Consumer pattern:**
```typescript
// Before (65 files):
export default async function Page({ params }: Props) {
  const ctx = await getServerUserContext();
  if (!ctx) return redirectToLogin();
  await requirePermissionForPage(ctx, "billing.read");
  // ... page logic
}

// After:
export default withPageAuth("billing.read", async (ctx, { params }) => {
  // ... page logic
});
```

---

## 10. Test Infrastructure Design (REQ-14, REQ-15, REQ-16)

### 10.1 mockNextNavigation (REQ-14)

**Location:** `test/ui/components/helpers/mockNavigation.ts`

```typescript
import { vi } from "vitest";

const DEFAULT_OPTS = {};

export function mockNextNavigation(
  pathname: string = "/",
  opts: { locale?: string; query?: Record<string, string> } = DEFAULT_OPTS,
) {
  const locale = opts.locale ?? "en";
  const query = opts.query ?? {};

  vi.mock("next/navigation", () => ({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => pathname,
    useSearchParams: () => new URLSearchParams(Object.entries(query)),
    redirect: vi.fn(),
  }));
}
```

**Consumer pattern:**
```typescript
// Before (15 files, ~40 lines each):
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/test",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// After:
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";
mockNextNavigation("/test");
```

### 10.2 Student History Fixtures (REQ-15)

**Location:** `test/ui/components/fixtures/studentHistoryFixtures.ts`

Export typed fixture objects: `STUDENT_WITH_SESSIONS`, `STUDENT_WITHOUT_SESSIONS`, `STUDENT_HISTORY_RESULT`, `STUDENT_SESSIONS_RESULT`.

**Consumers:** `studentHistoryContainer.test.tsx`, `studentHistoryMobile.test.tsx`, `studentSessionsContainer.test.tsx`, `studentProfileContainer.test.tsx`.

### 10.3 makeSessionActivateButtonTests (REQ-16)

**Location:** `test/ui/components/helpers/sessionActivateButtonTests.ts`

```typescript
export function makeSessionActivateButtonTests(
  Component: React.ComponentType<SessionActivateButtonProps>,
  label: string,
) {
  describe(`${label} SessionActivateButton`, () => {
    it("renders activate button", () => { /* shared test */ });
    it("calls onActivate when clicked", () => { /* shared test */ });
    // ... all shared tests
  });
}
```

**Consumers:** Both `.desktop.test.tsx` and `.mobile.test.tsx` call `makeSessionActivateButtonTests(DesktopSessionActivateButton, "Desktop")` and `makeSessionActivateButtonTests(MobileSessionActivateButton, "Mobile")`.

---

## 11. Frontend Component Cluster Design (REQ-17, REQ-18, REQ-19, REQ-20)

### 11.1 Tab Panel Factory Extension (REQ-17)

**Location:** Extend existing `frontend/common/views/dashboard/__shared__/createTabbedPanePanels.ts`

Add configuration for `PaymentCatalogsTabPanels`, `BillingTabPanels`, `ScheduleTrackingTabPanels`, `FeedbackManageTabPanels`, `UsersDirectoryTabPanels` — each becomes a config-driven call.

### 11.2 QuotaAudienceViewShared (REQ-18)

**Location:** `frontend/common/views/dashboard/students/quota/components/__shared__/quotaAudienceViewShared.tsx`

Slot props for `AudienceType`, `DataSource`, `Columns`, `EmptyStateMessage`. 4 variants become thin wrappers.

### 11.3 AdminSectionShared (REQ-19)

**Location:** `frontend/common/views/dashboard/profile/components/__shared__/adminSectionShared.tsx`

Slot props for `Title`, `Content`, `Actions`. 3 variants (AdminOnly, StudentAdmin, SupervisorAdmin) become thin wrappers.

### 11.4 Remaining Component Pairs (REQ-20)

Evaluate each clone pair:
- **SimulationBannerShared** — GroupSimulation ↔ Impersonation (~60 lines share)
- **ProfileEditFormShared** — parent/staff/teacher edit forms (~80 lines share)
- **Story boilerplate** — evaluate jscpd ignore vs factory (per Phase 1 decision for stories)
- **UI shared/base pairs** — evaluate individually; extract if >50 lines shared, ignore if <50

---

## 12. Meeting Config Pair Design (REQ-3)

### 12.1 MeetingConfigBase Interface

**Location:** `backend/types/meeting-config-base.types.ts` (flat convention — `backend/types/` uses `{entity}.types.ts` naming, no `__shared__/` subdirectories)

```typescript
interface MeetingConfigBase {
  id: string;
  provider: string;
  roomId: string;
  meetingUrl: string;
  active: boolean;
  // ... all fields shared by class-meeting-config and meeting-config
}
```

**Consumer types:** `ClassMeetingConfigSelectType` and `MeetingConfigSelectType` both extend `MeetingConfigBase`.

### 12.2 Meeting Config Service Helper

**Location:** `backend/services/meeting/__shared__/meetingConfigHelpers.ts`

Shared query/upsert helpers for both `class-meeting-config.service.ts` and `meeting-config.service.ts`.

### 12.3 Meeting Config Repo Helper

**Location:** `backend/db/repo/meeting/__shared__/meetingConfigRepoHelpers.ts`

Shared `directionFilter`-equivalent + query patterns.

---

## 13. Pagination Helper Design (REQ-24)

**Location:** `backend/graphql/utils/pagination-utils.ts`

*Note: `PaginationArgs` is a runtime class (instantiated with `new PaginationArgs(...)`), so it MUST be imported as a value import (`import { PaginationArgs } from "..."`), not `import type`.*

```typescript
import { PaginationArgs } from "@/backend/types/pagination.types";

export function parsePaginationArgs(params: unknown): PaginationArgs {
  // Single canonical implementation
}

export function toPaginationArgs(first?: number, after?: string, last?: number, before?: string): PaginationArgs {
  // Single canonical builder
}

export function buildPageInfo<T extends { id: string }>(items: T[], totalCount: number, args: PaginationArgs) {
  // Single canonical pageInfo builder
}
```

**Consumers:** All 6+ GraphQL pothos files that currently duplicate these functions + ~7 inline `new PaginationArgs(...)` copies.

---

## 14. Risk Analysis

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | Meeting adapter refactoring breaks integration tests | Low | High | Adapter base preserves all API calls; test with `test:integration` |
| 2 | withPageAuth breaks app router pages | Medium | High | HoF preserves all return types; test with `build:test` + `test:ui:e2e` |
| 3 | Schema helper breaks Drizzle migration generation | Medium | High | Helper uses Drizzle's own `pgTable` return type; run `bun run db generate` to verify |
| 4 | Billing repo factory loses type safety | Low | Medium | Generic `<TSelect, TInsert>` preserves type inference; tsgo catches regressions |
| 5 | Test mock helper doesn't match all 15 patterns | Medium | Medium | Helper accepts optional params for all known variations; each file can override |
| 6 | Frontend scaffold breaks visual parity | Low | Medium | Scaffold holds ALL shared logic; variants only pass slots per Phase 2 proven pattern |
| 7 | Cross-layer circular imports | Low | High | Shared helpers in `shared/` or `__shared__/` directories; direct module imports (not barrels) |
| 8 | Full test suite timeout (learned from Phase 2) | Medium | Medium | Run tests in layer-specific batches not single monolithic command |

---

## 15. Migration Plan

- **No database migrations** — schema helpers generate Drizzle schema at runtime via `pgTable()` calls; Drizzle's migration generator sees the output, not the helper
- **No API changes** — all refactoring is internal; GraphQL schema unchanged
- **No UI changes** — all refactoring is internal; visual parity preserved
- **No config changes** — only `.jscpd.json` may need updates for justified ignores

---

## 16. Review Checklist

- [x] All layers have established patterns
- [x] New patterns (MeetingAdapterBase, BillingRepoFactory, withPageAuth, makeFileJunctionTable) have clear design with examples
- [x] Parallel execution strategy maximizes 16 subagents per phase
- [x] Quality gate per file (sub-loop.ts) integrated into every task
- [x] Knowledge propagation addresses docs, AGENTS.md, instructions
- [x] Risk analysis covers all major risks with mitigations
- [x] Constraints from AGENTS.md reflected (MUI v9, oxlint, i18n, logging, path aliases)
- [x] No re-exports policy maintained
- [x] full test suite planned (no deferral)
