import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  TeacherProfileResultPothosObject,
  TeacherProfileUpdateInputPothosObject,
} from "@/backend/graphql/pothos/staff-profile.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { StaffProfileService } from "@/backend/services/staff/staff-profile.service";

gqlSchemaBuilder.queryField("teacherProfileForEdit", t =>
  t.field({
    type: TeacherProfileResultPothosObject,
    args: { teacherId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const userId = await requireAuth(ctx);
      return StaffProfileService.getTeacherProfileForEdit(userId, args.teacherId, ctx.locale);
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
      return StaffProfileService.updateTeacherProfile(userId, args.teacherId, args.input, ctx.locale);
    },
  })
);
