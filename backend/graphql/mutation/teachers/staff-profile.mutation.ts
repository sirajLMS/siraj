import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  TeacherProfileResultPothosObject,
  TeacherProfileUpdateInputPothosObject,
} from "@/backend/graphql/pothos/teachers/staff-profile.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { enrichWithDisplayAmount } from "@/backend/graphql/utils/staff-profile.utils";
import { StaffProfileService } from "@/backend/services";

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
