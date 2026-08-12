import { and, eq, isNull, ne, or, type SQL, sql } from "drizzle-orm";
import type { alias } from "drizzle-orm/pg-core";
import type { DBTransaction } from "@/backend/types";
import { classInstances, students, teachers, users } from "@/backend/db/schema";
import { LeaveRequestStatus, RescheduleDateLabel } from "@/backend/enum";
import type * as Types from "@/backend/types";

export function buildRescheduleConditions(
  input: Types.RescheduleTrackingInput,
  originalClass: ReturnType<typeof alias<typeof classInstances, "original_class">>
): SQL | undefined {
  const baseConditions = and(isNull(classInstances.deletedAt), sql`${classInstances.originalClassId} IS NOT NULL`);

  let conditions = baseConditions;

  if (input.status === LeaveRequestStatus.PENDING) {
    conditions = and(conditions, eq(originalClass.outcome, "LEAVE"));
  } else if (input.status === LeaveRequestStatus.RESCHEDULED) {
    conditions = and(conditions, ne(originalClass.outcome, "LEAVE"));
  }

  if (input.search) {
    const searchPattern = `%${input.search}%`;
    conditions = and(
      conditions,
      or(sql`${users.name} ILIKE ${searchPattern}`, sql`${students.name} ILIKE ${searchPattern}`)
    );
  }

  return conditions;
}

export function buildRescheduleSelectQuery(
  t: DBTransaction,
  originalClass: ReturnType<typeof alias<typeof classInstances, "original_class">>
) {
  return t
    .select({
      id: classInstances.id,
      originalClassId: classInstances.originalClassId,
      teacherId: classInstances.teacherId,
      teacherName: users.name,
      teacherAvatarUrl: users.avatarUrl,
      studentId: classInstances.studentId,
      studentName: students.name,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      remarks: classInstances.remarks,
      originalOutcome: originalClass.outcome,
    })
    .from(classInstances)
    .leftJoin(originalClass, eq(classInstances.originalClassId, originalClass.id))
    .leftJoin(teachers, eq(classInstances.teacherId, teachers.id))
    .leftJoin(users, eq(teachers.userId, users.id))
    .leftJoin(students, eq(classInstances.studentId, students.id));
}

export function mapRescheduleRow(row: {
  id: string;
  originalClassId: string | null;
  teacherId: string;
  teacherName: string | null;
  teacherAvatarUrl: string | null;
  studentId: string;
  studentName: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  remarks: string | null;
  originalOutcome: string | null;
}) {
  const isLeave = row.originalOutcome === "LEAVE";
  return {
    id: row.id,
    originalClassId: row.originalClassId,
    teacherId: row.teacherId,
    teacherName: row.teacherName ?? "",
    teacherAvatarUrl: row.teacherAvatarUrl,
    studentId: row.studentId,
    studentName: row.studentName ?? "",
    scheduledStartAt: row.scheduledStartAt,
    scheduledEndAt: row.scheduledEndAt,
    status: isLeave ? LeaveRequestStatus.PENDING : LeaveRequestStatus.RESCHEDULED,
    dateLabel: isLeave ? RescheduleDateLabel.LEAVE_REQUEST : RescheduleDateLabel.NEW_DATE,
    remarks: row.remarks,
  };
}
