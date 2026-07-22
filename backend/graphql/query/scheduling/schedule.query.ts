import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { RecurringScheduleDetailPothosObject } from "@/backend/graphql/pothos/scheduling/recurring-schedule.pothos";
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
import { RecurringScheduleDetailService } from "@/backend/services/schedule/recurring-schedule-detail.service";
import { ScheduleService } from "@/backend/services/schedule/schedule.service";
import { WeeklyScheduleService } from "@/backend/services/schedule/weekly-schedule.service";
import { type DailyScheduleArgs, PaginationArgs, type PaginationInput } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

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

type AdminDashboardResult = Awaited<ReturnType<typeof ScheduleService.getAdminDashboardSchedule>>;

async function fetchDailySchedule(
  ctx: BaseContext,
  args: DailyScheduleArgs,
  tErrors: ErrorsLabels
): Promise<AdminDashboardResult> {
  const userId = await requireAuth(ctx);
  return ScheduleService.getAdminDashboardSchedule(userId, args, tErrors);
}

function selectDailySchedule<T>(
  ctx: BaseContext,
  args: DailyScheduleArgs,
  tErrors: ErrorsLabels,
  select: (result: AdminDashboardResult) => T
): Promise<T> {
  return fetchDailySchedule(ctx, args, tErrors).then(select);
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
      const tErrors = ctx.t().errorsTranslations;

      const pagination = toPaginationArgs(args.input.paginationArgs);

      return ScheduleService.getAdminDashboardSchedule(
        userId,
        {
          ...args.input,
          paginationArgs: pagination,
        },
        tErrors
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
      const tErrors = ctx.t().errorsTranslations;
      return selectDailySchedule(
        ctx,
        { date: args.date, teacherId: args.teacherId },
        tErrors,
        result => result.metrics
      );
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
      const tErrors = ctx.t().errorsTranslations;
      return selectDailySchedule(
        ctx,
        {
          date: args.date,
          teacherId: args.teacherId,
          search: args.search,
          metricFilter: args.metricFilter,
        },
        tErrors,
        result => result.rows
      );
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
      const tErrors = ctx.t().errorsTranslations;

      const pagination = toPaginationArgs(args.paginationArgs);

      const result = await ScheduleService.getRescheduleTracking(
        userId,
        { search: args.search ?? null, status: args.status ?? null },
        tErrors,
        pagination
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
      const tErrors = ctx.t().errorsTranslations;
      return ScheduleService.getRescheduleTrackingMetrics(userId, tErrors);
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
      const tErrors = ctx.t().errorsTranslations;
      return await WeeklyScheduleService.getWeeklySchedule(userId, args.teacherId || null, args.weekDate, tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("recurringSchedule", t =>
  t.field({
    type: RecurringScheduleDetailPothosObject,
    args: {
      id: t.arg.id({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return RecurringScheduleDetailService.getDetail(userId, args.id, tErrors);
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
      const tErrors = ctx.t().errorsTranslations;
      return await WeeklyScheduleService.getWorkloadMetrics(userId, args.teacherId || null, args.weekDate, tErrors);
    },
  })
);
