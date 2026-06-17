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
        throw new Error("Unauthorized");
      }
      return ScheduleService.getDailyMetrics(ctx.user.id, new Date(args.date), args.teacherId || undefined);
    },
  })
);

gqlSchemaBuilder.queryField("dailyScheduleList", t =>
  t.field({
    type: [DailyScheduleListPothosObject],
    args: {
      date: t.arg.string({ required: true }),
      teacherId: t.arg.string({ required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        throw new Error("Unauthorized");
      }
      const rawList = await ScheduleService.getDailySchedule(
        ctx.user.id,
        new Date(args.date),
        args.teacherId || undefined
      );

      return rawList.map(item => ({
        id: item.id,
        studentTime: item.scheduledStartAt.toISOString(), // Simplified for now
        yourTime: item.scheduledStartAt.toISOString(),
        duration: 30, // Simplified map
        status: item.outcome || item.executionState,
        student: { id: item.studentId, name: item.student?.name || "Unknown" },
        teacher: { id: item.teacherId, name: item.teacher?.name || "Unknown" },
      }));
    },
  })
);
