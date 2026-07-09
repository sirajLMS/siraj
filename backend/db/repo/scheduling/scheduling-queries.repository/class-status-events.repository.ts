import { and, eq, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { resolveTeacherProgressFeedEventKind } from "@/backend/db/repo/scheduling/scheduling-queries.repository/teacher-progress-feed.utils";
import { classInstances, classStatusEvents, students } from "@/backend/db/schema";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type * as Types from "@/backend/types";

export const getClassStatusEvents = async (classInstanceId: string, tx?: DBTransaction) => {
  const queryDb = tx ?? db;
  return queryDb
    .select()
    .from(classStatusEvents)
    .where(eq(classStatusEvents.classInstanceId, classInstanceId))
    .orderBy(sql`${classStatusEvents.createdAt} DESC`);
};

export const getTeacherProgressFeed = async (
  teacherId: string,
  date: Date,
  viewerTimezone = IanaTimezone.UTC,
  locale?: string,
  tx?: DBTransaction
): Promise<Types.TeacherProgressFeedItem[]> => {
  const queryDb = tx ?? db;
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const rows = await queryDb
    .select({
      id: classStatusEvents.id,
      actorUserId: classStatusEvents.actorUserId,
      fromState: classStatusEvents.fromState,
      toState: classStatusEvents.toState,
      createdAt: classStatusEvents.createdAt,
      studentId: classInstances.studentId,
      studentName: students.name,
      scheduledStartAt: classInstances.scheduledStartAt,
      durationMinutes: classInstances.durationMinutes,
    })
    .from(classStatusEvents)
    .innerJoin(classInstances, eq(classStatusEvents.classInstanceId, classInstances.id))
    .innerJoin(students, eq(classInstances.studentId, students.id))
    .where(
      and(
        eq(classInstances.teacherId, teacherId),
        sql`${classStatusEvents.createdAt} >= ${startOfDay}`,
        sql`${classStatusEvents.createdAt} <= ${endOfDay}`
      )
    )
    .orderBy(sql`${classStatusEvents.createdAt} DESC`)
    .limit(10);

  const { formatInstantInTimezone } = await import("@/backend/lib/timezone");

  return rows.map(row => ({
    id: row.id,
    studentId: row.studentId,
    studentName: row.studentName,
    scheduledTimeFormatted: formatInstantInTimezone(row.scheduledStartAt, viewerTimezone, locale),
    durationMinutes: row.durationMinutes,
    eventKind: resolveTeacherProgressFeedEventKind(row.fromState, row.toState, row.actorUserId),
    occurredAt: row.createdAt,
  }));
};
