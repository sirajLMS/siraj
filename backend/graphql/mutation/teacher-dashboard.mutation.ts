import { getBackendTranslations } from "@/backend/lib/intl";
import { TeacherDashboardService } from "@/backend/services/teacher/teacher-dashboard.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { ClassInstanceDetailPothosObject, SupportRequestResultPothosObject } from "../pothos/class-session.pothos";
import {
  CreateManualClassEntryInputPothosObject,
  LogSupportRequestInputPothosObject,
} from "../pothos/teacher-dashboard.pothos";
import { resolveDetail } from "../utils/class-session.utils";

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
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
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
      return resolveDetail(created.id);
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
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
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
