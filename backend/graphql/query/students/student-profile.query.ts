import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { StudentProfilePothosObject } from "@/backend/graphql/pothos/students/student-profile.pothos";
import { StudentProfileService } from "@/backend/services/student/student-profile.service";

gqlSchemaBuilder.queryField("studentProfile", t =>
  t.field({
    type: StudentProfilePothosObject,
    args: {
      studentId: t.arg.string({ required: false }),
      year: t.arg.int({ required: false }),
      month: t.arg.int({ required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      if (!ctx.user) {
        throw new Error(tErrors.unauthorized);
      }
      let studentId = args.studentId;
      if (!studentId) {
        studentId = await StudentRepository.getStudentIdByUserId(ctx.user.id);
        if (!studentId) {
          throw new Error(tErrors.studentNotFound(ctx.user.id));
        }
      }
      return StudentProfileService.getProfile(ctx.user.id, studentId, { year: args.year, month: args.month }, tErrors);
    },
  })
);
