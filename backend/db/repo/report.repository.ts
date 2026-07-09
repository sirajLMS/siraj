import { and, eq, gte, lte, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { classInstances, students, teachers, users } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";

export enum ReportGroupingMode {
  DATE = "DATE",
  TEACHER = "TEACHER",
  STUDENT = "STUDENT",
}

export interface AttendanceReportFilters {
  fromDate: Date;
  toDate: Date;
  teacherId?: string;
  groupBy: ReportGroupingMode;
}

export interface AttendanceReportRow {
  groupKey: string;
  groupLabel: string;
  takenClasses: number;
  absentClasses: number;
  leaveClasses: number;
  pendingClasses: number;
  totalHours: number;
  paidEGP: number;
  paidUSD: number;
  engagementGrowth: number | null;
}

function buildGroupingExpressions(groupBy: ReportGroupingMode) {
  if (groupBy === ReportGroupingMode.DATE) {
    return {
      groupKeyExpr: sql<string>`DATE_TRUNC('day', ${classInstances.scheduledStartAt})`,
      groupLabelExpr: sql<string>`TO_CHAR(MIN(${classInstances.scheduledStartAt}), 'YYYY-MM-DD')`,
    };
  }

  if (groupBy === ReportGroupingMode.STUDENT) {
    return {
      groupKeyExpr: classInstances.studentId,
      groupLabelExpr: sql<string>`MAX(${students.name})`,
    };
  }

  return {
    groupKeyExpr: classInstances.teacherId,
    groupLabelExpr: sql<string>`MAX(${users.name})`,
  };
}

export namespace ReportRepository {
  /**
   * Generates aggregated attendance and financial reporting data directly via PostgreSQL.
   *
   * SECURITY WARNING: This method returns raw, unmasked financial data. It MUST ONLY
   * be called by the `ReportService`, which applies RBAC field-level gating based on
   * the `report.view_financials` permission.
   */
  export async function generateAttendanceReport(
    filters: AttendanceReportFilters,
    tx?: DBTransaction
  ): Promise<AttendanceReportRow[]> {
    try {
      logger.debug(`[ReportRepository.generateAttendanceReport] Compiling query for groupBy: ${filters.groupBy}`);

      const queryDb = tx ?? db;

      const conditions = [
        gte(classInstances.scheduledStartAt, filters.fromDate),
        lte(classInstances.scheduledStartAt, filters.toDate),
      ];

      if (filters.teacherId) {
        conditions.push(eq(classInstances.teacherId, filters.teacherId));
      }

      const { groupKeyExpr, groupLabelExpr } = buildGroupingExpressions(filters.groupBy);

      if (filters.groupBy === ReportGroupingMode.STUDENT) {
        const results = await queryDb
          .select({
            groupKey: sql<string>`${groupKeyExpr}::text`,
            groupLabel: sql<string>`COALESCE(${groupLabelExpr}, ${groupKeyExpr}::text)`,
            takenClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'TAKEN' THEN 1 ELSE 0 END)::int`,
            absentClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'ABSENT' THEN 1 ELSE 0 END)::int`,
            leaveClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'LEAVE' THEN 1 ELSE 0 END)::int`,
            pendingClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'PENDING' THEN 1 ELSE 0 END)::int`,
            totalHours: sql<number>`SUM(${classInstances.durationMinutes}::float / 60.0)::float`,
            paidEGP: sql<number>`SUM(CASE WHEN ${classInstances.rateCurrency} = 'EGP' THEN ${classInstances.rateAmount} ELSE 0 END)::float`,
            paidUSD: sql<number>`SUM(CASE WHEN ${classInstances.rateCurrency} = 'USD' THEN ${classInstances.rateAmount} ELSE 0 END)::float`,
          })
          .from(classInstances)
          .leftJoin(students, eq(students.id, classInstances.studentId))
          .leftJoin(teachers, eq(teachers.id, classInstances.teacherId))
          .leftJoin(users, eq(users.id, teachers.userId))
          .where(and(...conditions))
          .groupBy(groupKeyExpr);

        logger.debug(`[ReportRepository.generateAttendanceReport] Generated ${results.length} rows.`);
        return results.map(row => ({ ...row, engagementGrowth: null }));
      }

      const results = await queryDb
        .select({
          groupKey: sql<string>`${groupKeyExpr}::text`,
          groupLabel: sql<string>`COALESCE(${groupLabelExpr}, ${groupKeyExpr}::text)`,
          takenClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'TAKEN' THEN 1 ELSE 0 END)::int`,
          absentClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'ABSENT' THEN 1 ELSE 0 END)::int`,
          leaveClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'LEAVE' THEN 1 ELSE 0 END)::int`,
          pendingClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'PENDING' THEN 1 ELSE 0 END)::int`,
          totalHours: sql<number>`SUM(${classInstances.durationMinutes}::float / 60.0)::float`,
          paidEGP: sql<number>`SUM(CASE WHEN ${classInstances.rateCurrency} = 'EGP' THEN ${classInstances.rateAmount} ELSE 0 END)::float`,
          paidUSD: sql<number>`SUM(CASE WHEN ${classInstances.rateCurrency} = 'USD' THEN ${classInstances.rateAmount} ELSE 0 END)::float`,
        })
        .from(classInstances)
        .leftJoin(teachers, eq(teachers.id, classInstances.teacherId))
        .leftJoin(users, eq(users.id, teachers.userId))
        .where(and(...conditions))
        .groupBy(groupKeyExpr);

      logger.debug(`[ReportRepository.generateAttendanceReport] Generated ${results.length} rows.`);
      return results.map(row => ({ ...row, engagementGrowth: null }));
    } catch (error) {
      logger.error("[ReportRepository.generateAttendanceReport] Fatal query execution error:", error);
      throw error;
    }
  }

  export async function calculateEngagementGrowth(
    filters: AttendanceReportFilters,
    tx?: DBTransaction
  ): Promise<number | null> {
    try {
      const queryDb = tx ?? db;
      const durationMs = filters.toDate.getTime() - filters.fromDate.getTime();
      const previousToDate = new Date(filters.fromDate.getTime() - 1);
      const previousFromDate = new Date(previousToDate.getTime() - durationMs);

      const teacherCondition = filters.teacherId ? eq(classInstances.teacherId, filters.teacherId) : undefined;

      const result = await queryDb
        .select({
          prevTaken: sql<number>`SUM(CASE WHEN ${classInstances.scheduledStartAt} >= ${previousFromDate} AND ${classInstances.scheduledStartAt} <= ${previousToDate} AND ${classInstances.outcome} = 'TAKEN' THEN 1 ELSE 0 END)::int`,
          prevAbsent: sql<number>`SUM(CASE WHEN ${classInstances.scheduledStartAt} >= ${previousFromDate} AND ${classInstances.scheduledStartAt} <= ${previousToDate} AND ${classInstances.outcome} = 'ABSENT' THEN 1 ELSE 0 END)::int`,
          prevLeave: sql<number>`SUM(CASE WHEN ${classInstances.scheduledStartAt} >= ${previousFromDate} AND ${classInstances.scheduledStartAt} <= ${previousToDate} AND ${classInstances.outcome} = 'LEAVE' THEN 1 ELSE 0 END)::int`,
          currTaken: sql<number>`SUM(CASE WHEN ${classInstances.scheduledStartAt} >= ${filters.fromDate} AND ${classInstances.scheduledStartAt} <= ${filters.toDate} AND ${classInstances.outcome} = 'TAKEN' THEN 1 ELSE 0 END)::int`,
          currAbsent: sql<number>`SUM(CASE WHEN ${classInstances.scheduledStartAt} >= ${filters.fromDate} AND ${classInstances.scheduledStartAt} <= ${filters.toDate} AND ${classInstances.outcome} = 'ABSENT' THEN 1 ELSE 0 END)::int`,
          currLeave: sql<number>`SUM(CASE WHEN ${classInstances.scheduledStartAt} >= ${filters.fromDate} AND ${classInstances.scheduledStartAt} <= ${filters.toDate} AND ${classInstances.outcome} = 'LEAVE' THEN 1 ELSE 0 END)::int`,
        })
        .from(classInstances)
        .where(
          and(
            gte(classInstances.scheduledStartAt, previousFromDate),
            lte(classInstances.scheduledStartAt, filters.toDate),
            ...(teacherCondition ? [teacherCondition] : [])
          )
        );

      const prevTaken = result[0]?.prevTaken ?? 0;
      const prevAbsent = result[0]?.prevAbsent ?? 0;
      const prevLeave = result[0]?.prevLeave ?? 0;
      const prevAttempted = prevTaken + prevAbsent + prevLeave;

      const currTaken = result[0]?.currTaken ?? 0;
      const currAbsent = result[0]?.currAbsent ?? 0;
      const currLeave = result[0]?.currLeave ?? 0;
      const currAttempted = currTaken + currAbsent + currLeave;

      if (prevAttempted === 0 || currAttempted === 0) {
        return null;
      }

      const currentRate = currTaken / currAttempted;
      const previousRate = prevTaken / prevAttempted;

      if (previousRate < 0.001) {
        return null;
      }

      const growth = ((currentRate - previousRate) / previousRate) * 100;
      return Math.round(growth * 10) / 10;
    } catch (error) {
      logger.error("[ReportRepository.calculateEngagementGrowth] Error:", error);
      return null;
    }
  }
}
