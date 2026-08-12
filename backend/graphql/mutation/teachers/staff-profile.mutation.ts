import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { resolveDisplayAmountFields } from "@/backend/graphql/pothos/billing/fx-display.pothos";
import {
  TeacherProfileResultPothosObject,
  TeacherProfileUpdateInputPothosObject,
} from "@/backend/graphql/pothos/teachers/staff-profile.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { StaffProfileService } from "@/backend/services/staff/staff-profile.service";
import type { TeacherProfileReturnType } from "@/backend/types";

async function enrichWithDisplayAmount(
  profile: TeacherProfileReturnType,
  ctx: BaseContext
): Promise<TeacherProfileReturnType & { displayAmount: unknown }> {
  const displayAmounts = await resolveDisplayAmountFields([profile], ctx, "hourlyRate", "rateCurrency", "userId");
  return {
    ...profile,
    displayAmount: displayAmounts.get(profile.id) ?? null,
  };
}

gqlSchemaBuilder.queryField("teacherProfileForEdit", t =>
  t.field({
    type: TeacherProfileResultPothosObject,
    args: { teacherId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      const result = await StaffProfileService.getTeacherProfileForEdit(userId, args.teacherId, ctx.locale);
      return enrichWithDisplayAmount(result, ctx);
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
      const result = await StaffProfileService.updateTeacherProfile(userId, args.teacherId, args.input, ctx.locale);
      return enrichWithDisplayAmount(result, ctx);
    },
  })
);
