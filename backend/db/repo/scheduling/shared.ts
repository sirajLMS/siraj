import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";

export type { DBTransaction };

import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { TeacherAvailabilityRepository } from "@/backend/db/repo/teachers/teacher-availability.repository";
import { classInstances, parents, students, teacherAssignments, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { MeetingClassFieldsService } from "@/backend/services/meeting/meeting-class-fields";
import type * as Types from "@/backend/types";

export async function acquireLocks(tx: DBTransaction, teacherId: string, studentId: string) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('booking_teacher_' || ${teacherId}::text))`);
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('booking_student_' || ${studentId}::text))`);
}

export async function getClassInstanceByIdOrThrow(
  t: DBTransaction,
  id: string,
  locale?: string
): Promise<Types.ClassInstanceEntity> {
  const results = await t.select().from(classInstances).where(eq(classInstances.id, id)).limit(1);
  if (results.length === 0) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("classInstanceNotFound", { id }));
  }
  return results[0];
}

export async function validateTeacherAssignment(
  tx: DBTransaction,
  studentId: string,
  teacherId: string,
  startTime: Date,
  locale?: string
) {
  const assignments = await tx
    .select({ id: teacherAssignments.id })
    .from(teacherAssignments)
    .where(
      and(
        eq(teacherAssignments.studentId, studentId),
        eq(teacherAssignments.teacherId, teacherId),
        or(isNull(teacherAssignments.endedAt), sql`${teacherAssignments.endedAt} >= ${startTime}`)
      )
    )
    .limit(1);

  if (assignments.length === 0) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(
      t("teacherNotAssigned", {
        teacherId,
        studentId,
        startTime: startTime.toISOString(),
      })
    );
  }
}

export interface OverlapCheckParams {
  studentId: string;
  teacherId: string;
  startTime: Date;
  endTime: Date;
  meetingJoinUrl?: string | null;
  excludeId?: string;
}

export async function checkOverlaps(tx: DBTransaction, params: OverlapCheckParams, locale?: string) {
  const { studentId, teacherId, startTime, endTime, meetingJoinUrl, excludeId } = params;
  const overlapCondition = sql`(${classInstances.scheduledStartAt}, ${classInstances.scheduledEndAt}) OVERLAPS (${startTime}, ${endTime})`;

  const teacherOverlaps = await tx
    .select({ id: classInstances.id })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        isNull(classInstances.deletedAt),
        overlapCondition,
        excludeId ? ne(classInstances.id, excludeId) : undefined
      )
    )
    .limit(1);
  if (teacherOverlaps.length > 0) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("teacherBooked"));
  }

  const studentOverlaps = await tx
    .select({ id: classInstances.id })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.studentId, studentId),
        isNull(classInstances.deletedAt),
        overlapCondition,
        excludeId ? ne(classInstances.id, excludeId) : undefined
      )
    )
    .limit(1);
  if (studentOverlaps.length > 0) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("studentBooked"));
  }

  if (meetingJoinUrl) {
    const meetingUrlOverlaps = await tx
      .select({ id: classInstances.id })
      .from(classInstances)
      .where(
        and(
          eq(classInstances.meetingJoinUrl, meetingJoinUrl),
          isNull(classInstances.deletedAt),
          overlapCondition,
          excludeId ? ne(classInstances.id, excludeId) : undefined
        )
      )
      .limit(1);
    if (meetingUrlOverlaps.length > 0) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("meetingUrlInUse"));
    }
  }
}

export async function performRescheduleValidations(
  t: DBTransaction,
  input: Omit<Types.ClassInstanceInsertInput, "createdAt" | "updatedAt">,
  locale?: string
) {
  await acquireLocks(t, input.teacherId, input.studentId);
  await validateTeacherAssignment(t, input.studentId, input.teacherId, input.scheduledStartAt, locale);
  await TeacherAvailabilityRepository.validateBookingAvailability(
    input.teacherId,
    input.scheduledStartAt,
    input.scheduledEndAt,
    t
  );
  await checkOverlaps(
    t,
    {
      studentId: input.studentId,
      teacherId: input.teacherId,
      startTime: input.scheduledStartAt,
      endTime: input.scheduledEndAt,
      meetingJoinUrl: input.meetingJoinUrl,
    },
    locale
  );
}

export async function createRescheduledSuccessor(
  t: DBTransaction,
  existing: Types.ClassInstanceEntity,
  offsetDays: number,
  remarks: string,
  locale?: string
): Promise<Types.ClassInstanceEntity> {
  const offsetMs = offsetDays * 24 * 60 * 60 * 1000;
  const newScheduledStartAt = new Date(existing.scheduledStartAt.getTime() + offsetMs);
  const newScheduledEndAt = new Date(existing.scheduledEndAt.getTime() + offsetMs);

  const successorIdempotencyKey = `leave-reschedule-${existing.id}-${newScheduledStartAt.toISOString()}`;

  const successorInput = {
    studentId: existing.studentId,
    teacherId: existing.teacherId,
    originalClassId: existing.id,
    scheduledStartAt: newScheduledStartAt,
    scheduledEndAt: newScheduledEndAt,
    durationMinutes: existing.durationMinutes,
    classType: existing.classType,
    executionState: "NOT_ACTIVATED" as const,
    outcome: "PENDING" as const,
    isRescheduled: false,
    quotaDeducted: false,
    payrollCredited: false,
    rateAmount: existing.rateAmount,
    rateCurrency: existing.rateCurrency,
    isRateOverridden: existing.isRateOverridden,
    remarks,
    idempotencyKey: successorIdempotencyKey,
  };

  const meetingFields = await MeetingClassFieldsService.resolveForTeacher(existing.teacherId, { tx: t });
  const successorWithMeeting = {
    ...successorInput,
    meetingJoinUrl: meetingFields.meetingJoinUrl,
    meetingConfigSnapshot: meetingFields.meetingConfigSnapshot,
  };

  await performRescheduleValidations(t, successorWithMeeting, locale);

  const [successor] = await t
    .insert(classInstances)
    .values({
      ...successorWithMeeting,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return successor;
}

export async function resolveStudentTimezone(studentId: string, tx?: DBTransaction): Promise<string> {
  const queryDb = tx ?? db;
  const [row] = await queryDb
    .select({
      override: students.timezoneOverride,
      parentTimezone: users.timezone,
    })
    .from(students)
    .innerJoin(parents, eq(students.parentId, parents.id))
    .innerJoin(users, eq(parents.userId, users.id))
    .where(eq(students.id, studentId))
    .limit(1);

  return (
    row?.override ??
    row?.parentTimezone ??
    (await SystemSettingsRepository.getStringValue("default_timezone", IanaTimezone.UTC, tx))
  );
}
