import { eq, gte, lte, type SQL } from "drizzle-orm";
import { classInstances } from "@/backend/db/schema";

/** Start-of-day bound for an inclusive `YYYY-MM-DD` date filter. */
function startOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/** End-of-day bound for an inclusive `YYYY-MM-DD` date filter. */
function endOfUtcDay(isoDate: string): Date {
  return new Date(`${isoDate}T23:59:59.999Z`);
}

/** Date and actor filter fields shared by the class-instance report reads. */
export interface InstanceReportDateFilterFields {
  teacherId?: string | null;
  studentId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

/**
 * WHERE conditions shared by the class-instance report reads: optional
 * teacher / student filters and inclusive `YYYY-MM-DD` scheduled-start date
 * bounds. Timestamp bounds are bound as JS Dates so the same SQL runs on
 * PostgreSQL (timestamptz) and SQLite (epoch-millis) without dialect-specific
 * casts.
 */
export function buildInstanceReportDateConditions(filters: InstanceReportDateFilterFields): (SQL | undefined)[] {
  const conditions: (SQL | undefined)[] = [];

  if (filters.teacherId != null) {
    conditions.push(eq(classInstances.teacherId, filters.teacherId));
  }
  if (filters.studentId != null) {
    conditions.push(eq(classInstances.studentId, filters.studentId));
  }
  if (filters.dateFrom != null) {
    conditions.push(gte(classInstances.scheduledStartAt, startOfUtcDay(filters.dateFrom)));
  }
  if (filters.dateTo != null) {
    conditions.push(lte(classInstances.scheduledStartAt, endOfUtcDay(filters.dateTo)));
  }
  return conditions;
}
