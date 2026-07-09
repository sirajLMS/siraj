import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  AdminDashboardScheduleInputPothosObject,
  AdminDashboardScheduleResultPothosObject,
  DailyScheduleListPothosObject,
  DailyScheduleMetricsPothosObject,
  RescheduleTrackingMetricsPothosObject,
  RescheduleTrackingResultPothosObject,
} from "@/backend/graphql/pothos/scheduling/schedule.pothos";
import {
  WeeklyScheduleGridPothosObject,
  WeeklyWorkloadMetricsPothosObject,
} from "@/backend/graphql/pothos/scheduling/weekly-schedule.pothos";
import { LeaveRequestStatusPothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { ScheduleService } from "@/backend/services/schedule/schedule.service";
import { WeeklyScheduleService } from "@/backend/services/schedule/weekly-schedule.service";
import { PaginationArgs, type PaginationInput } from "@/backend/types";

function toPaginationArgs(input?: PaginationInput | null): PaginationArgs | null {
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
      status: t.arg({ type: LeaveRequestStatusPothosObject, required: false }),
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
      const userId = await requireAuth(ctx);
      return await WeeklyScheduleService.getWeeklySchedule(userId, args.teacherId || null, args.weekDate, ctx.locale);
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
      const userId = await requireAuth(ctx);
      return await WeeklyScheduleService.getWorkloadMetrics(userId, args.teacherId || null, args.weekDate, ctx.locale);
    },
  })
);
