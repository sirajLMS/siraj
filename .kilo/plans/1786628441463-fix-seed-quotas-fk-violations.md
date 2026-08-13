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

Every other seeder receives `context.students` / `context.teachers` and resolves real IDs (e.g. `seed-class-instances.ts:32` uses `studentsList[0]` as the demo student). The quota seeder was never wired to context, so it fell back to hardcoded UUIDs that were later redacted into invalid placeholders. The seeder was born broken — the original commit (`602d6d15f3`) already had the redacted UUID.

## Secondary Issue (Latent Design Flaw)

Even after fixing the FK violation with real IDs, the on-demand schedule seed has a second bug: `seedOnDemandSchedule` calls `RecurringClassService.upsertManyRecurringSchedules`, whose update path (`recurring-schedule.repository.ts:101-111`) does **NOT** include `schedulingMode` in the `.set()` clause. Since `seed-classes.ts` already creates a `NUMBER_OF_CLASSES` recurring schedule for `students[0]` (the demo student) with `teachers[0]` on subject `tajweed`, the `upsertMany` call would match by `studentId` and **overwrite** the demo student's schedule fields while leaving `schedulingMode` as `NUMBER_OF_CLASSES` — the ON_DEMAND intent is silently dropped.

## Fix

Two changes: (1) wire the seeder to context for real IDs, (2) replace `upsertManyRecurringSchedules` with `createRecurringClass` so `schedulingMode: ON_DEMAND` is respected.

### Changes

#### 1. `backend/db/seeds/billing/seed-quotas.ts`

- Remove the two hardcoded `DEMO_STUDENT_ID` / `DEMO_TEACHER_ID` constants.
- Change the signature to accept context entities + actor:
  ```ts
  export async function seedOrGet(
    students: StudentSelectType[],
    teachers: TeacherSelectType[],
    actorUserId?: string
  ): Promise<QuotaReturnType[]>
  ```
- Resolve demo IDs from the passed arrays (consistent with `seed-class-instances.ts:32`):
  ```ts
  const demoStudent = students[0];
  const demoTeacher = teachers[0];
  if (!demoStudent || !demoTeacher) {
    logger.info("Quota seeding skipped: demo student/teacher not available.");
    return [];
  }
  ```
- Use `demoStudent.id` in all three `quotaInputs` entries.
- Pass `demoStudent`, `demoTeacher`, `actorUserId` into `seedOnDemandSchedule`.
- Import `StudentSelectType`, `TeacherSelectType`, `QuotaReturnType` from `@/backend/types`.
- Import `DayOfWeek` from `@/backend/enum`.
- Import `getServerTranslations` from `@/shared/locale`.
- Keep `ON_DEMAND_SUBJECT_SLUG = "tajweed"` constant as-is.
- Keep the existing `try/catch` graceful-degradation behavior (idempotent re-runs must not hard-fail).

#### 2. `seedOnDemandSchedule` rewrite (same file)

Replace the `RecurringClassService.upsertManyRecurringSchedules` call with `RecurringClassService.createRecurringClass`:

```ts
async function seedOnDemandSchedule(
  demoStudent: StudentSelectType,
  demoTeacher: TeacherSelectType,
  actorUserId: string | undefined
): Promise<void> {
  try {
    const subjects = await ClassCatalogService.findSubjectsBySlugs([ON_DEMAND_SUBJECT_SLUG]);
    if (!subjects.length) {
      logger.warn("On-demand schedule seed skipped: subject not found.");
      return;
    }
    if (!actorUserId) {
      logger.warn("On-demand schedule seed skipped: no actor user available.");
      return;
    }

    const tErrors = getServerTranslations("en").errorsTranslations;

    await RecurringClassService.createRecurringClass(
      actorUserId,
      {
        teacherId: demoTeacher.id,
        studentId: demoStudent.id,
        subjectId: subjects[0].id,
        schedulingMode: SchedulingMode.ON_DEMAND,
        durationMinutes: 60,
        defaultStartTime: "10:00",
        timezone: "Asia/Dubai",
        days: [{ dayOfWeek: DayOfWeek.MONDAY, startTime: "10:00", isActive: true }],
      },
      tErrors
    );

    logger.info("On-demand schedule entry seeded.");
  } catch (err) {
    logger.warn("Could not seed on-demand schedule (demo entities may not exist):", { err });
  }
}
```

Key points:
- `createRecurringClass` respects `schedulingMode: ON_DEMAND` (sets `instanceWeeks = 0`, no instances generated).
- ON_DEMAND skips balance/quota validation (`validateBalanceOrQuota` early-returns at line 114).
- `days` is required (non-empty with ≥1 active day) — pass a single active Monday at 10:00. For ON_DEMAND, no instances are generated from these days, but validation still runs.
- `tErrors` obtained via `getServerTranslations("en").errorsTranslations` — established seeder pattern (see `seed-supported-payment-links.ts:26`, `seed-meeting-providers.ts:16`).
- `actorUserId` is `context.actorUserId`, set in `seedUsersAndActor` (`index.ts:216-219`) before billing seeds run.

#### 3. `backend/db/seeds/index.ts` (line 404, inside `runBillingSeeds`)

- Pass context into the call:
  ```ts
  await step("quotas", () =>
    seedOrGetQuotas(context.students ?? [], context.teachers ?? [], context.actorUserId)
  );
  ```
- `runBillingSeeds` already receives `context`, so no signature change needed — just update the one call site.

### Known limitation (accepted)

`createRecurringClass` runs `validateCreateRecurringClass`, which calls `AvailabilityService.assertSchedulePatternAvailable` — this checks the on-demand `days` pattern (Monday 10:00) against the demo student's existing 2089 class instances from `seed-classes.ts`. If any occurrence overlaps an existing instance in the date range, the availability check throws `ValidationError`. The seeder's `try/catch` swallows this (WARN + continue), so the seed won't crash — but the on-demand schedule may silently not get created. This is **accepted as best-effort**: the seed reports success either way, and the on-demand demo data is non-critical. This matches the user's explicit decision.

### Out of scope

- No service-layer changes (`QuotaService.seedOrGetQuotaBatch`, `RecurringClassService.createRecurringClass`, `ClassCatalogService.findSubjectsBySlugs` signatures are all already correct).
- No repo-layer changes (`upsertMany`'s missing `schedulingMode` in the update path is not fixed — we avoid it by using `createRecurringClass` instead).
- No schema or migration changes.
- The `DeprecationWarning` from `pg` (concurrent `client.query()` during class-instance seeding) is a separate, pre-existing, non-blocking issue — not addressed here.

### Idempotency & edge cases

- **`seedOrGetQuotaBatch`**: returns all existing quota rows if any exist, otherwise creates the batch. On re-run after a successful first seed, it returns the existing 3 rows without duplicating.
- **`createRecurringClass`**: NOT idempotent by design — on re-run it will attempt to create a second on-demand schedule for the same student. The availability check will likely reject it (conflict with the first on-demand schedule's pattern), and the `try/catch` swallows the error. This is acceptable: the first run creates the schedule, subsequent runs no-op via the caught error. No duplicate on-demand schedules persist because the availability check prevents them.
- **No orphaned rows from the broken seed**: the FK constraint blocked every insert attempt, so the redacted-UUID runs created zero rows. The first fixed run starts from a clean state — no data migration or cleanup step required.
- **Empty context**: if `students` or `teachers` arrays are empty (e.g. earlier seed steps failed), the seeder logs an info message and returns `[]` rather than throwing — consistent with the graceful-degradation pattern used by sibling seeders.
- **Missing actorUserId**: if `context.actorUserId` is unset, `seedOnDemandSchedule` logs a warn and skips (quota seeding still proceeds).

## Validation

1. `bun tsgo` — type check passes (new `StudentSelectType`/`TeacherSelectType`/`QuotaReturnType`/`DayOfWeek` imports resolve, `createRecurringClass` signature matches).
2. `bun run scripts/lint-service.ts -f backend/db/seeds/billing/seed-quotas.ts -f backend/db/seeds/index.ts --id verify` — lint clean.
3. `bun db seed` — re-run; confirm:
   - No `Could not seed demo quotas` WARN.
   - Log shows `Billing quotas present (3 rows).`
   - Either `On-demand schedule entry seeded.` (success) OR `Could not seed on-demand schedule` WARN (availability conflict — accepted best-effort). Either is acceptable; the seed must not crash.
4. Idempotency: run `bun db seed` a second time; confirm no crash. Quotas return existing rows; on-demand schedule either no-ops via caught error or logs the WARN (accepted).
