# Plan Review — Round 1

**Date**: 2026-08-19  
**Reviewer**: Copilot CLI (plan-review skill)  
**Plan Files Reviewed**: `specs.md`, `design.md`, `tasks.md`  
**Affected Layers**: `backend/lib/`, `backend/services/`, `backend/db/repo/`, `backend/db/test/`, `backend/graphql/`, `frontend/common/graphql/`, `shared/locale/`

## Affected Layer AGENTS.md Files Read

| Layer | AGENTS.md | Status |
|-------|-----------|--------|
| Root | `AGENTS.md` | ✅ Read |
| Backend Services | `backend/services/AGENTS.md` | ✅ Read |
| Backend GraphQL | `backend/graphql/AGENTS.md` | ✅ Read |
| Backend DB Repo | `backend/db/repo/AGENTS.md` | ✅ Read |
| Backend DB Test | `backend/db/test/AGENTS.md` | ✅ Read |
| Backend Types | `backend/types/AGENTS.md` | ✅ Read |
| Frontend GraphQL | `frontend/common/graphql/AGENTS.md` | ✅ Read |
| Shared | `shared/AGENTS.md` | ✅ Read |

## Cross-Cutting Dimension Checks

### 1. Type Imports

- **Rule**: All types must come from `@/backend/types/{entity}.types.ts` — no local type definitions in Pothos or other layers.
- **Plan Status**: ✅ **PASS**
- The plan's design.md mentions Component 1 (`DomainError`) which modifies `backend/lib/errors.ts` — this is NOT a type file, it's a runtime class. No new type definitions are introduced.
- The plan's ErrorCode const enum in design.md line 246-258 proposes `shared/types/errorCodes.ts` — but this is marked as "(or inline in backend/lib/errors.ts)". The plan should clarify this is optional. No violation — the inline option avoids a shared/ placement.
- Design.md Component 2 mentions `NotFoundError` as a dependency from `@/backend/lib/errors` — this is correct (runtime value import, not a type).

### 2. Service Boundaries

- **Rule**: Server Components call services directly; Client Components use Apollo hooks. Repositories are strictly for data access — no business logic.
- **Plan Status**: ✅ **PASS**
- The plan correctly keeps `NotFoundError` throws in the repository layer (suggestion.repository.ts) and `UnauthorizedError`/`ValidationError` throws in the service layer (schedule.service.ts, recurring-class.service.ts).
- No business logic is being added to repositories.
- The FK cleanup fix (Task 5) correctly adds child-row deletes within the existing `tx` transaction in `test-helper.service.ts` — service-layer, not repo layer.

### 3. MUI v9

- **Rule**: Style props are NOT valid on MUI components — must use `sx` prop.
- **Plan Status**: ✅ **PASS** (N/A)
- The plan is backend-only — no MUI components are modified. Specs.md line 393-395 explicitly states: "This feature is backend-only. No new routes, sidebar items, or UI components are introduced."

### 4. i18n / Localized Errors

- **Rule**: All user-facing error messages must use the compile-time TypeScript translation system in `shared/locale/`. Never hardcode error strings. Services use `getServerTranslations(locale, "<namespace>")` from `@/shared/locale/server-graphql`. GraphQL resolvers use `ctx.t("namespace")`.
- **Plan Status**: ✅ **PASS** (with 1 note)
- Task 4.1 correctly adds 3 new i18n keys to `shared/locale/types/errors/index.ts` and implements in both `en/errors/index.ts` and `ar/errors/index.ts`.
- Task 4.2 uses `tErrors.recurringClassDaysRequired` — correctly imports the compiled translation function, not hardcoded strings.
- Task 2 (suggestion repository) uses `tErrors.recordNotFound(...)` — existing translation key.
- Task 3 (schedule service) uses `tErrors.unauthorizedViewMetrics` — existing key.
- **NOTE**: Task 7.1 (quota release skip) says "Replace raw English string with localized WARN (via `tErrors` or `getServerTranslations`)". This is slightly vague — implementation should use whichever function is available at the call site in `class-session.service.ts`. Not a violation — the plan correctly identifies the module path.

### 5. Logging

- **Rule**: Never `console.*` — must use `logger` from `@/frontend/utils/logger` or `@/backend/lib/logger`.
- **Plan Status**: ✅ **PASS**
- Task 7.2 references `import { logger } from "@/backend/lib/logger"` — correct.
- Task 8.1 changes `logger.info` to `logger.warn` — correct use of the existing logger.
- Task 8.2 references `spyOn(logger, "warn")` — correct mock pattern.
- Task 10.1 references the notification-dispatch helpers WARN — the existing code already uses logger.

### 6. Test Conventions

- **Rule**: Database tests must use `runInRollback`, pass `tx`, no `expect().rejects.toThrow()` inside `runInRollback`. Use try/catch helper pattern.
- **Plan Status**: ✅ **PASS**
- Design.md Three-Layer Test Architecture (lines 369-422) correctly documents:
  - DB layer: `expectRepoError` try/catch pattern (NOT `rejects.toThrow`)
  - DB layer: `runInRollback` wrapper mandatory
  - DB layer: `entity-setup.ts` helpers for test data
  - Service layer: `spyOn` mocks, no live DB
  - GraphQL layer: `testClient`, `CombinedGraphQLErrors.is()`
- Task 1.3 creates `backend/lib/domain-error.test.ts` — this is a unit test for a pure class, does NOT need `runInRollback` (no DB access). ✅ Correct.
- Task 5.3 uses `runInRollback` for FK cleanup tests. ✅ Correct.
- Task 5.3 line 537: "no `rejects.toThrow()` inside rollback" — ✅ correctly documented.
- Task 4.3 service test uses `let errorCaught` try/catch pattern. ✅ Correct.

### 7. GraphQL Documents

- **Rule**: Named `{Entity}QueryDocument`/`{Entity}MutationDocument`, must include `id` field, import from `@apollo/client/react`.
- **Plan Status**: ✅ **PASS** (N/A — no new documents)
- The plan does not create new GraphQL documents. All test mutations use existing documents already in `sharedDocuments/`.
- Task 8.1 adds a nullable `meetingUrl` field to an existing GraphQL type — this requires `bun run generate:gqlSchema` + `bun codegen` which the plan correctly includes (Task 8.1 line 716).

### 8. Barrel File Conventions

- **Rule**: Shortest import path, `export *` preferred, `./` not `@/` in barrels, max one `/` per path.
- **Plan Status**: ✅ **PASS** (N/A — no barrel changes proposed)
- No new barrel files are created by the plan. New test files are test files, not barrel modules.

### 9. Shared Layer Isolation

- **Rule**: `shared/` must never import from `@/frontend/**`, `@/backend/**`, or `@/app/**`.
- **Plan Status**: ✅ **PASS**
- Task 4.1 only adds keys to `shared/locale/types/errors/index.ts` and implementations in `shared/locale/en/errors/index.ts` and `shared/locale/ar/errors/index.ts`. No cross-layer imports.

### 10. Error Class Location

- **Rule**: Service-layer `.types.ts` files are prohibited. All types live in `backend/types/`.
- **Plan Status**: ✅ **PASS**
- `backend/lib/errors.ts` is NOT a `.types.ts` file — it's a runtime class definition. The plan correctly modifies this file without introducing a prohibited `.types.ts` in the service layer.

### 11. Pothos Enum Registration

- **Rule**: GraphQL enums must be backed by real TypeScript enums in `backend/enum/`. No hardcoded enum literals in Pothos files.
- **Plan Status**: ✅ **PASS** (N/A)
- The plan does not introduce any new GraphQL enums. Error codes like `"SUGGESTION_NOT_FOUND"`, `"UNAUTHORIZED"`, `"RECURRING_CLASS_DAYS_REQUIRED"` are runtime string constants passed as constructor arguments — they are NOT GraphQL enums.

### 12. Rate Limit / Auth Patterns

- **Rule**: Login resolver cold-start resilience — rate limiter operations use fail-open try/catch.
- **Plan Status**: ✅ **PASS**
- Task 11 (rate limit test-enforceable bypass) only adds a `TEST_ENFORCE_RATE_LIMIT` env flag to allow test-mode enforcement. It does not change the production rate limiter or the cold-start resilience patterns.

## Findings

### Violations Found: 0

No AGENTS.md rule violations found.

### Notes (Non-Blocking — for implementation awareness)

1. **Design.md line 131**: References "Apollo Server 4" in the Technology Stack table but the Technical Details confirm Apollo Server v5.5.1. The table description is slightly stale but the architecture decisions (Strategy B) are correct for v5.5.1. **Non-blocking** — the specs.md and tasks.md correctly reference v5.5.1.

2. **Design.md line 246-258 (ErrorCode const enum)**: The design proposes an optional `shared/types/errorCodes.ts` const enum. This is NOT a violation (shared/ can export types), but the implementation should decide between:
   - Inline in `backend/lib/errors.ts` (simpler, no shared/ placement)
   - `shared/types/errorCodes.ts` (if frontend also needs the codes for type-safe switch statements)
   
   The plan leaves this as an implementation decision — acceptable.

3. **Task 7.1 quota-release-skip**: The plan mentions "localized WARN (via `tErrors` or `getServerTranslations`)" — implementation should verify which translation function is available at the call site in `class-session.service.ts`. If the service already has `tErrors` in scope, use it directly.

4. **Task 5.3 test-helper.service.test.ts**: The plan correctly chooses `runInRollback` (not `spyOn` mocks) because FK cleanup involves live FK constraints. The implementation should use entity-setup helpers to create test audit log rows and class status events within the transaction.

5. **REQ-8 (Silent 400 responses)**: The task correctly identifies this as an investigation task — the root cause is unknown at planning time. The plan handles this correctly by making Task 9.1 an investigation with conditional fix. No AGENTS.md violation.

6. **Specs.md REQ-1 assumption (line 98)**: Says "Apollo Server 4 preserves `extensions`" — should say "Apollo Server v5.5.1". This is a minor documentation error that doesn't affect the architectural decision (Strategy B works on both v4 and v5.5.1). **Non-blocking**.

## Verdict

✅ **Plan passes all AGENTS.md rules for affected layers.**

The plan is well-structured, layer-compliant, and correctly follows:
- Type import conventions (no local types in Pothos/service layers)
- Service boundary rules (repos for data access, services for business logic)
- i18n rules (compile-time TypeScript system, no hardcoded strings)
- Logging rules (logger, not console)
- Test conventions (runInRollback, try/catch pattern, entity-setup helpers)
- GraphQL document conventions (no new documents needed)
- Barrel file conventions (no barrel changes needed)
- Shared layer isolation (no cross-layer imports from shared/)

The plan is approved for implementation. Proceed to Task 0 (baseline) → Task 1 (DomainError keystone).
