import { and, eq, sql } from "drizzle-orm";
import type { DBTransaction } from "../db.types";
import { db } from "../drizzleDb";
import { classInstancePerformance, classInstances, teachers, users } from "../schema";

export interface SessionSummary {
  id: string;
  title: string;
  time: string;
  duration: number;
  status: string;
  instructor: string;
  timeSlot: string;
  room: string | null;
  notes: string;
  dayOfMonth: number;
}

export namespace StudentHistoryRepository {
  export async function getMonthlyCalendar(
    studentId: string,
    year: number,
    month: number,
    _locale?: string,
    tx?: DBTransaction
  ): Promise<SessionSummary[]> {
    const queryDb = tx ?? db;

    // JavaScript months are 0-indexed in Date constructor, but here we expect 1-indexed from GraphQL API
    // e.g., month = 6 for June
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0)); // First day of next month

    const rows = await queryDb
      .select({
        instance: classInstances,
        teacher: teachers,
        user: users,
      })
      .from(classInstances)
      .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(
        and(
          eq(classInstances.studentId, studentId),
          sql`${classInstances.scheduledStartAt} >= ${startDate}`,
          sql`${classInstances.scheduledStartAt} < ${endDate}`,
          sql`${classInstances.deletedAt} IS NULL`
        )
      )
      .orderBy(classInstances.scheduledStartAt);

    return rows.map(r => {
      const date = r.instance.scheduledStartAt;
      const dayOfMonth = date.getUTCDate(); // Using UTC to match the boundaries

      const hh = date.getUTCHours().toString().padStart(2, "0");
      const mm = date.getUTCMinutes().toString().padStart(2, "0");

      return {
        id: r.instance.id,
        title: "Class Session", // Fallback, would normally resolve course name if courses table existed
        time: `${hh}:${mm}`,
        duration: r.instance.durationMinutes,
        status: r.instance.executionState,
        instructor: r.user.name,
        timeSlot: `${hh}:${mm}`,
        room: r.instance.zoomMeetingUrl ?? null,
        notes: r.instance.remarks ?? "",
        dayOfMonth,
      };
    });
  }

  export async function getMonthlyMetrics(studentId: string, year: number, month: number, tx?: DBTransaction) {
    const queryDb = tx ?? db;

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));

    const metrics = await queryDb
      .select({
        totalClasses: sql<number>`count(*)`.mapWith(Number),
        hoursStudied: sql<number>`sum(${classInstances.durationMinutes}) / 60.0`.mapWith(Number),
        takenClasses: sql<number>`sum(case when ${classInstances.outcome} = 'TAKEN' then 1 else 0 end)`.mapWith(Number),
        avgPerformance: sql<number>`coalesce(avg(${classInstancePerformance.engagementScore}), 0)`.mapWith(Number),
      })
      .from(classInstances)
      .leftJoin(classInstancePerformance, eq(classInstances.id, classInstancePerformance.classInstanceId))
      .where(
        and(
          eq(classInstances.studentId, studentId),
          sql`${classInstances.scheduledStartAt} >= ${startDate}`,
          sql`${classInstances.scheduledStartAt} < ${endDate}`,
          sql`${classInstances.deletedAt} IS NULL`,
          sql`${classInstances.executionState} = 'COMPLETED'`
        )
      );

    const m = metrics[0];
    const total = m?.totalClasses || 0;
    const taken = m?.takenClasses || 0;

    return {
      totalClasses: total,
      attendanceRate: total > 0 ? Math.round((taken / total) * 100) : 0,
      hoursStudied: Math.round((m?.hoursStudied || 0) * 10) / 10,
      performance: Math.round(m?.avgPerformance || 0),
    };
  }

  export async function getSessionDetail(classInstanceId: string, _locale?: string, tx?: DBTransaction) {
    const queryDb = tx ?? db;

    const [row] = await queryDb
      .select({
        instance: classInstances,
        teacher: teachers,
        user: users,
      })
      .from(classInstances)
      .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(eq(classInstances.id, classInstanceId))
      .limit(1);

    if (!row) return null;

    return {
      ...row.instance,
      teacherName: row.user.name,
    };
  }
}
