import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { StudentUpcomingClassesResultPothosObject } from "@/backend/graphql/pothos/students/student-status.pothos";
import { StudentStatusService } from "@/backend/services";

gqlSchemaBuilder.queryField("studentUpcomingClasses", t =>
  t.field({
    type: StudentUpcomingClassesResultPothosObject,
    args: {
      studentId: t.arg.string({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      if (!ctx.user) {
        throw new Error(tErrors.unauthorized);
      }
      return StudentStatusService.getUpcomingClasses(ctx.user.id, args.studentId, tErrors);
    },
  })
);
