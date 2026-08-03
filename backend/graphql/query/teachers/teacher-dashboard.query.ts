import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import {
  TeacherDashboardPothosObject,
  TeacherHandbookUrlPothosObject,
} from "@/backend/graphql/pothos/teachers/teacher-dashboard.pothos";
import { UnauthorizedError } from "@/backend/lib/errors";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import { TeacherDashboardService } from "@/backend/services/teacher/teacher-dashboard.service";
import { PaginationArgs } from "@/backend/types";

async function resolveTeacherDashboard(
  ctx: BaseContext,
  args: { date: string; pagination?: Record<string, unknown> | null }
) {
  if (!ctx.user) {
    const tErrors = ctx.t().errorsTranslations;
    throw new UnauthorizedError(tErrors.unauthorized);
  }
  const pagination = args.pagination ? new PaginationArgs(args.pagination) : null;
  const result = await TeacherDashboardService.getDashboard(ctx.user.id, args.date, pagination, ctx.locale);
  const tErrors = ctx.t().errorsTranslations;

  const effectiveMeetings = await Promise.all(
    result.scheduleRows.map(r => EffectiveMeetingService.resolveForClassInstance(r.id, tErrors))
  );

  return {
    ...result,
    scheduleRows: result.scheduleRows.map((r, i) => {
      const meeting = effectiveMeetings[i];
      return {
        id: r.id,
        studentId: r.studentId,
        studentName: r.student?.name || "Student",
        scheduledStartAt: r.scheduledStartAt,
        scheduledEndAt: r.scheduledEndAt,
        durationMinutes: r.durationMinutes,
        executionState: r.executionState,
        outcome: r.outcome ?? null,
        meetingJoinUrl: meeting?.joinUrl ?? null,
        effectiveMeeting: meeting ?? null,
        yourTimeFormatted: r.yourTimeFormatted ?? null,
        isFrozen: r.isFrozen ?? false,
      };
    }),
  };
}

gqlSchemaBuilder.queryField("teacherDashboard", t =>
  t.field({
    type: TeacherDashboardPothosObject,
    args: {
      date: t.arg.string({ required: true }),
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => resolveTeacherDashboard(ctx, args),
  })
);

gqlSchemaBuilder.queryField("teacherHandbookUrl", t =>
  t.field({
    type: TeacherHandbookUrlPothosObject,
    authScopes: { loggedIn: true },
    resolve: async (_parent, _args, ctx) => {
      if (!ctx.user) {
        const tErrors = ctx.t().errorsTranslations;
        throw new UnauthorizedError(tErrors.unauthorized);
      }
      const tErrors = ctx.t().errorsTranslations;
      const url = await TeacherDashboardService.getHandbookDownloadUrl(ctx.user.id, tErrors);
      return { id: `handbook-${ctx.user.id}`, url };
    },
  })
);
