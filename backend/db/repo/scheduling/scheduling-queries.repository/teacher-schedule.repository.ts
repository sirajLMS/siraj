import { and, eq, gte, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { classInstances, classSubjects, recurringSchedules, students } from "@/backend/db/schema";
import { DayOfWeek } from "@/backend/enum";
import type {
  DBTransaction,
  FutureClassRow,
  TeacherAssignedClassRow,
  WeeklyScheduleGridRow,
  WeeklyWorkloadMetrics,
} from "@/backend/types";
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";

function isClassExecutionState(value: string): value is ClassExecutionState {
  const values: string[] = Object.values(ClassExecutionState);
  return values.includes(value);
}

function isClassOutcome(value: string): value is ClassOutcome {
  const values: string[] = Object.values(ClassOutcome);
  return values.includes(value);
}

function assertClassExecutionState(value: string): ClassExecutionState {
  if (!isClassExecutionState(value)) {
    throw new Error(`Invalid ClassExecutionState value: ${value}`);
  }
  return value;
}

function assertClassOutcome(value: string): ClassOutcome {
  if (!isClassOutcome(value)) {
    throw new Error(`Invalid ClassOutcome value: ${value}`);
  }
  return value;
}

export async function getTeacherFutureClasses(
  teacherId: string,
  fromDate: Date,
  toDate: Date,
  tx?: DBTransaction
): Promise<FutureClassRow[]> {
  const q = queryDb(tx);

  const rows = await q
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
      meetingJoinUrl: classInstances.meetingJoinUrl,
      executionState: classInstances.executionState,
      outcome: classInstances.outcome,
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

  return rows.map(row =>
    Object.assign(row, {
      executionState: assertClassExecutionState(row.executionState),
      outcome: assertClassOutcome(row.outcome),
    })
  );
}

export const getWeeklyScheduleGrid = async (
  teacherId: string,
  weekStart: Date,
  weekEnd: Date,
  tx?: DBTransaction
): Promise<WeeklyScheduleGridRow[]> => {
  const q = queryDb(tx);

  const rows = await q
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
      isFrozen: classInstances.isFrozen,
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
    const dayNames: DayOfWeek[] = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return Object.assign(row, {
      executionState: assertClassExecutionState(row.executionState),
      outcome: assertClassOutcome(row.outcome),
      dayOfWeek: dayNames[dayIndex],
    });
  });
};

export const getWeeklyWorkloadMetrics = async (
  teacherId: string,
  weekStart: Date,
  weekEnd: Date,
  tx?: DBTransaction
): Promise<WeeklyWorkloadMetrics> => {
  const q = queryDb(tx);

  const [metrics] = await q
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
  const q = queryDb(tx);
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);

  const rows = await q
    .select({
      id: classInstances.id,
      studentName: students.name,
      scheduledStartAt: classInstances.scheduledStartAt,
      scheduledEndAt: classInstances.scheduledEndAt,
      durationMinutes: classInstances.durationMinutes,
      executionState: classInstances.executionState,
      outcome: classInstances.outcome,
      isFrozen: classInstances.isFrozen,
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

  return rows.map(row =>
    Object.assign(row, {
      executionState: assertClassExecutionState(row.executionState),
      outcome: assertClassOutcome(row.outcome),
    })
  );
};
