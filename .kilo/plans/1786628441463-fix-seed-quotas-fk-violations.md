# Fix DB Seed: Demo Quota & On-Demand Schedule Foreign Key Violations

## Problem

`bun db seed` completes but logs two WARN-level foreign key violations from `backend/db/seeds/billing/seed-quotas.ts`:

1. `quotas_student_id_students_id_fkey` — `student_id` not in `students`
2. `recurring_schedules_student_id_students_id_fkey` — `student_id` not in `students`

Both are caused by hardcoded redacted placeholder UUIDs at the top of the seeder:

```ts
const DEMO_STUDENT_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const DEMO_TEACHER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
```

These literal strings never match any real row, so every insert violates the FK constraint. The seeder swallows the errors in `try/catch` (logs WARN, continues), which is why the overall seed reports "success" — but the demo quotas and on-demand recurring schedule are silently never created.

## Root Cause

`seedOrGetQuotas()` is the **only** seeder called with no arguments from the master controller (`backend/db/seeds/index.ts:404`):

```ts
await step("quotas", () => seedOrGetQuotas());
```

Every other seeder receives `context.students` / `context.teachers` and resolves real IDs (e.g. `seed-class-instances.ts:32` uses `studentsList[0]` as the demo student). The quota seeder was never wired to context, so it fell back to hardcoded UUIDs that were later redacted (likely by a secret-scanning tool) into invalid placeholders.

## Fix

Wire `seed-quotas.ts` to the seed context, matching the established pattern in every sibling seeder.

### Changes

#### 1. `backend/db/seeds/billing/seed-quotas.ts`

- Remove the two hardcoded `DEMO_STUDENT_ID` / `DEMO_TEACHER_ID` constants.
- Change the signature to accept context entities:
  ```ts
  export async function seedOrGet(
    students: StudentSelectType[],
    teachers: TeacherSelectType[]
  ): Promise<QuotaReturnType[]>
  ```
- Resolve demo IDs from the passed arrays (consistent with `seed-class-instances.ts`):
  ```ts
  const demoStudent = students[0];
  const demoTeacher = teachers[0];
  if (!demoStudent || !demoTeacher) {
    logger.info("Quota seeding skipped: demo student/teacher not available.");
    return [];
  }
  ```
- Use `demoStudent.id` in all three `quotaInputs` entries and in `seedOnDemandSchedule`.
- Pass `demoTeacher.id` / `demoStudent.id` into `upsertManyRecurringSchedules`.
- Keep the existing `try/catch` graceful-degradation behavior (idempotent re-runs must not hard-fail), but the FK violations will no longer occur because the IDs now resolve to real rows.
- Import `StudentSelectType`, `TeacherSelectType`, `QuotaReturnType` from `@/backend/types`.
- Keep `ON_DEMAND_SUBJECT_SLUG = "tajweed"` constant as-is.

#### 2. `backend/db/seeds/index.ts` (line 404, inside `runBillingSeeds`)

- Pass context into the call:
  ```ts
  await step("quotas", () => seedOrGetQuotas(context.students ?? [], context.teachers ?? []));
  ```
- `runBillingSeeds` already receives `context`, so no signature change needed — just update the one call site.

### Out of scope

- No service-layer changes (`QuotaService.seedOrGetQuotaBatch`, `RecurringClassService.upsertManyRecurringSchedules`, `ClassCatalogService.findSubjectsBySlugs` signatures are all already correct).
- No schema or migration changes.
- The `DeprecationWarning` from `pg` (concurrent `client.query()` during class-instance seeding) is a separate, pre-existing, non-blocking issue — not addressed here.

### Idempotency & edge cases

- **`seedOrGetQuotaBatch`**: returns all existing quota rows if any exist, otherwise creates the batch. On re-run after a successful first seed, it returns the existing 3 rows without duplicating. If a prior (broken) run somehow created quotas against a *different* student ID, those would be returned and the demo batch skipped — acceptable "seed or get" semantics, no cleanup needed.
- **`upsertMany` (recurring schedule)**: matches by `studentId` (one schedule per student) and updates in place — idempotent on re-run.
- **No orphaned rows from the broken seed**: the FK constraint blocked every insert attempt, so the redacted-UUID runs created zero rows. The first fixed run starts from a clean state — no data migration or cleanup step required.
- **Empty context**: if `students` or `teachers` arrays are empty (e.g. earlier seed steps failed), the seeder logs an info message and returns `[]` rather than throwing — consistent with the graceful-degradation pattern used by sibling seeders.

## Validation

1. `bun tsgo` — type check passes (new `StudentSelectType`/`TeacherSelectType` imports resolve, signature matches call site).
2. `bun run scripts/lint-service.ts -f backend/db/seeds/billing/seed-quotas.ts -f backend/db/seeds/index.ts --id verify` — lint clean.
3. `bun db seed` — re-run; confirm:
   - No `Could not seed demo quotas` WARN.
   - No `Could not seed on-demand schedule` WARN.
   - Log shows `Billing quotas present (3 rows).` and `On-demand schedule entry seeded.`
4. Idempotency: run `bun db seed` a second time; confirm no errors and quotas/schedule are not duplicated (`seedOrGetQuotaBatch` returns existing rows; `upsertMany` is idempotent).
