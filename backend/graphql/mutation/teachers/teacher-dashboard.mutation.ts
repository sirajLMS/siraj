import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ClassInstanceDetailPothosObject,
  SupportRequestResultPothosObject,
} from "@/backend/graphql/pothos/classes/class-session.pothos";
import {
  CreateManualClassEntryInputPothosObject,
  LogSupportRequestInputPothosObject,
} from "@/backend/graphql/pothos/teachers/teacher-dashboard.pothos";
import { ClassSessionService } from "@/backend/services/session/class-session.service";
import { TeacherDashboardService } from "@/backend/services/teacher/teacher-dashboard.service";

// ─── Mutations ────────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("createTeacherManualClassEntry", t =>
  t.field({
    type: ClassInstanceDetailPothosObject,
    args: {
      input: t.arg({ type: CreateManualClassEntryInputPothosObject, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tErrors = await ctx.t("errors");
        throw new Error(tErrors.unauthorized);
      }
      const created = await TeacherDashboardService.createManualEntry(
        ctx.user.id,
        {
          studentId: args.input.studentId,
          teacherId: args.input.teacherId,
          scheduledStartAt: args.input.scheduledStartAt,
          scheduledEndAt: args.input.scheduledEndAt,
          durationMinutes: args.input.durationMinutes,
          classType: (args.input.classType as "REGULAR" | "TRIAL" | "PROMOTION" | undefined) ?? undefined,
        },
        ctx.locale
      );
      return ClassSessionService.getClassInstanceDetail(ctx.user.id, created.id, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("logTeacherSupportRequest", t =>
  t.field({
    type: SupportRequestResultPothosObject,
    args: {
      input: t.arg({ type: LogSupportRequestInputPothosObject, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tErrors = await ctx.t("errors");
        throw new Error(tErrors.unauthorized);
      }
      const result = await TeacherDashboardService.logSupportRequest(
        ctx.user.id,
        { reason: args.input.reason },
        ctx.locale
      );
      return { id: result.id, success: true };
    },
  })
);
