import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { StudentProfilePothosObject } from "@/backend/graphql/pothos/students/student-profile.pothos";
import { resolveStudentIdFromArgsOrUser } from "@/backend/graphql/query/students/__shared__/resolveStudentIdFromArgsOrUser";
import { StudentProfileService } from "@/backend/services";

gqlSchemaBuilder.queryField("studentProfile", t =>
  t.field({
    type: StudentProfilePothosObject,
    args: {
      studentId: t.arg.string({ required: false }),
      year: t.arg.int({ required: false }),
      month: t.arg.int({ required: false }),
      includeUpcomingClasses: t.arg.boolean({ required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const studentId = await resolveStudentIdFromArgsOrUser(args.studentId, ctx);
      const tErrors = ctx.t().errorsTranslations;
      const userId = ctx.user?.id;
      if (!userId) throw new Error(tErrors.unauthorized);
      return StudentProfileService.getProfile(userId, studentId, tErrors, {
        year: args.year,
        month: args.month,
        includeUpcomingClasses: args.includeUpcomingClasses ?? true,
      });
    },
  })
);
