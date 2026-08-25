// Auto-extracted from pothos/ (types-review R3-P3).
// Query field registrations relocated to the query layer per query/AGENTS.md.

import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { RecurringSchedulesPaginatedResultRef } from "@/backend/graphql/pothos/scheduling/recurring-schedule.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";

gqlSchemaBuilder.queryField("recurringSchedules", t =>
  t.field({
    type: RecurringSchedulesPaginatedResultRef,
    authScopes: { loggedIn: true },
    args: {
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
      search: t.arg.string({ required: false, directives: { constraint: { maxLength: 255 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const userId = requireUserId(ctx);

      const { RecurringScheduleDetailService } = await import(
        "@/backend/services/schedule/recurring-schedule-detail.service"
      );

      const page = args.pagination?.page ?? 1;
      const pageSize = args.pagination?.first ?? 20;

      const result = await RecurringScheduleDetailService.listAll(userId, tErrors, {
        page,
        pageSize,
        search: args.search ?? undefined,
      });

      return {
        id: "recurring-schedules-list",
        rows: result.rows.map(row => ({
          id: row.id,
          studentId: row.studentId,
          studentName: row.studentName,
          teacherId: row.teacherId,
          teacherName: row.teacherUserName,
          durationMinutes: row.durationMinutes,
          defaultStartTime: row.defaultStartTime.slice(0, 5),
          timezone: row.timezone,
          hourlyRate: row.hourlyRate,
          rateCurrency: row.rateCurrency,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        })),
        totalCount: result.totalCount,
        pageInfo: {
          count: result.rows.length,
          currentPage: page,
          firstItem: result.totalCount > 0 ? (page - 1) * pageSize + 1 : null,
          hasMorePages: page * pageSize < result.totalCount,
          lastItem: result.totalCount > 0 ? Math.min(page * pageSize, result.totalCount) : null,
          lastPage: Math.ceil(result.totalCount / pageSize),
          perPage: pageSize,
          total: result.totalCount,
        },
      };
    },
  })
);
