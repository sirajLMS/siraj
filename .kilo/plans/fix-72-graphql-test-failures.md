# Fix 72 Failing GraphQL Integration Tests

## Summary

72 tests fail across 10 test files due to 3 distinct root causes:

1. **RLS Disabled** (65 failures, 8 test files) — `db push` disabled RLS on 11 tables
2. **Invalid InvoiceType** (5 failures, 1 test file) — `MANUAL` not in enum (ALREADY FIXED)
3. **Hardcoded classInstanceId** (2 failures, 1 test file) — (ALREADY FIXED)
4. **hoursPerWeek Float → Int serialization** (4 failures, 1 test file) — GraphQL `Int` rejects decimals

---

## Task 1: Re-enable RLS via `bun db cleanGenerate`

**Failing test files (65 failures across 8 files):**
- `status-tracking.test.ts` — 10 failures
- `student-directory-graphql.test.ts` — 4 failures
- `student-history.test.ts` — 3 failures
- `student-lifecycle.test.ts` — 6 failures
- `suggestion.test.ts` — 11 failures
- `teacher-dashboard.test.ts` — 6 failures
- `teacher-onboarding.test.ts` — 5 failures
- `teacher.test.ts` — 11 failures
- `translation.test.ts` — 5 failures

**Root cause:** `db push` disabled RLS on 11 tables (class_instances, students, invoices, complaints, learning_resources, users, notification_deliveries, user_notification_preferences, user_device_tokens, recurring_schedules, student_progress). The migration SQL files under `backend/db/migration/` contain the proper RLS policies. A `cleanGenerate` (reset → generate → migrate → seed) will restore all RLS policies.

**Fix:** Run `bun db` → choose option 8 (cleanGenerate). This:
1. Drops and recreates the database
2. Regenerates Drizzle migrations from schema
3. Applies all migrations including RLS policies
4. Re-seeds data

**After cleanGenerate:** Run `bun run generate:gqlSchema && bun codegen` to regenerate GraphQL types (the `MANUAL` enum value added in Task 2 needs to be in the fresh DB).

**Verification:** `bun test frontend/graphql/test/status-tracking.test.ts --timeout=120000` — all tests pass

---

## Task 2: Fix hoursPerWeek Float→Int in student-directory.pothos.ts

**Failing test file:** `student-directory-graphql.test.ts` — 4 failures

**Root cause:** The `hours_per_week` column is `numeric(5,2)` storing values like `0.75`, `0.5`, `1.5`. The DB trigger computes `SUM(duration_minutes)/60` which produces fractional hours. The service layer converts via `Number.parseFloat()` at `student.repository.ts:415`. But the GraphQL Pothos definition at `student-directory.pothos.ts:25` uses `t.int()` which rejects non-integer values, causing: `Int cannot represent non-integer value: 0.75`.

**Files to change:**

1. **`backend/graphql/pothos/student-directory.pothos.ts:25-26`** — Change `hoursPerWeek: t.int(...)` to `hoursPerWeek: t.float(...)`:
   ```ts
   // Before:
   hoursPerWeek: t.int({
     resolve: parent => parent.hoursPerWeek ?? 0,
   }),
   // After:
   hoursPerWeek: t.float({
     resolve: parent => parent.hoursPerWeek ?? 0,
   }),
   ```

2. **`backend/graphql/pothos/student.pothos.ts:49-51`** — Same change:
   ```ts
   // Before:
   hoursPerWeek: t.int({
     resolve: s => s.hoursPerWeek ?? 0,
   }),
   // After:
   hoursPerWeek: t.float({
     resolve: s => s.hoursPerWeek ?? 0,
   }),
   ```

3. **`frontend/graphql/sharedDocuments/student-directory.documents.ts:14`** and any document selecting `hoursPerWeek` — Change from `Int` to `Float` in generated types via codegen.

4. **`frontend/graphql/test/student-directory-graphql.test.ts:33`** — Change `expect(student.hoursPerWeek).toBeDefined()` to also accept float type.

5. Run `bun run generate:gqlSchema && bun codegen` to regenerate GraphQL types reflecting `Float` instead of `Int`.

**Verification loop:** Run tsgo → biome:check → lint until clean, then `bun test frontend/graphql/test/student-directory-graphql.test.ts --timeout=120000`

---

## Task 3: Already-complete fixes (verify after cleanGenerate)

**Already changed:**
- `shared/lib/enum.ts` — Added `MANUAL = "MANUAL"` to `InvoiceType` enum ✅
- `frontend/graphql/test/group-class.test.ts` — Replaced hardcoded `SEEDED_CLASS_INSTANCE_ID` with dynamic lookup from `dailyScheduleList` query ✅

**Post-cleanGenerate verification:**
1. `bun run generate:gqlSchema && bun codegen`
2. `bun test frontend/graphql/test/billing-management.test.ts --timeout=120000`
3. `bun test frontend/graphql/test/group-class.test.ts --timeout=120000`

---

## Execution Order

1. **Task 1 first** — `bun db cleanGenerate` (restores RLS, fixes 65 cascading failures)
2. **Task 2 second** — Fix `hoursPerWeek` Float→Int (after cleanGenerate + codegen)
3. **Task 3 last** — Verify_billing-management and group-class (already fixed, just need DB state)

## Final Verification

After all tasks, run full suite:
```bash
bun test frontend/graphql/test/ --timeout=120000
```
Expected: 228 pass, 0 fail.
