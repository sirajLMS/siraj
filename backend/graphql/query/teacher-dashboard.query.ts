import { PaginationArgs } from "@/backend/types";
import { getBackendTranslations } from "@/backend/lib/intl";
import { TeacherDashboardService } from "@/backend/services/teacher/teacher-dashboard.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { PaginationArgsObject } from "../pothos/pagination.objects";
import { TeacherDashboardPothosObject, TeacherHandbookUrlPothosObject } from "../pothos/teacher-dashboard.pothos";

gqlSchemaBuilder.queryField("teacherDashboard", t =>
  t.field({
    type: TeacherDashboardPothosObject,
    args: {
      date: t.arg.string({ required: true }),
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      const pagination = args.pagination ? new PaginationArgs(args.pagination) : null;
      const result = await TeacherDashboardService.getDashboard(ctx.user.id, args.date, "teacher", ctx.locale, pagination);
      return {
        ...result,
        scheduleRows: result.scheduleRows.map(r => ({
          id: r.id,
          studentId: r.studentId,
          studentName: r.student?.name || "Unknown",
          scheduledStartAt: r.scheduledStartAt,
          durationMinutes: r.durationMinutes,
          executionState: r.executionState,
          outcome: r.outcome ?? null,
          zoomMeetingUrl: r.zoomMeetingUrl ?? null,
          yourTimeFormatted: r.yourTimeFormatted ?? null,
        })),
      };
    },
  })
);

gqlSchemaBuilder.queryField("teacherActiveDashboard", t =>
  t.field({
    type: TeacherDashboardPothosObject,
    args: {
      date: t.arg.string({ required: true }),
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      const pagination = args.pagination ? new PaginationArgs(args.pagination) : null;
      const result = await TeacherDashboardService.getDashboard(ctx.user.id, args.date, "teacher-active", ctx.locale, pagination);
      return {
        ...result,
        scheduleRows: result.scheduleRows.map(r => ({
          id: r.id,
          studentId: r.studentId,
          studentName: r.student?.name || "Unknown",
          scheduledStartAt: r.scheduledStartAt,
          durationMinutes: r.durationMinutes,
          executionState: r.executionState,
          outcome: r.outcome ?? null,
          zoomMeetingUrl: r.zoomMeetingUrl ?? null,
          yourTimeFormatted: r.yourTimeFormatted ?? null,
        })),
      };
    },
  })
);

gqlSchemaBuilder.queryField("teacherHandbookUrl", t =>
  t.field({
    type: TeacherHandbookUrlPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      const url = await TeacherDashboardService.getHandbookDownloadUrl(ctx.user.id, ctx.locale);
      return { id: `handbook-${ctx.user.id}`, url };
    },
  })
);
