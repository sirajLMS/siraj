# Tasks: GraphQL Dev-Log Error Catching

## Document Information

- **Feature Name**: graphql-devlog-catch-errors
- **Target Directory**: `.ai/plans/graphql-devlog-catch-errors`
- **Outcome Directory**: `.ai/plans/graphql-devlog-catch-errors/outcome`
- **Version**: 1.0
- **Date**: 2026-08-19
- **Related Documents**: [Requirements](specs.md), [Design](design.md), [Research](plan.md)

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:** Before executing ANY task, read ALL existing files in `.ai/plans/graphql-devlog-catch-errors/outcome/`.
2. **Per-File Quality Verification Loop:** After modifying any file, run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (exit code 0 = pass).
3. **Semantic Review Checklist:** Before marking any subtask complete, self-review against semantic checklist (race conditions, env-config, dead code, cross-layer, enums, deferred items).
4. **Global Health Check:** Re-run `sub-loop.ts` on all modified files before marking complete.
5. **Post-Execution Outcome File:** Write `.ai/plans/graphql-devlog-catch-errors/outcome/<task-id>-outcome.md` after each task.
6. **Task Progress Tracking:** Update `[ ]` -> `[x]` in this file upon completion.

## Implementation Overview

The implementation follows a foundation-first strategy: the keystone `DomainError` → `GraphQLError` refactor (Task 1) must land before any service/repository changes that depend on it (Tasks 2-4). FK cleanup fixes (Task 5) and observability enhancements (Tasks 6-7) are independent and can proceed in parallel after Task 1. Each task includes per-file quality loop, semantic review, instruction verification, and a paired test run with Next.js devtools MCP verification.

### Implementation Strategy

- **Foundation-First**: Task 1 (DomainError refactor) is the keystone — all error-code-dependent tasks (2-4) wait for it.
- **Interleaved Tests**: Each implementation task includes its paired test assertion upgrade as a subtask.
- **MCP Verification**: After each individual test run, use Next.js devtools MCP server to confirm compilation, errors, and dev logs.
- **Full Suite Check**: After all tasks complete, run full `bun test:graphql` with log diff analysis.

### Development Approach
- **Testing Strategy**: Test-first for new assertions; existing tests are upgraded additively (no breaks).
- **Integration Strategy**: Phase-by-phase; each phase verified before advancing.
- **Deployment Strategy**: No deployment changes (backend-only, no new endpoints).

## Implementation Plan

### Task 0: Pre-Implementation Baseline (MANDATORY)

- [ ] 0. Establish error baseline and create deferred-items ledger
  - Read all existing files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Record baseline error counts:
    ```bash
    bun tsgo 2>&1 | grep "error TS" | wc -l > /tmp/baseline-tsgo.txt
    bun biome:check 2>&1 | grep -c "warn" > /tmp/baseline-biome.txt
    bun run scripts/lint-service.ts --json --id baseline > /tmp/baseline-lint.json
    ```
  - Create deferred-items ledger: `.ai/plans/graphql-devlog-catch-errors/deferred-items.md`
  - Write outcome file: `.ai/plans/graphql-devlog-catch-errors/outcome/0-baseline-outcome.md`
  - _Requirements: REQ-0_

### Task 1: Keystone — `DomainError` extends `GraphQLError` (REQ-1)

- [ ] 1.1 Refactor `DomainError` to extend `GraphQLError`
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/AGENTS.md`
  - Read applicable instructions:
    - `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - Modify `backend/lib/errors.ts`:
    - Import `GraphQLError` from `graphql`
    - Change `DomainError` to `extends GraphQLError`
    - Constructor: `super(message, { extensions: { code } })`
    - Set `this.name = new.target.name`
    - Call `Object.setPrototypeOf(this, new.target.prototype)` for ES5 prototype chain
    - Verify all subclasses (`NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `ConflictError`, `QuotaNotFoundError`, `QuotaAlreadyDeletedError`, `QuotaLedgerError`) still compile — only extends-chain changes, no constructor surface changes
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/lib/errors.ts --lifecycle codescene`
  - **Semantic Review**: Verify `instanceof Error` still holds; `err.code` still accessible; no cross-layer imports introduced
  - **Instruction Verification**: sub-loop.ts auto-discovers & prints applicable rule files; validate against them
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/1.1-domain-error-refactor-outcome.md`
  - Update progress: Mark 1.1 as `[x]`
  - _Requirements: REQ-1 (AC 1-8)_

- [ ] 1.2 Verify existing auth test still passes (smoke test)
  - Run: `bun run scripts/run-test/run-test.ts frontend/common/graphql/test/auth/auth.test.ts`
  - Verify `auth.test.ts:184` — `expect(gqlError?.extensions?.code).toBe("UNAUTHENTICATED")` still passes
  - Run: `bun run scripts/run-test/run-test.ts --last --focus "UNAUTHENTICATED" frontend/common/graphql/test/auth/auth.test.ts`
  - If it fails: investigate whether the scopeAuth `GraphQLError` throw path at `gqlSchemaBuilder.ts:156` was affected (it should NOT be — it already throws `GraphQLError` directly, not `DomainError`)
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/1.2-auth-smoke-test-outcome.md`
  - Update progress: Mark 1.2 as `[x]`
  - _Requirements: REQ-1 (AC 9)_

- [ ] 1.3 MCP verification — compile `/api/graphql` route and check logs
  - Start dev server: `bun run dev` (port 3000)
  - Call `nextjs_call(port: "3000", toolName: "compile_route", args: { routeSpecifier: "/api/graphql" })` — confirm zero issues
  - Call `nextjs_call(port: "3000", toolName: "get_compilation_issues", args: {})` — confirm zero issues across ALL routes
  - Call `nextjs_call(port: "3000", toolName: "get_errors", args: {})` — confirm no build/SSR errors
  - Call `nextjs_call(port: "3000", toolName: "get_logs", args: {})` — read dev log tail, confirm no new `[ERROR]` entries from the refactor
  - Call `nextjs_call(port: "3000", toolName: "get_routes", args: { routerType: "app" })` — confirm `/api/graphql` still registered
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/1.3-mcp-verification-outcome.md`
  - Update progress: Mark 1.3 as `[x]`
  - _Requirements: REQ-1_

### Task 2: Suggestion repository — localized NotFoundError (REQ-2)

- [ ] 2.1 Replace raw `new Error(...)` with `NotFoundError` in suggestion repository
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`
  - Read applicable instructions:
    - `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - Modify `backend/db/repo/parents/suggestion.repository.ts:261-262`:
    - Replace `throw new Error(\`Suggestion ${suggestionId} not found\`)` with `throw new NotFoundError("SUGGESTION_NOT_FOUND", tErrors.recordNotFound({ tableName: "suggestion", entityId: suggestionId }))`
    - Add `NotFoundError` import from `@/backend/lib/errors`
    - Wire `tErrors` parameter into the repository function (the existing `_locale?: string` parameter becomes a `tErrors` callback or `locale` string)
  - Update the caller in `backend/services/communication/suggestion.service.ts` to pass `tErrors` (already builds `tErrors` from `locale`)
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/db/repo/parents/suggestion.repository.ts --lifecycle codescene`
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/services/communication/suggestion.service.ts --lifecycle codescene` (if modified)
  - **Semantic Review**: No cross-layer imports; `tErrors` is a function, not raw strings; `NotFoundError` is imported as value
  - **Instruction Verification**: sub-loop.ts auto-discovers rule files; validate against them
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/2.1-suggestion-repo-outcome.md`
  - Update progress: Mark 2.1 as `[x]`
  - _Requirements: REQ-2 (AC 1-3)_

- [ ] 2.2 Upgrade suggestion test to assert `extensions.code`
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`
    - `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
  - Read applicable instructions:
    - `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
    - `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - Modify `frontend/common/graphql/test/suggestions/suggestion.test.ts`:
    - Find the "marking non-existent suggestion returns error" test case
    - Add assertion: `expect(result.error).toBeInstanceOf(CombinedGraphQLErrors)` then `expect(error.errors?.[0]?.extensions?.code).toBe("SUGGESTION_NOT_FOUND")`
    - Use the pattern from `auth.test.ts:184` as reference
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts frontend/common/graphql/test/suggestions/suggestion.test.ts --lifecycle codescene`
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/2.2-suggestion-test-outcome.md`
  - Update progress: Mark 2.2 as `[x]`
  - _Requirements: REQ-2 (AC 4)_

- [ ] 2.3 Run individual test + MCP verification
  - Run: `bun run scripts/run-test/run-test.ts frontend/common/graphql/test/suggestions/suggestion.test.ts`
  - Run: `bun run scripts/run-test/run-test.ts --last --focus "not found" frontend/common/graphql/test/suggestions/suggestion.test.ts`
  - MCP verification (dev server on port 3000):
    - `nextjs_call(port: "3000", toolName: "compile_route", args: { routeSpecifier: "/api/graphql" })` — zero issues
    - `nextjs_call(port: "3000", toolName: "get_errors", args: {})` — no new errors
    - `nextjs_call(port: "3000", toolName: "get_logs", args: {})` — confirm localized "suggestion not found" message in dev log
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/2.3-suggestion-verify-outcome.md`
  - Update progress: Mark 2.3 as `[x]`
  - _Requirements: REQ-2_

### Task 3: Schedule service — UnauthorizedError (REQ-3)

- [ ] 3.1 Replace `new Error(tErrors.unauthorizedViewMetrics)` with `UnauthorizedError`
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`
  - Read applicable instructions:
    - `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - Modify `backend/services/schedule/schedule.service.ts:117-119`:
    - Replace `throw new Error(tErrors.unauthorizedViewMetrics)` with `throw new UnauthorizedError("UNAUTHORIZED", tErrors.unauthorizedViewMetrics)`
    - Add `UnauthorizedError` import from `@/backend/lib/errors`
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/services/schedule/schedule.service.ts --lifecycle codescene`
  - **Semantic Review**: `UnauthorizedError` is imported as value; `tErrors.unauthorizedViewMetrics` is a valid translation key
  - **Instruction Verification**: sub-loop.ts auto-discovers rule files; validate against them
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/3.1-schedule-unauthorized-outcome.md`
  - Update progress: Mark 3.1 as `[x]`
  - _Requirements: REQ-3 (AC 1-2)_

- [ ] 3.2 Upgrade schedule test to assert `extensions.code === "UNAUTHORIZED"`
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`
    - `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
  - Read applicable instructions:
    - `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
    - `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - Modify `frontend/common/graphql/test/scheduling/schedule.test.ts`:
    - Find the unauthorized-role test case(s)
    - Add assertion: `expect(error.errors?.[0]?.extensions?.code).toBe("UNAUTHORIZED")`
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts frontend/common/graphql/test/scheduling/schedule.test.ts --lifecycle codescene`
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/3.2-schedule-test-outcome.md`
  - Update progress: Mark 3.2 as `[x]`
  - _Requirements: REQ-3 (AC 3)_

- [ ] 3.3 Run individual test + MCP verification
  - Run: `bun run scripts/run-test/run-test.ts frontend/common/graphql/test/scheduling/schedule.test.ts`
  - Run: `bun run scripts/run-test/run-test.ts --last --focus "UNAUTHORIZED" frontend/common/graphql/test/scheduling/schedule.test.ts`
  - MCP verification (dev server on port 3000):
    - `nextjs_call(port: "3000", toolName: "compile_route", args: { routeSpecifier: "/api/graphql" })` — zero issues
    - `nextjs_call(port: "3000", toolName: "get_errors", args: {})` — no new errors
    - `nextjs_call(port: "3000", toolName: "get_logs", args: {})` — confirm localized "unauthorized" message
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/3.3-schedule-verify-outcome.md`
  - Update progress: Mark 3.3 as `[x]`
  - _Requirements: REQ-3_

### Task 4: Recurring class validation — split into distinct error codes (REQ-4)

- [ ] 4.1 Add 3 new i18n keys for scheduling validation
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/AGENTS.md`
    - `/home/ahmed/Projects/siraj/shared/AGENTS.md`
  - Add keys to `shared/locale/types/errors/index.ts` under `SchedulingErrors`:
    - `recurringClassDaysRequired: () => string`
    - `invalidDuration: () => string`
    - `subjectRequired: () => string`
  - Implement in `shared/locale/en/errors/index.ts`:
    - `recurringClassDaysRequired: () => "At least one day is required."`
    - `invalidDuration: () => "Duration must be greater than zero."`
    - `subjectRequired: () => "Subject is required."`
  - Implement in `shared/locale/ar/errors/index.ts`:
    - `recurringClassDaysRequired: () => "يوم واحد على الأقل مطلوب."`
    - `invalidDuration: () => "يجب أن تكون المدة أكبر من صفر."`
    - `subjectRequired: () => "المادة مطلوبة."`
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts shared/locale/types/errors/index.ts --lifecycle codescene`
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts shared/locale/en/errors/index.ts --lifecycle codescene`
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts shared/locale/ar/errors/index.ts --lifecycle codescene`
  - **Semantic Review**: Keys match type schema exactly; both locales implement all keys; no hardcoded strings
  - **Instruction Verification**: sub-loop.ts auto-discovers `shared/AGENTS.md`; validate against it
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/4.1-i18n-keys-outcome.md`
  - Update progress: Mark 4.1 as `[x]`
  - _Requirements: REQ-4 (AC 4)_

- [ ] 4.2 Split validation in `recurring-class.service.ts` into 3 distinct throws
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`
  - Read applicable instructions:
    - `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - Modify `backend/services/schedule/recurring-class.service.ts:148-149`:
    - Split single `if` into three sequential checks:
      ```typescript
      if (!input.days || input.days.length === 0) {
        throw new ValidationError("RECURRING_CLASS_DAYS_REQUIRED", tErrors.recurringClassDaysRequired);
      }
      if (input.durationMinutes <= 0) {
        throw new ValidationError("INVALID_DURATION", tErrors.invalidDuration);
      }
      if (!input.subjectId) {
        throw new ValidationError("SUBJECT_REQUIRED", tErrors.subjectRequired);
      }
      ```
    - Add `ValidationError` import from `@/backend/lib/errors` (if not already imported)
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/services/schedule/recurring-class.service.ts --lifecycle codescene`
  - **Semantic Review**: All three branches reachable; no dead code; `ValidationError` imported as value
  - **Instruction Verification**: sub-loop.ts auto-discovers rule files; validate against them
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/4.2-recurring-validation-outcome.md`
  - Update progress: Mark 4.2 as `[x]`
  - _Requirements: REQ-4 (AC 1-3)_

- [ ] 4.3 Upgrade schedule test to assert distinct error codes per failure mode
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`
    - `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
  - Read applicable instructions:
    - `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`
    - `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - Modify `frontend/common/graphql/test/scheduling/schedule.test.ts`:
    - Test "denied for invalid input (no days)" → assert `error.errors?.[0]?.extensions?.code === "RECURRING_CLASS_DAYS_REQUIRED"`
    - Test "rejected when subjectId is omitted" → assert `error.errors?.[0]?.extensions?.code === "SUBJECT_REQUIRED"`
    - (Optional) Add a test for `durationMinutes <= 0` → assert code `"INVALID_DURATION"`
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts frontend/common/graphql/test/scheduling/schedule.test.ts --lifecycle codescene`
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/4.3-schedule-validation-test-outcome.md`
  - Update progress: Mark 4.3 as `[x]`
  - _Requirements: REQ-4 (AC 5-6)_

- [ ] 4.4 Run individual test + MCP verification
  - Run: `bun run scripts/run-test/run-test.ts frontend/common/graphql/test/scheduling/schedule.test.ts`
  - Run: `bun run scripts/run-test/run-test.ts --last --focus "invalid" frontend/common/graphql/test/scheduling/schedule.test.ts`
  - Run: `bun run scripts/run-test/run-test.ts --last --focus "DAYS_REQUIRED" frontend/common/graphql/test/scheduling/schedule.test.ts`
  - MCP verification (dev server on port 3000):
    - `nextjs_call(port: "3000", toolName: "compile_route", args: { routeSpecifier: "/api/graphql" })` — zero issues
    - `nextjs_call(port: "3000", toolName: "get_errors", args: {})` — no new errors
    - `nextjs_call(port: "3000", toolName: "get_logs", args: {})` — confirm distinct error codes in dev log
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/4.4-validate-verify-outcome.md`
  - Update progress: Mark 4.4 as `[x]`
  - _Requirements: REQ-4_

### Task 5: Test-helper FK-aware cleanup (REQ-5)

- [ ] 5.1 Fix `cleanupTestSuperAdmin` — delete `admin_audit_logs` before user
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`
  - Read applicable instructions:
    - `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - Modify `backend/services/system/test-helper.service.ts:141-154`:
    - Import `adminAuditLogs` from `@/backend/db/schema`
    - Add before `tx.delete(users).where(eq(users.id, userId))`:
      ```typescript
      await tx.delete(adminAuditLogs).where(eq(adminAuditLogs.actorUserId, userId));
      ```
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/services/system/test-helper.service.ts --lifecycle codescene`
  - **Semantic Review**: Delete happens within the same transaction; no race condition; `adminAuditLogs` imported as value
  - **Instruction Verification**: sub-loop.ts auto-discovers rule files; validate against them
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/5.1-cleanup-superadmin-outcome.md`
  - Update progress: Mark 5.1 as `[x]`
  - _Requirements: REQ-5 (AC 1, 3)_

- [ ] 5.2 Fix `cleanupTestEntities` — delete `class_status_events` before instances
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Modify `backend/services/system/test-helper.service.ts:367-375`:
    - Import `classStatusEvents` from `@/backend/db/schema` (and `inArray` from `drizzle-orm` if not already imported)
    - Add before `tx.delete(classInstances).where(or(...))`:
      ```typescript
      const instanceIds = (await tx.select({ id: classInstances.id }).from(classInstances)
        .where(or(eq(classInstances.studentId, studentId), eq(classInstances.teacherId, teacherId))))
        .map(r => r.id);
      if (instanceIds.length > 0) {
        await tx.delete(classStatusEvents).where(inArray(classStatusEvents.classInstanceId, instanceIds));
      }
      ```
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/services/system/test-helper.service.ts --lifecycle codescene`
  - **Semantic Review**: Delete happens within same transaction; `instanceIds` query uses the same WHERE clause as the parent delete; no race
  - **Instruction Verification**: sub-loop.ts auto-discovers rule files; validate against them
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/5.2-cleanup-entities-outcome.md`
  - Update progress: Mark 5.2 as `[x]`
  - _Requirements: REQ-5 (AC 2, 4)_

- [ ] 5.3 Add test assertion for `cleanupTestSuperAdmin === true` and `cleanupTestEntities === true`
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Add/update test assertion in the relevant GraphQL test file:
    - Assert `data.cleanupTestSuperAdmin === true`
    - Assert `data.cleanupTestEntities === true`
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <test-file> --lifecycle codescene`
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/5.3-cleanup-test-outcome.md`
  - Update progress: Mark 5.3 as `[x]`
  - _Requirements: REQ-5 (AC 5)_

- [ ] 5.4 Run individual test + MCP verification
  - Run: `bun run scripts/run-test/run-test.ts <test-helper-test-path>` (idently the test file that exercises cleanupTestSuperAdmin/cleanupTestEntities)
  - MCP verification (dev server on port 3000):
    - `nextjs_call(port: "3000", toolName: "get_logs", args: {})` — confirm no FK RESTRICT errors in dev log
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/5.4-cleanup-verify-outcome.md`
  - Update progress: Mark 5.4 as `[x]`
  - _Requirements: REQ-5_

### Task 5.5: Plan Review Gate (MANDATORY)

- [ ] 5.5 Review complete plan using @plan-review skill
  - **Input files**: `specs.md`, `design.md`, `tasks.md`
  - **Invoke**: `@plan-review` skill on complete plan
  - **Expected output**: "Plan passes all AGENTS.md rules" OR structured violation list
  - If violations found: fix all reported violations in plan files, re-run `@plan-review`, repeat until zero violations
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/plan-review-R1.md`
  - Commit patched plan files (do NOT push until implementation starts)
  - Mark complete ONLY when plan passes all checks
  - _Requirements: REQ-0 (Execution Protocol)_

### Task 6: Complaint test — verify `COMPLAINTS_NOT_FOUND` code propagation (REQ-1 + REQ-2)

- [ ] 6.1 Upgrade complaint test to assert `extensions.code === "COMPLAINTS_NOT_FOUND"`
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`
    - `/home/ahmed/Projects/siraj/frontend/AGENTS.md`
  - Modify `frontend/common/graphql/test/complaints/complaint.test.ts:394-411`:
    - "already-deleted" test → add `expect(error.errors?.[0]?.extensions?.code).toBe("COMPLAINTS_NOT_FOUND")`
    - "non-existent" test → add same assertion
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts frontend/common/graphql/test/complaints/complaint.test.ts --lifecycle codescene`
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/6.1-complaint-test-outcome.md`
  - Update progress: Mark 6.1 as `[x]`
  - _Requirements: REQ-1 (verification), REQ-2 (COMPLAINTS code)_

- [ ] 6.2 Run individual test + MCP verification
  - Run: `bun run scripts/run-test/run-test.ts frontend/common/graphql/test/complaints/complaint.test.ts`
  - Run: `bun run scripts/run-test/run-test.ts --last --focus "COMPLAINTS_NOT_FOUND" frontend/common/graphql/test/complaints/complaint.test.ts`
  - MCP verification (dev server on port 3000):
    - `nextjs_call(port: "3000", toolName: "compile_route", args: { routeSpecifier: "/api/graphql" })` — zero issues
    - `nextjs_call(port: "3000", toolName: "get_logs", args: {})` — confirm `COMPLAINTS_NOT_FOUND` code in dev log
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/6.2-complaint-verify-outcome.md`
  - Update progress: Mark 6.2 as `[x]`
  - _Requirements: REQ-1, REQ-2_

### Task 7: Quota release skip — localized warning (REQ-6)

- [ ] 7.1 Localize the quota-release-skip WARN message and add observability
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`
  - Modify `backend/services/session/class-session.service.ts:238-244`:
    - Replace raw English string with localized WARN (via `tErrors` or `getServerTranslations`)
    - Add a `warnings` field (or `extensions.warning`) to the `deleteClassInstance` response shape
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/services/session/class-session.service.ts --lifecycle codescene`
  - **Semantic Review**: Warning is non-blocking (not an error); localized; observable in GraphQL response
  - **Instruction Verification**: sub-loop.ts auto-discovers rule files; validate against them
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/7.1-quota-warning-outcome.md`
  - Update progress: Mark 7.1 as `[x]`
  - _Requirements: REQ-6 (AC 1-2)_

- [ ] 7.2 Run individual test + MCP verification
  - Run: `bun run scripts/run-test/run-test.ts frontend/common/graphql/test/scheduling/schedule.test.ts`
  - MCP verification (dev server on port 3000):
    - `nextjs_call(port: "3000", toolName: "get_logs", args: {})` — confirm localized warning, not raw English
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/7.2-quota-verify-outcome.md`
  - Update progress: Mark 7.2 as `[x]`
  - _Requirements: REQ-6 (AC 3)_

### Task 8: Meeting URL absence — observable in GraphQL result (REQ-7)

- [ ] 8.1 Add nullable `meetingUrl` field to `CreateRecurringClassResult` GraphQL type
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md`
  - Read applicable instructions:
    - `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - Add `meetingUrl: t.string({ nullable: true })` to the relevant Pothos object type in `backend/graphql/` (the `CreateRecurringClassResult` or similar)
  - Propagate the URL (or null) from `MeetingConfigSnapshotService.generateAndAttachForClassInstance` results back through `recurring-class.service.ts:316-327`
  - Change `logger.info("no provider resolved, skipping")` to `logger.warn` at `meeting-config-snapshot.ts:243` with `providerLookupReason` field
  - Run `bun run generate:gqlSchema` and `bun codegen` after schema change
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <modified-schema-file> --lifecycle codescene`
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/services/meeting/meeting-config-snapshot.ts --lifecycle codescene`
  - **Semantic Review**: `meetingUrl` nullable correctly; no race in `Promise.allSettled` propagation
  - **Instruction Verification**: sub-loop.ts auto-discovers rule files; validate against them
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/8.1-meeting-url-outcome.md`
  - Update progress: Mark 8.1 as `[x]`
  - _Requirements: REQ-7 (AC 1-4)_

- [ ] 8.2 Add test assertion for `meetingUrl === null` on non-provider path
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Add test in `frontend/common/graphql/test/scheduling/schedule.test.ts`:
    - Assert `meetingUrl === null` when no provider is configured
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts frontend/common/graphql/test/scheduling/schedule.test.ts --lifecycle codescene`
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/8.2-meeting-url-test-outcome.md`
  - Update progress: Mark 8.2 as `[x]`
  - _Requirements: REQ-7 (AC 5)_

- [ ] 8.3 Run individual test + MCP verification
  - Run: `bun run scripts/run-test/run-test.ts frontend/common/graphql/test/scheduling/schedule.test.ts`
  - MCP verification (dev server on port 3000):
    - `nextjs_call(port: "3000", toolName: "compile_route", args: { routeSpecifier: "/api/graphql" })` — zero issues after schema change
    - `nextjs_call(port: "3000", toolName: "get_compilation_issues", args: {})` — zero issues
    - `nextjs_call(port: "3000", toolName: "get_logs", args: {})` — confirm `logger.warn` with `providerLookupReason` in dev log (not `logger.info`)
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/8.3-meeting-url-verify-outcome.md`
  - Update progress: Mark 8.3 as `[x]`
  - _Requirements: REQ-7_

### Task 9: Silent 400 responses investigation (REQ-8)

- [ ] 9.1 Investigate the four mysterious 400 HTTP responses
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/AGENTS.md`
    - `/home/ahmed/Projects/siraj/app/AGENTS.md`
  - Reproduce by running the test suite with dev server log capture
  - Inspect what queries the test was issuing in those four requests
  - Identify root cause: persisted-query miss, depth-limit violation, or constraint directive
  - Fix either the test client (if test-side issue) or surface as proper `GraphQLError` with `extensions.code` (if server-side)
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts <modified-file> --lifecycle codescene` per modified file
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/9.1-silent-400-investigation-outcome.md`
  - Update progress: Mark 9.1 as `[x]`
  - _Requirements: REQ-8 (AC 1-4)_

### Task 10: Notification dropped-payload structured warnings (REQ-9)

- [ ] 10.1 Structurize the "dropped contactless payloads" WARN with channel type
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`
  - Modify `backend/services/notification/notification-dispatch.helpers.ts:241-246`:
    - Include missing channel type in WARN message (e.g., "missing email for user X")
    - Add `skippedNotificationsByType` to the return shape of `dispatchWithPreferences`
  - Surface `skippedNotificationsByType` on dispatch-affecting mutations (`submitComplaint`, `cancelClassInstance`) when test-mode env flag is set
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/services/notification/notification-dispatch.helpers.ts --lifecycle codescene`
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/10.1-notification-structured-outcome.md`
  - Update progress: Mark 10.1 as `[x]`
  - _Requirements: REQ-9 (AC 1-2)_

- [ ] 10.2 Run individual test + MCP verification
  - Run: `bun run scripts/run-test/run-test.ts frontend/common/graphql/test/notifications/notifications.test.ts` (or relevant notification test)
  - MCP verification (dev server on port 3000):
    - `nextjs_call(port: "3000", toolName: "get_logs", args: {})` — confirm structured WARN with channel type
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/10.2-notification-verify-outcome.md`
  - Update progress: Mark 10.2 as `[x]`
  - _Requirements: REQ-9 (AC 3)_

### Task 11: Rate limit test-enforceable bypass (REQ-10)

- [ ] 11.1 Add `TEST_ENFORCE_RATE_LIMIT` env flag handling
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Read applicable AGENTS.md:
    - `/home/ahmed/Projects/siraj/AGENTS.md`
    - `/home/ahmed/Projects/siraj/app/AGENTS.md`
  - Modify `backend/lib/ratelimit.ts` (or wherever the dev-mode bypass lives):
    - Add `TEST_ENFORCE_RATE_LIMIT=1` env flag check
    - When flag is set, enforce rate limits even in test mode (no dev bypass)
  - Add a new GraphQL test that fires enough requests to trip the 429 path and asserts `extensions.code: "RATE_LIMIT_EXCEEDED"`
  - **Quality Loop**: `bun run scripts/health/sub-loop.ts backend/lib/ratelimit.ts --lifecycle codescene`
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/11.1-rate-limit-outcome.md`
  - Update progress: Mark 11.1 as `[x]`
  - _Requirements: REQ-10 (AC 1-3)_

### Task 12: Full `bun test:graphql` run + Next.js devtools MCP final check

- [ ] 12.1 Run full GraphQL test suite with log capture
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
  - Ensure dev server is running on port 3000
  - Run: `bun run test:graphql 2>&1 | tee graphql_tests_logs/dev-post-fix.log`
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/12.1-full-test-run-outcome.md`
  - Update progress: Mark 12.1 as `[x]`

- [ ] 12.2 MCP final verification of the full run
  - Call `nextjs_call(port: "3000", toolName: "get_errors", args: {})` — confirm zero build/SSR/global errors after full suite
  - Call `nextjs_call(port: "3000", toolName: "get_compilation_issues", args: {})` — confirm zero compilation issues across ALL routes
  - Call `nextjs_call(port: "3000", toolName: "compile_route", args: { routeSpecifier: "/api/graphql" })` — warm-compile check, zero issues
  - Call `nextjs_call(port: "3000", toolName: "get_logs", args: {})` — read full dev server log, compare against original `dev.log`
  - Call `nextjs_call(port: "3000", toolName: "get_routes", args: { routerType: "app" })` — confirm all routes intact
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/12.2-mcp-final-verify-outcome.md`
  - Update progress: Mark 12.2 as `[x]`

- [ ] 12.3 Log diff analysis — compare original vs post-fix dev logs
  - Run:
    ```bash
    diff <(grep -E '\[ERROR\]|\[WARN\]' graphql_tests_logs/dev.log) \
         <(grep -E '\[ERROR\]|\[WARN\]' graphql_tests_logs/dev-post-fix.log) \
         | head -200
    ```
  - Confirm:
    - Issues 1-6: `[ERROR]` lines — **removed**
    - Issue 7: quota-release WARN — **changed to localized message**
    - Issue 8: `no provider resolved` INFO → WARN with `providerLookupReason` — **changed**
    - Issue 9: Four 400 responses — **removed or explained**
    - Issue 10: dropped-payload WARN — **structured with channel type**
    - Issue 11: Provider errors — **unchanged** (expected)
    - Issue 12: Rate limit WARN — **unchanged** unless `TEST_ENFORCE_RATE_LIMIT` test ran
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/12.3-log-diff-outcome.md`
  - Update progress: Mark 12.3 as `[x]`

- [ ] 12.4 Final quality gate
  - Run:
    ```bash
    bun run generate:gqlSchema
    bun codegen
    bun quality-gate
    ```
  - Expected: all stages pass clean
  - Write outcome: `.ai/plans/graphql-devlog-catch-errors/outcome/12.4-quality-gate-outcome.md`
  - Update progress: Mark 12.4 as `[x]`

### Task 13: Knowledge Propagation & Documentation (MANDATORY Final Task)

- [ ] 13. **Knowledge Propagation & Documentation**
  - Read all outcome files in `.ai/plans/graphql-devlog-catch-errors/outcome/` to synthesize all learnings
  - Create canonical reference doc under `docs/graphql/domain-error-extensions-code.md` consolidating patterns, rules, and gotchas from all outcome files
    - Follow docs file structure: Why → Pattern → Rules → Anti-patterns → Rollout Summary → Related Documents
  - Update layer AGENTS.md files with layer-specific rules/decisions (no implementation details) and a one-line doc reference:
    - `backend/graphql/AGENTS.md` — add rule: "DomainError subclasses extend GraphQLError to propagate extensions.code; See `docs/graphql/domain-error-extensions-code.md`"
    - `backend/AGENTS.md` — add cross-reference if needed
  - Update `.agents/instructions/backend.instructions.md` with rules/decisions only and a one-line doc reference
  - Update root `AGENTS.md` Important References section with: `- docs/graphql/domain-error-extensions-code.md - DomainError → GraphQLError extensions.code propagation pattern`
  - Run global check: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified file (exit code 0)
  - Write outcome file: `.ai/plans/graphql-devlog-catch-errors/outcome/13-knowledge-propagation-outcome.md`
  - Update progress: Mark 13 as `[x]`
  - _Requirements: Knowledge propagation protocol_

### Domain-to-Artifacts Mapping (Reference for Knowledge Propagation)

| Plan Domain | Docs Subdir | AGENTS.md to Update | Instructions to Update |
|---|---|---|---|
| GraphQL / Pothos | `docs/graphql/` | `backend/graphql/AGENTS.md`, `backend/graphql/pothos/AGENTS.md`, `frontend/common/graphql/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| Backend services | `docs/services/` | `backend/services/AGENTS.md`, `backend/AGENTS.md` | `.agents/instructions/backend.instructions.md` |
| i18n / locale | `docs/i18n/` | `shared/AGENTS.md` | — |
| Testing (GraphQL) | `docs/testing/` | `scripts/run-test/AGENTS.md` | `.agents/instructions/tests.instructions.md` |

### Deferred Items Enforcement (BLOCKING — Task 12 prerequisite)

- All deferred items MUST be resolved (status = ✅ Done) with verification references
- Any ❌ Blocked or ⚠️ Partial items MUST be completed or have explicit target tasks created
- Run: `grep -c "❌\|⚠️" .ai/plans/graphql-devlog-catch-errors/deferred-items.md` — expected: 0
- If >0: Task 12 is BLOCKED — resolve all items before proceeding
