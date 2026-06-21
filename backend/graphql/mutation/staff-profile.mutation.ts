import { getBackendTranslations } from "@/backend/lib/intl";
import { StaffProfileService } from "@/backend/services/staff/staff-profile.service";
import type { BaseContext } from "../gqlContext";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import {
  TeacherProfileResultPothosObject,
  TeacherProfileUpdateInputPothosObject,
} from "../pothos/staff-profile.pothos";

async function requireAuth(ctx: BaseContext): Promise<string> {
  if (!ctx.user?.id) {
    const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
    throw new Error(tFunc("unauthorized"));
  }
  return ctx.user.id;
}

gqlSchemaBuilder.queryField("teacherProfileForEdit", t =>
  t.field({
    type: TeacherProfileResultPothosObject,
    args: { teacherId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return StaffProfileService.getTeacherProfileForEdit(userId, args.teacherId as string, ctx.locale);
    },
  })
);

gqlSchemaBuilder.mutationField("updateTeacherProfile", t =>
  t.field({
    type: TeacherProfileResultPothosObject,
    args: {
      teacherId: t.arg.id({ required: true }),
      input: t.arg({ type: TeacherProfileUpdateInputPothosObject, required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return StaffProfileService.updateTeacherProfile(userId, args.teacherId as string, args.input, ctx.locale);
    },
  })
);
