import { and, eq, isNull, or, sql } from "drizzle-orm";
import { db, isSqlite } from "@/backend/db";
import { withCurrentUser } from "@/backend/db/repo/shared";
import {
  buildStudentInsertInput,
  buildStudentUpdateInput,
} from "@/backend/db/repo/students/student.repository.helpers";
import { findStudentById, hasStudentTeacherAssignment } from "@/backend/db/repo/students/student.repository.reads";
import { recurringScheduleDays, recurringSchedules, students, teacherAssignments } from "@/backend/db/schema";
import type { StudentStatus } from "@/backend/enum";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import { StudentUtils } from "@/backend/utils";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

type StudentTeacherAssignmentInput = {
  readonly studentId: string;
  readonly teacherId: string;
  readonly assignedByUserId?: string | null;
};

type StudentAnonymizationScrubInput = {
  readonly userId: string;
  readonly parentId: string | null;
  readonly scrubbedName: string;
};

type StudentAnonymizationScrubResult = {
  readonly priorCount: number;
  readonly scrubbedCount: number;
  readonly scrubbedIds: string[];
};

export async function createStudent(
  input: Types.StudentCreateInput,
  tErrors: ErrorsLabels,
  tx?: DBTransaction
): Promise<Types.StudentSelectType> {
  const err = await StudentUtils.validateName(input.name);
  if (err) throw new Error(err);

  const insertInput = buildStudentInsertInput(input);
  try {
    const executor = tx ?? db;
    const [createdStudent] = await executor.insert(students).values(insertInput).returning();
    return createdStudent;
  } catch {
    throw new Error(tErrors.studentCreateFailed);
  }
}

export async function createStudentTeacherAssignment(
  input: StudentTeacherAssignmentInput,
  tx?: DBTransaction
): Promise<void> {
  const executor = tx ?? db;
  await executor.insert(teacherAssignments).values({
    studentId: input.studentId,
    teacherId: input.teacherId,
    assignedAt: new Date(),
    assignedByUserId: input.assignedByUserId ?? null,
  });
}

export async function deleteStudentById(id: string, tErrors: ErrorsLabels): Promise<Types.StudentSelectType> {
  const existingStudent = await findStudentById(id);
  if (!existingStudent) {
    throw new Error(tErrors.studentNotFound(id));
  }
  await db.transaction(async tx => {
    await tx.delete(students).where(eq(students.id, id));
  });
  return existingStudent;
}

export async function partiallyUpdateStudent(
  input: Types.PartialStudentUpdateInput,
  tErrors: ErrorsLabels,
  locale?: string
): Promise<Types.StudentSelectType> {
  const existingStudent = await findStudentById(input.id);
  if (!existingStudent) {
    throw new Error(tErrors.studentNotFound(input.id));
  }

  if (input.name) {
    const nameErr = await StudentUtils.validateName(input.name, locale);
    if (nameErr) throw new Error(nameErr);
  }

  const updateInput = buildStudentUpdateInput(input, existingStudent);

  try {
    const [updatedStudent] = await db.update(students).set(updateInput).where(eq(students.id, input.id)).returning();
    return updatedStudent;
  } catch {
    throw new Error(tErrors.studentUpdateFailed(input.id));
  }
}

export async function ensureStudentTeacherAssignment(
  studentId: string,
  teacherId: string,
  assignedAt: Date,
  tx?: DBTransaction
): Promise<void> {
  const exists = await hasStudentTeacherAssignment(studentId, teacherId, tx);
  if (exists) return;
  const executor = tx ?? db;
  await executor.insert(teacherAssignments).values({ studentId, teacherId, assignedAt });
}

type StudentIdempotencyUpsertInput = {
  parentId: string;
  userId: string;
  primaryTeacherId: string;
  name: string;
  avatarUrl: string | null;
  status: StudentStatus;
  classesTotal: number;
  classesRemaining: number;
  timezoneOverride: string | null;
  idempotencyKey: string;
};

export async function upsertStudentByIdempotencyKey(
  input: StudentIdempotencyUpsertInput,
  tx?: DBTransaction,
  locale?: string
): Promise<Types.StudentSelectType> {
  const executor = tx ?? db;
  const now = new Date();
  const [row] = await executor
    .insert(students)
    .values({
      parentId: input.parentId,
      userId: input.userId,
      primaryTeacherId: input.primaryTeacherId,
      name: input.name,
      avatarUrl: input.avatarUrl,
      status: input.status,
      classesTotal: input.classesTotal,
      classesRemaining: input.classesRemaining,
      version: 1,
      timezoneOverride: input.timezoneOverride,
      idempotencyKey: input.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: students.idempotencyKey,
      set: {
        name: input.name,
        avatarUrl: input.avatarUrl,
        timezoneOverride: input.timezoneOverride,
        primaryTeacherId: input.primaryTeacherId,
        parentId: input.parentId,
        updatedAt: now,
      },
    })
    .returning();
  if (!row) {
    const i18n = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(i18n.student.upsertFailed);
  }
  return row;
}

/**
 * App-layer SQLite fallback for the PG-only hours-per-week recalculation triggers:
 * `trg_recalc_hours_recurring_schedules` + `trg_recalc_hours_recurring_schedule_days`.
 *
 * On PostgreSQL, these triggers auto-recalc `students.hours_per_week` whenever a
 * recurring schedule or its days are inserted/updated/deleted. SQLite cannot register
 * the plpgsql `update_student_hours_per_week()` function, so the app layer must
 * recalc explicitly after mutations.
 *
 * Recalculates `hours_per_week = SUM(recurring_schedules.duration_minutes) / 60.0`
 * across active recurring_schedule_days for the given student, then UPDATEs the
 * students row. NO-OP on PostgreSQL (the triggers handle it; avoids double-work).
 *
 * Service callers should invoke this after inserting/updating/deleting a recurring
 * schedule or recurring_schedule_days row when running on SQLite.
 */
export async function recalcStudentHoursPerWeekIfSqlite(studentId: string, tx?: DBTransaction): Promise<void> {
  if (!isSqlite()) return;
  const executor = tx ?? db;
  const [row] = await executor
    .select({
      totalMinutes: sql<number>`COALESCE(SUM(${recurringSchedules.durationMinutes}), 0)`,
    })
    .from(recurringSchedules)
    .innerJoin(recurringScheduleDays, eq(recurringScheduleDays.recurringScheduleId, recurringSchedules.id))
    .where(
      and(
        eq(recurringSchedules.studentId, studentId),
        isNull(recurringSchedules.deletedAt),
        eq(recurringScheduleDays.isActive, true)
      )
    );
  const hoursPerWeek = ((row?.totalMinutes ?? 0) / 60).toFixed(2);
  await executor.update(students).set({ hoursPerWeek, updatedAt: new Date() }).where(eq(students.id, studentId));
}

/**
 * Right-to-be-forgotten scrub: anonymize the directly-owned student rows
 * (the user's own student account and, for parents, their children) and
 * return the affected-row counts so the caller can assert the scrub matched
 * every row the pre-read found. The pre-read SELECT and the scrubbing
 * UPDATE both run inside `withCurrentUser`: the students table carries
 * FORCE RLS with fail-closed `current_user_id()` policies, so a connection
 * that never sets the GUC matches zero rows and a partial erasure would
 * commit silently. Runs inside the caller's transaction.
 */
export async function scrubStudentForAnonymization(
  tx: DBTransaction,
  input: StudentAnonymizationScrubInput
): Promise<StudentAnonymizationScrubResult> {
  return withCurrentUser(tx, input.userId, async t => {
    const where = or(
      eq(students.userId, input.userId),
      input.parentId ? eq(students.parentId, input.parentId) : undefined
    );
    const priorRows = await t.select({ id: students.id }).from(students).where(where);
    const scrubbedRows = await t
      .update(students)
      .set({
        name: input.scrubbedName,
        dateOfBirth: null,
        avatarUrl: null,
        gender: null,
        language: null,
        timezoneOverride: null,
        updatedAt: new Date(),
      })
      .where(where)
      .returning({ id: students.id });
    return {
      priorCount: priorRows.length,
      scrubbedCount: scrubbedRows.length,
      scrubbedIds: scrubbedRows.map(row => row.id),
    };
  });
}
