import { and, eq, gte, isNull, lt } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { mapStatusTrackingQueryRow } from "@/backend/db/repo/scheduling/scheduling-queries.repository/status-tracking.utils";
import { classInstances, classSubjects, recurringSchedules, students, teachers, users } from "@/backend/db/schema";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import type { StatusTrackingRow } from "@/backend/types/scheduling/scheduling.types";

export const getStatusTrackingRows = async (
  date: Date,
  options?: { search?: string; viewerTimezone?: string },
  tx?: DBTransaction
): Promise<StatusTrackingRow[]> => {
  const runner = async (t: DBTransaction): Promise<StatusTrackingRow[]> => {
    const { getDayBoundaries } = await import("@/backend/lib/timezone");
    const viewerTimezone = options?.viewerTimezone ?? IanaTimezone.UTC;
    const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, viewerTimezone);
    const search = options?.search;

    const rows = await t
      .select({
        id: classInstances.id,
        studentId: students.id,
        studentName: students.name,
        studentAvatarUrl: students.avatarUrl,
        studentStatus: students.status,
        teacherId: classInstances.teacherId,
        scheduledStartAt: classInstances.scheduledStartAt,
        scheduledEndAt: classInstances.scheduledEndAt,
        durationMinutes: classInstances.durationMinutes,
        executionState: classInstances.executionState,
        outcome: classInstances.outcome,
        isFrozen: classInstances.isFrozen,
        teacherUserName: users.name,
        teacherAvatarUrl: users.avatarUrl,
        subjectName: classSubjects.name,
        subjectAvatarUrl: classSubjects.avatarUrl,
        recurringAvatarUrl: recurringSchedules.avatarUrl,
      })
      .from(classInstances)
      .innerJoin(students, eq(classInstances.studentId, students.id))
      .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .leftJoin(classSubjects, eq(classInstances.subjectId, classSubjects.id))
      .leftJoin(recurringSchedules, eq(classInstances.recurringScheduleId, recurringSchedules.id))
      .where(
        and(
          isNull(classInstances.deletedAt),
          gte(classInstances.scheduledStartAt, startOfDayUtc),
          lt(classInstances.scheduledStartAt, endOfDayUtc)
        )
      )
      .orderBy(classInstances.scheduledStartAt);

    let results = rows.map(mapStatusTrackingQueryRow);

    if (search) {
      const lower = search.toLowerCase();
      results = results.filter(
        r => r.studentName.toLowerCase().includes(lower) || r.teacherName.toLowerCase().includes(lower)
      );
    }

    return results;
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};
