import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { classInstances, teachers, users } from "@/backend/db/schema";
import { logger } from "@/backend/lib/logger";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export enum ReportGroupingMode {
  DATE = "DATE",
  TEACHER = "TEACHER",
}

export interface AttendanceReportFilters {
  fromDate: Date;
  toDate: Date;
  teacherId?: string;
  groupBy: ReportGroupingMode;
}

export interface AttendanceReportRow {
  groupKey: string; // E.g., '2024-05-01' or 'teacher-uuid'
  groupLabel: string; // E.g., 'May 1, 2024' or 'John Doe'
  takenClasses: number;
  absentClasses: number;
  leaveClasses: number;
  pendingClasses: number;
  totalHours: number;
  paidEGP: number;
  paidUSD: number;
}

export namespace ReportRepository {
  /**
   * Generates aggregated attendance and financial reporting data directly via PostgreSQL.
   *
   * @description
   * Executes a heavy aggregate query filtering over `class_instances`. Groups by
   * either Day or Teacher depending on filters.
   * SECURITY WARNING: This method returns raw, unmasked financial data. It MUST ONLY
   * be called by the `ReportService`, which applies RBAC field-level gating based on
   * the `report.view_financials` permission.
   *
   * @param filters - The boundary conditions (From/To, TeacherId, Grouping)
   * @param tx - Optional transaction runner
   * @returns Promise<AttendanceReportRow[]>
   */
  export async function generateAttendanceReport(
    filters: AttendanceReportFilters,
    tx?: DBTransaction
  ): Promise<AttendanceReportRow[]> {
    try {
      logger.debug(`[ReportRepository.generateAttendanceReport] Compiling query for groupBy: ${filters.groupBy}`);

      const queryDb = tx ?? db;

      // 1. Base Where Conditions (Bounded strictly by dates)
      const conditions = [
        gte(classInstances.scheduledStartAt, filters.fromDate),
        lte(classInstances.scheduledStartAt, filters.toDate),
      ];

      // Optional Teacher specific filtering
      if (filters.teacherId) {
        conditions.push(eq(classInstances.teacherId, filters.teacherId));
      }

      // 2. Dynamic Grouping Clauses
      // We branch logic specifically on the Enum to prevent SQL Injection
      const groupKeyExpr =
        filters.groupBy === ReportGroupingMode.DATE
          ? sql<string>`DATE_TRUNC('day', ${classInstances.scheduledStartAt})`
          : classInstances.teacherId;

      // Ensure that if we group by Teacher, we extract their name from users table.
      const groupLabelExpr =
        filters.groupBy === ReportGroupingMode.DATE
          ? sql<string>`TO_CHAR(MIN(${classInstances.scheduledStartAt}), 'YYYY-MM-DD')`
          : sql<string>`MAX(${users.name})`;

      // 3. Execution of the Query
      const results = await queryDb
        .select({
          groupKey: sql<string>`${groupKeyExpr}::text`,
          groupLabel: sql<string>`COALESCE(${groupLabelExpr}, ${groupKeyExpr}::text)`,

          // Operational Metrics via conditional aggregation
          takenClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'TAKEN' THEN 1 ELSE 0 END)::int`,
          absentClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'ABSENT' THEN 1 ELSE 0 END)::int`,
          leaveClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'LEAVE' THEN 1 ELSE 0 END)::int`,
          pendingClasses: sql<number>`SUM(CASE WHEN ${classInstances.outcome} = 'PENDING' THEN 1 ELSE 0 END)::int`,

          // Financial Metrics
          // Duration is stored in minutes, report requires hours.
          totalHours: sql<number>`SUM(${classInstances.durationMinutes}::float / 60.0)::float`,
          // Rates are only aggregated based on currency code matching.
          paidEGP: sql<number>`SUM(CASE WHEN ${classInstances.rateCurrency} = 'EGP' THEN ${classInstances.rateAmount} ELSE 0 END)::float`,
          paidUSD: sql<number>`SUM(CASE WHEN ${classInstances.rateCurrency} = 'USD' THEN ${classInstances.rateAmount} ELSE 0 END)::float`,
        })
        .from(classInstances)
        .leftJoin(teachers, eq(teachers.id, classInstances.teacherId))
        .leftJoin(users, eq(users.id, teachers.userId))
        .where(and(...conditions))
        .groupBy(groupKeyExpr);

      logger.debug(`[ReportRepository.generateAttendanceReport] Generated ${results.length} rows.`);
      return results as AttendanceReportRow[];
    } catch (error) {
      logger.error("[ReportRepository.generateAttendanceReport] Fatal query execution error:", error);
      throw error;
    }
  }
}
