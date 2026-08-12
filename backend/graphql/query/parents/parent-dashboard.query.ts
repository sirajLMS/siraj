import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ParentDashboardMetricsResultPothosObject,
  ParentDashboardScheduleResultPothosObject,
} from "@/backend/graphql/pothos/parents/parent-dashboard.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { parsePaginationArgs } from "@/backend/graphql/utils/pagination-utils";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ParentDashboardService } from "@/backend/services/parent/parent-dashboard.service";

gqlSchemaBuilder.queryField("parentDashboardSchedule", t =>
  t.field({
    type: ParentDashboardScheduleResultPothosObject,
    args: {
      date: t.arg.string({ required: false }),
      search: t.arg.string({ required: false }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);

      const pagination = parsePaginationArgs(args.paginationArgs);

      const result = await ParentDashboardService.getSchedule(
        userId,
        args.date ?? null,
        args.search ?? null,
        pagination,
        ctx.locale
      );

      return {
        id: `parent-dashboard-schedule-${userId}`,
        rows: result.rows,
        totalCount: result.totalCount,
        pageInfo: result.pageInfo,
      };
    },
  })
);

gqlSchemaBuilder.queryField("parentDashboardMetrics", t =>
  t.field({
    type: ParentDashboardMetricsResultPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      return await ParentDashboardService.getDashboardMetrics(userId, ctx.locale);
    },
  })
);
