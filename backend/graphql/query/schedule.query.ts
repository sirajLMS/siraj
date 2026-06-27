import type { BaseContext } from "@/backend/graphql/gqlContext";
import { getBackendTranslations } from "@/backend/lib/intl";
import { ScheduleService } from "@/backend/services/schedule/schedule.service";
import { WeeklyScheduleService } from "@/backend/services/schedule/weekly-schedule.service";
import { PaginationArgs } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { PaginationArgsObject } from "../pothos/pagination.objects";
import {
  AdminDashboardScheduleInputPothosObject,
  AdminDashboardScheduleResultPothosObject,
  DailyScheduleListPothosObject,
  DailyScheduleMetricsPothosObject,
  RescheduleTrackingMetricsPothosObject,
  RescheduleTrackingResultPothosObject,
} from "../pothos/schedule.pothos";
import { WeeklyScheduleGridPothosObject, WeeklyWorkloadMetricsPothosObject } from "../pothos/weekly-schedule.pothos";

async function requireAuth(ctx: BaseContext): Promise<string> {
  if (!ctx.user) {
    const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
    throw new Error(tFunc("unauthorized"));
  }
  return ctx.user.id;
}

type PaginationArgsInput = {
  first?: number | null;
  skip?: number | null;
  after?: string | null;
  before?: string | null;
  last?: number | null;
  page?: number | null;
  maxCount?: number | null;
};

function toPaginationArgs(input?: PaginationArgsInput | null): PaginationArgs | null {
  if (!input) return null;
  return new PaginationArgs({
    first: input.first ?? null,
    skip: input.skip ?? null,
    after: input.after ?? null,
    before: input.before ?? null,
    last: input.last ?? null,
    page: input.page ?? null,
    maxCount: input.maxCount ?? null,
  });
}

gqlSchemaBuilder.queryField("adminDashboardSchedule", t =>
  t.field({
    type: AdminDashboardScheduleResultPothosObject,
    args: {
      input: t.arg({ type: AdminDashboardScheduleInputPothosObject, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);

      const pagination = toPaginationArgs(args.input.paginationArgs);

      return ScheduleService.getAdminDashboardSchedule(
        userId,
        {
          ...args.input,
          paginationArgs: pagination,
        },
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.queryField("dailyScheduleMetrics", t =>
  t.field({
    type: DailyScheduleMetricsPothosObject,
    args: {
      date: t.arg.string({ required: true }),
      teacherId: t.arg.string({ required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const result = await ScheduleService.getAdminDashboardSchedule(
        userId,
        { date: args.date, teacherId: args.teacherId },
        ctx.locale
      );
      return result.metrics;
    },
  })
);

gqlSchemaBuilder.queryField("dailyScheduleList", t =>
  t.field({
    type: [DailyScheduleListPothosObject],
    args: {
      date: t.arg.string({ required: true }),
      teacherId: t.arg.string({ required: false }),
      search: t.arg.string({ required: false }),
      metricFilter: t.arg.string({ required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const result = await ScheduleService.getAdminDashboardSchedule(
        userId,
        {
          date: args.date,
          teacherId: args.teacherId,
          search: args.search,
          metricFilter: args.metricFilter,
        },
        ctx.locale
      );
      return result.rows;
    },
  })
);

gqlSchemaBuilder.queryField("rescheduleTrackingRows", t =>
  t.field({
    type: RescheduleTrackingResultPothosObject,
    args: {
      search: t.arg.string({ required: false }),
      status: t.arg.string({ required: false }),
      paginationArgs: t.arg({ type: PaginationArgsObject, required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);

      const pagination = toPaginationArgs(args.paginationArgs);

      const result = await ScheduleService.getRescheduleTracking(
        userId,
        { search: args.search ?? null, status: args.status ?? null },
        pagination,
        ctx.locale
      );

      return {
        id: `reschedule-tracking-${args.search || ""}-${args.status || ""}`,
        ...result,
      };
    },
  })
);

gqlSchemaBuilder.queryField("rescheduleTrackingMetrics", t =>
  t.field({
    type: RescheduleTrackingMetricsPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      const userId = await requireAuth(ctx);
      return ScheduleService.getRescheduleTrackingMetrics(userId, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("teacherWeeklyScheduleGrid", t =>
  t.field({
    type: WeeklyScheduleGridPothosObject,
    args: {
      teacherId: t.arg.string({ required: false }),
      weekDate: t.arg.string({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      return await WeeklyScheduleService.getWeeklySchedule(
        ctx.user?.id || "",
        args.teacherId || null,
        args.weekDate,
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.queryField("teacherWorkloadMetrics", t =>
  t.field({
    type: WeeklyWorkloadMetricsPothosObject,
    args: {
      teacherId: t.arg.string({ required: false }),
      weekDate: t.arg.string({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      return await WeeklyScheduleService.getWorkloadMetrics(
        ctx.user?.id || "",
        args.teacherId || null,
        args.weekDate,
        ctx.locale
      );
    },
  })
);
