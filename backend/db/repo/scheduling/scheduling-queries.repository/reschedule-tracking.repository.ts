import { and, eq, isNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, queryWithPagination } from "@/backend/db";
import {
  buildRescheduleConditions,
  buildRescheduleSelectQuery,
  mapRescheduleRow,
} from "@/backend/db/repo/scheduling/scheduling-queries.repository/reschedule-tracking.utils";
import { classInstances, leaveRequests, students, teachers, users } from "@/backend/db/schema";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";

export const getRescheduleTrackingRows = async (
  input: Types.RescheduleTrackingInput,
  pagination: Types.PaginationArgs | null = null,
  tx?: DBTransaction
): Promise<Types.RescheduleTrackingPaginatedResult> => {
  const runner = async (t: DBTransaction): Promise<Types.RescheduleTrackingPaginatedResult> => {
    const originalClass = alias(classInstances, "original_class");
    const conditions = buildRescheduleConditions(input, originalClass);

    const query = buildRescheduleSelectQuery(t, originalClass)
      .where(conditions)
      .orderBy(sql`${classInstances.scheduledStartAt} DESC`)
      .$dynamic();

    const dataQuery = queryWithPagination(query, pagination);

    const countQuery = t
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(classInstances)
      .leftJoin(originalClass, eq(classInstances.originalClassId, originalClass.id))
      .leftJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .leftJoin(users, eq(teachers.userId, users.id))
      .leftJoin(students, eq(classInstances.studentId, students.id))
      .where(conditions);

    const [queryRows, [countRow]] = await Promise.all([dataQuery, countQuery]);

    const totalCount = countRow?.count ?? 0;
    const mappedRows = queryRows.map(mapRescheduleRow);

    const pageInfo = pagination
      ? {
          count: mappedRows.length,
          currentPage: pagination.currentPage,
          firstItem: mappedRows.length > 0 ? pagination.offset + 1 : null,
          hasMorePages: pagination.offset + pagination.perPage < totalCount,
          lastItem: mappedRows.length > 0 ? pagination.offset + mappedRows.length : null,
          lastPage: Math.max(1, Math.ceil(totalCount / pagination.perPage)),
          perPage: pagination.perPage,
          total: totalCount,
        }
      : null;

    return { rows: mappedRows, totalCount, pageInfo };
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

const getRescheduleMetricsRunner = async (t: DBTransaction) => {
  const [lrMetrics] = await t
    .select({
      pending: sql<number>`sum(case when status = 'PENDING' then 1 else 0 end)`.mapWith(Number),
      approved: sql<number>`sum(case when status = 'APPROVED' then 1 else 0 end)`.mapWith(Number),
      rescheduled: sql<number>`sum(case when status = 'RESCHEDULED' then 1 else 0 end)`.mapWith(Number),
      cancelled: sql<number>`sum(case when status = 'CANCELLED' then 1 else 0 end)`.mapWith(Number),
      leave: sql<number>`count(*)`.mapWith(Number),
    })
    .from(leaveRequests);

  const [rescheduledCountRow] = await t
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(classInstances)
    .where(and(isNull(classInstances.deletedAt), sql`${classInstances.originalClassId} IS NOT NULL`));

  return {
    pending: lrMetrics?.pending ?? 0,
    approved: lrMetrics?.approved ?? 0,
    leave: lrMetrics?.leave ?? 0,
    rescheduled: rescheduledCountRow?.count ?? 0,
    cancelled: lrMetrics?.cancelled ?? 0,
  };
};

export const getRescheduleTrackingMetrics = async (tx?: DBTransaction) => {
  return tx
    ? await getRescheduleMetricsRunner(tx)
    : await db.transaction((t: DBTransaction) => getRescheduleMetricsRunner(t));
};
