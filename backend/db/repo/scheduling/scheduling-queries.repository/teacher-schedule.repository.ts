import { and, eq, gte, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { classInstances, classSubjects, recurringSchedules, students } from "@/backend/db/schema";
import type {
  FutureClassRow,
  TeacherAssignedClassRow,
  WeeklyScheduleGridRow,
  WeeklyWorkloadMetrics,
} from "@/backend/types/scheduling.types";

export async function getTeacherFutureClasses(
  teacherId: string,
  fromDate: Date,
  toDate: Date,
  tx?: DBTransaction
): Promise<FutureClassRow[]> {
  const queryDb = tx ?? db;

  const rows = await queryDb
    .select({
      id: classInstances.id,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      durationMinutes: classInstances.durationMinutes,
      isRescheduled: classInstances.isRescheduled,
      studentId: students.id,
      studentName: students.name,
      classType: classInstances.classType,
      subjectId: classInstances.subjectId,
      subjectName: classSubjects.name,
      subjectAvatarUrl: classSubjects.avatarUrl,
      recurringAvatarUrl: recurringSchedules.avatarUrl,
      zoomMeetingUrl: classInstances.zoomMeetingUrl,
    })
    .from(classInstances)
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .leftJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
    .leftJoin(recurringSchedules, eq(classInstances.recurringScheduleId, recurringSchedules.id))
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, fromDate),
        lt(classInstances.scheduledStartAt, toDate),
        inArray(classInstances.executionState, ["NOT_ACTIVATED", "ACTIVATED"])
      )
    )
    .orderBy(classInstances.scheduledStartAt);

  return rows;
}

export const getWeeklyScheduleGrid = async (
  teacherId: string,
  weekStart: Date,
  weekEnd: Date,
  tx?: DBTransaction
): Promise<WeeklyScheduleGridRow[]> => {
  const queryDb = tx ?? db;

  const rows = await queryDb
    .select({
      id: classInstances.id,
      studentId: classInstances.studentId,
      studentName: students.name,
      teacherId: classInstances.teacherId,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      durationMinutes: classInstances.durationMinutes,
      executionState: classInstances.executionState,
      outcome: classInstances.outcome,
      subjectId: classInstances.subjectId,
      subjectName: classSubjects.name,
      classType: classInstances.classType,
    })
    .from(classInstances)
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .leftJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, weekStart),
        lt(classInstances.scheduledStartAt, weekEnd)
      )
    )
    .orderBy(classInstances.scheduledStartAt);

  return rows.map(row => {
    const dayIndex = row.scheduledStartAt.getUTCDay();
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return {
      ...row,
      dayOfWeek: dayNames[dayIndex],
    };
  });
};

export const getWeeklyWorkloadMetrics = async (
  teacherId: string,
  weekStart: Date,
  weekEnd: Date,
  tx?: DBTransaction
): Promise<WeeklyWorkloadMetrics> => {
  const queryDb = tx ?? db;

  const [metrics] = await queryDb
    .select({
      totalMinutes: sql<number>`coalesce(sum(${classInstances.durationMinutes}), 0)`.mapWith(Number),
      classCount: sql<number>`count(*)`.mapWith(Number),
    })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, weekStart),
        lt(classInstances.scheduledStartAt, weekEnd),
        ne(classInstances.executionState, "NOT_ACTIVATED")
      )
    );

  const totalMinutes = metrics?.totalMinutes ?? 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalHoursFormatted = `${hours}:${minutes.toString().padStart(2, "0")}`;

  return {
    totalMinutes,
    totalHoursFormatted,
    classCount: metrics?.classCount ?? 0,
  };
};

export const getTeacherAssignedClasses = async (
  teacherId: string,
  tx?: DBTransaction
): Promise<TeacherAssignedClassRow[]> => {
  const queryDb = tx ?? db;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);

  const rows = await queryDb
    .select({
      id: classInstances.id,
      studentName: students.name,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      durationMinutes: classInstances.durationMinutes,
      executionState: classInstances.executionState,
      outcome: classInstances.outcome,
    })
    .from(classInstances)
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, fromDate)
      )
    )
    .orderBy(classInstances.scheduledStartAt)
    .limit(200);

  return rows;
};
