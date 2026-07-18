import { and, eq, gte, inArray, isNull } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { classInstances, parents, students, teachers, users } from "@/backend/db/schema";

/**
 * Affected-user triplet resolved for a single class instance.
 *
 *   - `parentUserId`   — the parent's `users.id` (the legal guardian who
 *                        receives most class lifecycle notifications).
 *   - `studentId`      — the `students.id` of the student the instance belongs
 *                        to (the caller resolves the display name from here
 *                        and passes it as `metadata.studentName` to the pure
 *                        builder, since builders must not read the DB —
 *                        specs.md §5.1).
 *   - `teacherUserId`  — the teacher's `users.id`.
 *
 * `null` is returned when the class instance is not found (already
 * hard-purged or never existed) — callers MUST skip dispatch in that case.
 */
export interface ClassInstanceAffectedUsers {
  readonly parentUserId: string;
  readonly studentId: string;
  readonly teacherUserId: string;
}

/**
 * Pairing of a class-instance id with its affected-user triplet — used by
 * batch helpers (e.g. `getClassInstanceAffectedUsersForTeacher`) so a
 * caller can fan out per-instance dispatch without re-resolving each
 * triplet separately.
 */
export interface ClassInstanceWithAffectedUsers {
  readonly classInstanceId: string;
  readonly affected: ClassInstanceAffectedUsers;
}

/**
 * Resolve the notification-affected user triplet for a given class instance.
 *
 * Join path used (`classInstances.{studentId,teacherId}` are non-nullable FKs
 * — see `backend/db/schema/classes/scheduling.ts` — so we prefer the
 * simpler direct path over going via `recurringSchedules`):
 *
 *   - `classInstances.studentId → students.id`
 *       → `students.parentId → parents.id`
 *       → `parents.userId → users.id` (parent's `users.id`)
 *   - `classInstances.teacherId → teachers.id`
 *       → `teachers.userId → users.id` (teacher's `users.id`)
 *
 * `recurringScheduleId` on `classInstances` is nullable and intentionally
 * ignored — this helper resolves correctly for BOTH recurring and one-off
 * instances, which is required because reschedules
 * (`ClassSessionService.reschedule`) and manual bookings
 * (`createClassInstance`) create one-off instances without a recurring parent.
 *
 * Per `backend/db/repo/AGENTS.md`:
 *   - Uses `select().from().innerJoin()` (the recommended pattern; avoids
 *     `SQL<unknown>` type resolution errors found with `.findMany` relations).
 *   - Soft-deletes are filtered out (we only resolve users for live
 *     instances). Dispatch sites that fire notifications AFTER a soft-delete
 *     (e.g. `ClassSessionService.deleteInstance` → `CLASS_CANCELLED`) MUST
 *     resolve the triplet BEFORE invoking the soft-delete commit.
 *   - Accepts an optional `tx` so callers inside a transaction (e.g. the
 *     `recurring-class.service.ts` batch creation loop) can read
 *     freshly-inserted rows before commit.
 *   - Pure data access — no business logic, no logger.
 *
 * @param classInstanceId  The `classInstances.id` to resolve affected users for.
 * @param tx               Optional transaction — use when calling inside a
 *                        `db.transaction(...)` so reads see uncommitted rows.
 * @returns The affected-user triplet, or `null` if the instance is not found
 *          (or has been soft-deleted).
 */
export async function getClassInstanceAffectedUsers(
  classInstanceId: string,
  tx?: DBTransaction
): Promise<ClassInstanceAffectedUsers | null> {
  if (!classInstanceId) return null;

  const queryDb = tx ?? db;
  const liveInstanceFilter = and(eq(classInstances.id, classInstanceId), isNull(classInstances.deletedAt));

  const [parentRow] = await queryDb
    .select({
      studentId: classInstances.studentId,
      parentUserId: users.id,
    })
    .from(classInstances)
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .innerJoin(parents, eq(students.parentId, parents.id))
    .innerJoin(users, eq(parents.userId, users.id))
    .where(liveInstanceFilter)
    .limit(1);

  if (!parentRow) return null;

  const [teacherRow] = await queryDb
    .select({
      teacherUserId: teachers.userId,
    })
    .from(classInstances)
    .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
    .where(liveInstanceFilter)
    .limit(1);

  if (!teacherRow) return null;

  return {
    parentUserId: parentRow.parentUserId,
    studentId: parentRow.studentId,
    teacherUserId: teacherRow.teacherUserId,
  };
}

/**
 * Resolve affected-user triplets for every FUTURE live class instance
 * belonging to a teacher. Used by `ScheduleDeletionService.clearWeeklySchedule`
 * so the per-instance `CLASS_CANCELLED` dispatch can fan out AFTER the
 * soft-delete commits — the triplets MUST be resolved pre-soft-delete
 * because `getClassInstanceAffectedUsers` filters on
 * `classInstances.deletedAt IS NULL`.
 *
 * "Future" is gated by `scheduledStartAt >= now` (matches the
 * `clearWeeklySchedule` repo helper's `orphanedInstances` selection — see
 * `backend/db/repo/scheduling/recurring.ts`). This avoids fanning out
 * dispatches for already-completed historical instances that the
 * `clearWeeklySchedule` tx would not orphan anyway, keeping the dispatch
 * volume proportional to the affected user's actionable future schedule.
 *
 * @param teacherId   The teacher whose future instances should be resolved.
 * @param now         Optional "now" cutoff (defaults to `new Date()`).
 * @param tx          Optional transaction.
 * @returns One entry per future live instance. Empty array if none.
 */
export async function getClassInstanceAffectedUsersForTeacher(
  teacherId: string,
  now: Date = new Date(),
  tx?: DBTransaction
): Promise<ClassInstanceWithAffectedUsers[]> {
  if (!teacherId) return [];

  const queryDb = tx ?? db;
  const futureInstanceIds = await queryDb
    .select({ id: classInstances.id })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, now)
      )
    );

  if (futureInstanceIds.length === 0) return [];

  const ids = futureInstanceIds.map(row => row.id);

  const parentRows = await queryDb
    .select({
      classInstanceId: classInstances.id,
      studentId: classInstances.studentId,
      parentUserId: users.id,
    })
    .from(classInstances)
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .innerJoin(parents, eq(students.parentId, parents.id))
    .innerJoin(users, eq(parents.userId, users.id))
    .where(and(inArray(classInstances.id, ids), isNull(classInstances.deletedAt)));

  const [teacherUser] = await queryDb
    .select({ teacherUserId: users.id })
    .from(teachers)
    .innerJoin(users, eq(teachers.userId, users.id))
    .where(eq(teachers.id, teacherId))
    .limit(1);

  if (!teacherUser || parentRows.length === 0) return [];

  return parentRows.map(row => ({
    classInstanceId: row.classInstanceId,
    affected: {
      parentUserId: row.parentUserId,
      studentId: row.studentId,
      teacherUserId: teacherUser.teacherUserId,
    },
  }));
}
