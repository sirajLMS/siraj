import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  StudentClassHistoryPothosObject,
  StudentSessionDetailPothosObject,
} from "@/backend/graphql/pothos/students/student-history.pothos";
import { resolveStudentIdFromArgsOrUser } from "@/backend/graphql/query/students/__shared__/resolveStudentIdFromArgsOrUser";
import { StudentHistoryService } from "@/backend/services";

gqlSchemaBuilder.queryField("studentClassHistory", t =>
  t.field({
    type: StudentClassHistoryPothosObject,
    args: {
      studentId: t.arg.id({ required: false }),
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const studentId = await resolveStudentIdFromArgsOrUser(args.studentId, ctx);
      const tErrors = ctx.t().errorsTranslations;
      const userId = ctx.user?.id;
      if (!userId) throw new Error(tErrors.unauthorized);
      return StudentHistoryService.getStudentClassHistory(userId, studentId, args.year, args.month, tErrors);
    },
  })
);

gqlSchemaBuilder.queryField("studentClassSessionDetail", t =>
  t.field({
    type: StudentSessionDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      if (!ctx.user) {
        throw new Error(tErrors.unauthorized);
      }
      return StudentHistoryService.getStudentClassSessionDetail(ctx.user.id, args.classInstanceId, tErrors);
    },
  })
);
