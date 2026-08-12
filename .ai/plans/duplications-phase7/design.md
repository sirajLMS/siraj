# Design: Code Duplication Elimination — Phase 7

**Feature:** Phase 7 — Within-File Clones, Cross-Layer Utilities & Residual Sweep
**Version:** 1.0
**Date:** 2026-08-11

---

## 1. Architecture Overview

Phase 7 introduces a new refactoring pattern not used in Phases 1-6: **within-file local helper extraction**. All prior phases address cross-file duplication by creating shared modules. Phase 7 addresses within-file duplication where a single file contains two or more sections that duplicate each other.

### 1.1 Refactoring Patterns

| Pattern | When to Use | Approach |
|---------|-------------|----------|
| **Local helper extraction** | Within-file clone — two sections in the same file duplicate logic | Extract a `function` (or `const`) at module scope within the same file; both sections call it |
| **Local component extraction** | Within-file clone — two JSX blocks in the same `.tsx` file render similar UI | Extract a small presentational component within the same file; both sections use it |
| **Config array consolidation** | Within-file clone — repeating config blocks (e.g., `navigationConfig.ts`) | Extract a `make<Type>Config(...)` factory that generates each block from parameters |
| **Type signature consolidation** | Within-file clone — repeating type definitions | Extract a shared `interface` or `type` at module scope; both sections use it |
| **Shared module extraction** | Within-file clone that is structural / by-design | Extract shared logic into a module-level helper or a separate shared module — every clone is truly resolved, never ignored |
| **Cross-layer inheritance** | Cross-layer utility duplication (enum, logger) | Shared layer defines base class/interface; frontend extends or re-exports |
| **Cross-layer shared extraction** | Cross-layer utility duplication (enum, logger) | Extract runtime-agnostic shared logic into `shared/` module; both implementations import it. No jscpd:ignore allowed. |

### 1.2 Layer-Specific Concerns

| Layer | Within-File Clone Pattern | Constraints |
|-------|--------------------------|-------------|
| `backend/graphql/` | Repeating Pothos field blocks in the same file | Use `_*Fields(t, ...)` helper factory within the file (Phase 4 pattern, applied locally) |
| `backend/graphql/mutation/` | Repeating mutation field definitions | Extract `_<action>Fields(t, ...)` local helper |
| `backend/graphql/query/` | Repeating query resolver blocks | Extract `_<entity>QueryFields(t, ...)` local helper |
| `frontend/.../*.tsx` | Repeating JSX sections | Extract local presentational component within the file |
| `frontend/.../*.ts` (config) | Repeating config objects | Extract `makeXConfig(params)` factory |
| `frontend/.../types.ts` | Repeating type definitions | Extract shared `interface` at module scope |
| `shared/locale/**/*.ts` | Repeating error translation/type signatures | Fix via local extraction (shared type signatures, repeating translation patterns) — no jscpd:ignore |

---

## 2. Component Design

### 2.1 Within-File Clone Triage Flow

```
For each of 17 within-file clone pairs:
  1. Read the file and identify the two duplicated sections (line ranges from jscpd)
  2. Determine: Are the sections identical, or do they differ only in data?
     - Identical → extract local helper, both sections call it
     - Differ in data → extract factory function with parameters
     - Structurally different but same shape → extract shared helper anyway (same pattern as all other clones)
  3. Apply the fix
  4. Run sub-loop.ts --lifecycle codescene on the file
  5. Verify jscpd no longer reports the pair
```

### 2.2 Cross-Layer Utility Evaluation

```
For each of 2 cross-layer utility pairs (enum.ts, logger):
  1. Analyze the type sources and runtime dependencies of each implementation
  2. Extract the runtime-agnostic shared logic into a `shared/` module that both can import:
     - enum.ts: Extract generic parsing helpers into `shared/lib/enum-core.ts`
     - logger: Extract pure config logic (isLoggingEnabled, resolveLogLevel) into `shared/lib/logger/config.ts`
  3. Both implementations import from the new shared module and use the shared logic
  4. Run sub-loop.ts --lifecycle codescene on all modified files
  5. Respect dependency-cruiser rules:
     - shared/ must NOT import from frontend/backend/app
     - frontend imports from shared via @/shared/lib/... is allowed
```

### 2.3 Residual Sweep Flow

```
After Phase 7 within-file and cross-layer tasks are complete:
  1. Run bun check:duplicates
  2. Compare results to the Phase 4/5/6 baseline (504 clones, 68,194 tokens)
  3. Identify any remaining unaddressed clones
  4. Triage each into:
     - "fix" → extract shared code to eliminate the clone (create a task or fix immediately)
     - "defer" → document in deferred-items.md with a real extraction plan for a future phase
     - NEVER use jscpd:ignore — every clone must be truly solved by code extraction
  5. Write final outcome report
```

---

## 3. Detailed Design: Within-File Clones

### 3.1 Backend Within-File Clones (3 pairs, 232 tokens)

#### 3.1.1 `backend/graphql/mutation/billing/payment-method.mutation.ts` (75 tokens)
- **Clone:** Lines 150-160 ↔ lines 165-175 — repeating mutation field definitions
- **Fix:** Extract `makePaymentMethodMutationFields(t, ...)` local helper (no leading underscore — oxlint `no-underscore-dangle`) or evaluate if `__shared__/` field factory pattern (per `backend/graphql/AGENTS.md` "Pothos Field Factories") is more appropriate
- **Risk:** Low — same file, no import changes
- **Note:** Per `backend/graphql/AGENTS.md`, completed field factory extractions use `__shared__/` modules (e.g., `paymentFields`, `creditTransactionFields`). If the within-file pattern matches an existing `__shared__/` factory, prefer extending that factory over a local function. Only use a local function if the duplication is truly file-local.

#### 3.1.2 `backend/graphql/pothos/scheduling/recurring-schedule.pothos.ts` (77 tokens)
- **Clone:** Lines 26-35 ↔ lines 44-53 — repeating Pothos field blocks
- **Fix:** Extract `makeRecurringScheduleFields(t, ...)` local helper (no leading underscore — oxlint `no-underscore-dangle`)
- **Risk:** Low
- **Note:** Same `__shared__/` evaluation as §3.1.1

#### 3.1.3 `backend/graphql/query/scheduling/schedule.query.ts` (80 tokens)
- **Clone:** Lines 162-171 ↔ lines 193-202 — repeating query resolver blocks
- **Fix:** Extract `makeScheduleQueryFields(t, ...)` local helper (no leading underscore — oxlint `no-underscore-dangle`)
- **Risk:** Low
- **Note:** Same `__shared__/` evaluation as §3.1.1

### 3.2 Frontend Within-File Clones (7 pairs, 1,083 tokens)

#### 3.2.1 `frontend/common/views/dashboard/config/navigationConfig.ts` (342 tokens — largest)
- **Clones:** Lines 157-185 ↔ lines 578-606 (102 tokens) AND lines 253-318 ↔ lines 727-792 (240 tokens)
- **Pattern:** Repeating nav config blocks for different route groups
- **Fix:** Extract `makeNavConfig(params)` factory that generates each nav block from parameters (icon, label key, href, children)
- **Risk:** Medium — 1,108-line file with many config entries; verify no visual changes

#### 3.2.2 `frontend/common/views/dashboard/classes/details/useClassDetailsLabels.ts` (164 tokens)
- **Clone:** Lines 104-127 ↔ lines 199-222 — repeating label lookup blocks
- **Fix:** Extract `makeDomainLabelLookup(record)` local helper (no leading underscore — oxlint `no-underscore-dangle`)
- **Risk:** Low — utility hook file

#### 3.2.3 `frontend/common/views/dashboard/billing/components/InvoicePaymentDetailsDialog.tsx` (142 tokens)
- **Clone:** Lines 194-218 ↔ lines 399-423 — repeating payment detail sections
- **Fix:** Extract `<PaymentDetailSection .../>` local presentational component within the file
- **Risk:** Medium — 893-line dialog component; verify rendering unchanged

#### 3.2.4 `frontend/mobile/views/dashboard/students/quota/components/contextualHelperCards.mobile.tsx` (83 tokens)
- **Clone:** Lines 22-42 ↔ lines 63-83 — repeating helper card components
- **Fix:** Extract `<ContextualHelperCard .../>` local presentational component
- **Risk:** Low — 103-line mobile component

#### 3.2.5 `frontend/common/views/dashboard/admin/parents/students/types.ts` (76 tokens)
- **Clone:** Lines 34-47 ↔ lines 54-67 — repeating type definitions
- **Fix:** Extract shared `interface` at module scope
- **Risk:** Low — 79-line types file

#### 3.2.6 `frontend/common/views/dashboard/resources/types/resourcesTypes.ts` (76 tokens)
- **Clone:** Lines 75-87 ↔ lines 87-99 — repeating type definitions
- **Fix:** Extract shared `interface` at module scope
- **Risk:** Low — 114-line types file

### 3.3 shared/locale Within-File Clones (7 pairs, 700 tokens)

These are within-file clones in `shared/locale/` files.

**Phase 7 disposition:**
- These 7 within-file clones are fixed via local extraction within each file — no `.jscpd.json` ignore patterns are used.
- For `shared/locale/types/errors/index.ts`: extract repeating error type signatures into a shared local helper function at module scope.
- For `shared/locale/ar/errors/index.ts` and `shared/locale/en/errors/index.ts`: extract repeating Arabic/English error translation patterns into a shared local builder function.
- For `shared/locale/types/dashboard/parents/onboarding.ts`: extract repeating onboarding type signatures into a shared local helper.
- **No jscpd:ignore directives are allowed.** Every clone is truly resolved by code extraction.

---

## 4. Detailed Design: Cross-Layer Utility Pairs

### 4.1 `frontend/common/lib/enum.ts` ↔ `shared/lib/enum.ts` (84 tokens)

**Analysis:**
- `frontend/common/lib/enum.ts` (348 lines): Imports GraphQL codegen types, defines local `BookingStatus` type (not enum), `IanaTimezone` type alias, `parseBookingStatus`, `parseIanaTimezone`, etc. Browser-oriented.
- `shared/lib/enum.ts` (263 lines): Imports `@/shared/constants`, defines `BookingStatus` enum, `IanaTimezone` type, `parseBookingStatus`, `parseIanaTimezone`. Node.js + shared environment.

**Duplicated section (84 tokens):** The overlap is in shared parsing functions (`parseBookingStatus`, `parseIanaTimezone`, etc.) that have the same logic but different type imports.

**Approach: Extract runtime-agnostic parsing logic into `shared/lib/enum-core.ts`.**
- The duplicated parsing functions (like `parseBookingStatus`, `parseIanaTimezone`) have identical logic — they differ only in the type sources used for the enum/value arrays.
- Extract a generic `parseEnumValue<T>(value: string, validValues: readonly string[], fallback: T): T` function and similar pure parsing helpers into `shared/lib/enum-core.ts`.
- `shared/lib/enum.ts` imports from `enum-core.ts` and uses it with its enum types.
- `frontend/common/lib/enum.ts` imports from `@/shared/lib/enum-core` and uses it with its GraphQL codegen types.
- This respects `shared/` layer isolation (no frontend imports) and eliminates the duplication by extracting the truly shared logic.

### 4.2 `frontend/common/lib/logger/index.ts` ↔ `shared/lib/logger/base-logger.ts` (79 tokens)

**Analysis:**
- `frontend/common/lib/logger/index.ts` (263 lines): `ClientLogger` class with browser APIs (fetch, `/api/logs` endpoint, `sessionId`, `NEXT_PUBLIC_ENABLE_LOGGING`).
- `shared/lib/logger/base-logger.ts` (99 lines): `BaseLogger` abstract class with Node.js APIs (`fs/promises`, `process.cwd`, `ENABLE_LOGGING`).

**Duplicated section (79 tokens):** The overlap is in the log-level configuration and the `enabled` flag logic.

**Approach: Extract pure config logic into `shared/lib/logger/config.ts`.**
- The duplicated `isLoggingEnabled` / log-level configuration logic does NOT depend on `fs/promises` — it is pure string/boolean logic based on env vars.
- Extract `isLoggingEnabled(envFlag: string | undefined): boolean` and `resolveLogLevel(level: string): LogLevel` into `shared/lib/logger/config.ts`.
- `shared/lib/logger/base-logger.ts` imports from `config.ts` and uses it.
- `frontend/common/lib/logger/index.ts` imports from `@/shared/lib/logger/config` and uses it with its browser-specific `NEXT_PUBLIC_ENABLE_LOGGING` env var.
- This respects `shared/` layer isolation and eliminates the duplication by extracting the shared pure logic.

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Within-file extraction changes behavior | Low | Medium | Semantic review checklist per task; 12-point checklist |
| Cross-layer utility consolidation breaks imports | Medium | High | Extract only runtime-agnostic logic to `shared/`; respect dependency-cruiser rules (shared never imports frontend) |
| Phase 6 locale ignore not yet implemented | Medium | Low | Phase 7 fixes locale clones via local extraction regardless of Phase 6 status |
| Residual sweep finds new clones from Phase 4/5/6 refactoring | Medium | Low | Triage into fix/defer — always fix by extracting shared code, never ignore |
| `navigationConfig.ts` extraction breaks nav rendering | Medium | High | Semantic review; careful parametric factory design |
| `InvoicePaymentDetailsDialog.tsx` extraction breaks dialog | Medium | High | Visual review checklist; extract as presentational component with slotProps |
| Frontend cross-tier dependency violation | Medium | High | Respect ESLint `no-restricted-imports` on `.mobile.tsx`/`.desktop.tsx` files; move shared code to `frontend/common/` so mobile/desktop import from common |

---

## 6. Verification Strategy

Every modified file passes through the **per-file verification loop**:

```bash
bun run scripts/health/sub-loop.ts <file> --lifecycle codescene
```

This runs (in strict order, short-circuiting on failure):
1. `bun tsgo` — TypeScript type checking
2. `bun run oxlint` — Fast linter (type-aware)
3. `bun biome:check` — Biome lint + format
4. `bun run scripts/lint-service.ts -f <file>` — ESLint with sonarjs rules
5. `bun check:duplicates` — jscpd clone detection
6. `bun run codescene --file <file>` — Code health metrics

All are read-only static analysis — no Next.js server, no GraphQL, no UI runtime, no database.

**No other tests are run.** The No-Server-Tests Policy is absolute (see Requirements §3).
