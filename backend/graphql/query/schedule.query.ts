import { getBackendTranslations } from "@/backend/lib/intl";
import { ScheduleService } from "@/backend/services/schedule/schedule.service";
import { WeeklyScheduleService } from "@/backend/services/schedule/weekly-schedule.service";
import { PaginationArgs } from "@/backend/types";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  AdminDashboardScheduleInputPothosObject,
  AdminDashboardScheduleResultPothosObject,
  DailyScheduleListPothosObject,
  DailyScheduleMetricsPothosObject,
  RescheduleTrackingInputPothosObject,
  RescheduleTrackingMetricsPothosObject,
  RescheduleTrackingRowPothosObject,
} from "../pothos/schedule.pothos";
import { WeeklyScheduleGridPothosObject, WeeklyWorkloadMetricsPothosObject } from "../pothos/weekly-schedule.pothos";

gqlSchemaBuilder.queryField("adminDashboardSchedule", t =>
  t.field({
    type: AdminDashboardScheduleResultPothosObject,
    args: {
      input: t.arg({ type: AdminDashboardScheduleInputPothosObject, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }

      let pagination: PaginationArgs | null = null;
      if (args.input.paginationArgs) {
        pagination = new PaginationArgs({
          first: args.input.paginationArgs.first ?? null,
          skip: args.input.paginationArgs.skip ?? null,
          after: args.input.paginationArgs.after ?? null,
          before: args.input.paginationArgs.before ?? null,
          last: args.input.paginationArgs.last ?? null,
          page: args.input.paginationArgs.page ?? null,
          maxCount: args.input.paginationArgs.maxCount ?? null,
        });
      }

      return ScheduleService.getAdminDashboardSchedule(
        ctx.user.id,
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
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      const result = await ScheduleService.getAdminDashboardSchedule(
        ctx.user.id,
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
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      const result = await ScheduleService.getAdminDashboardSchedule(
        ctx.user.id,
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
    type: [RescheduleTrackingRowPothosObject],
    args: {
      input: t.arg({ type: RescheduleTrackingInputPothosObject, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      return ScheduleService.getRescheduleTracking(ctx.user.id, args.input, ctx.locale);
    },
  })
);

gqlSchemaBuilder.queryField("rescheduleTrackingMetrics", t =>
  t.field({
    type: RescheduleTrackingMetricsPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      return ScheduleService.getRescheduleTrackingMetrics(ctx.user.id, ctx.locale);
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
