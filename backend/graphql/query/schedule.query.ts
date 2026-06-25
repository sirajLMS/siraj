import { getBackendTranslations } from "@/backend/lib/intl";
import { ScheduleService } from "@/backend/services/schedule/schedule.service";
import { WeeklyScheduleService } from "@/backend/services/schedule/weekly-schedule.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  DailyScheduleListPothosObject,
  DailyScheduleMetricsPothosObject,
  RescheduleTrackingInputPothosObject,
  RescheduleTrackingMetricsPothosObject,
  RescheduleTrackingRowPothosObject,
} from "../pothos/schedule.pothos";
import { WeeklyScheduleGridPothosObject, WeeklyWorkloadMetricsPothosObject } from "../pothos/weekly-schedule.pothos";

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
      return ScheduleService.getDailyMetrics(ctx.user.id, new Date(args.date), args.teacherId || undefined, ctx.locale);
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
      const rawList = await ScheduleService.getDailySchedule(
        ctx.user.id,
        new Date(args.date),
        args.teacherId || undefined,
        args.search || undefined,
        args.metricFilter || undefined,
        ctx.locale
      );

      return rawList.map(item => ({
        id: item.id,
        studentTime: item.scheduledStartAt.toISOString(),
        teacherTime: item.scheduledStartAt.toISOString(),
        yourTime: item.yourTimeFormatted || item.scheduledStartAt.toISOString(),
        duration: item.durationMinutes,
        status: item.outcome || item.executionState,
        student: { id: item.studentId, name: item.student?.name || "Unknown" },
        teacher: { id: item.teacherId, name: item.teacher?.user?.name || "Unknown" },
      }));
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
