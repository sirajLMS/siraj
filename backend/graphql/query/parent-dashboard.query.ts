import { getBackendTranslations } from "@/backend/lib/intl";
import { ParentDashboardService } from "@/backend/services/parent/parent-dashboard.service";
import { PaginationArgs } from "@/backend/types";
import type { BaseContext } from "../gqlContext";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { PaginationArgsObject } from "../pothos/pagination.objects";
import {
  ParentDashboardMetricsResultPothosObject,
  ParentDashboardScheduleResultPothosObject,
} from "../pothos/parent-dashboard.pothos";

async function requireAuth(ctx: BaseContext): Promise<string> {
  if (!ctx.user?.id) {
    const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
    throw new Error(tFunc("unauthorized"));
  }
  return ctx.user.id;
}

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

      let pagination: PaginationArgs | null = null;
      if (args.paginationArgs) {
        pagination = new PaginationArgs({
          first: args.paginationArgs.first ?? null,
          skip: args.paginationArgs.skip ?? null,
          after: args.paginationArgs.after ?? null,
          before: args.paginationArgs.before ?? null,
          last: args.paginationArgs.last ?? null,
          page: args.paginationArgs.page ?? null,
          maxCount: args.paginationArgs.maxCount ?? null,
        });
      }

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
