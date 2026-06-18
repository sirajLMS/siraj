import { getBackendTranslations } from "@/backend/lib/intl";
import { ScheduleService } from "@/backend/services/schedule/schedule.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { DailyScheduleListPothosObject, DailyScheduleMetricsPothosObject } from "../pothos/schedule.pothos";

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
