import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { StudentProfilePothosObject } from "@/backend/graphql/pothos/students/student-profile.pothos";
import { getBackendTranslations } from "@/backend/lib/intl";
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
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      let studentId = args.studentId;
      if (!studentId) {
        studentId = await StudentRepository.getStudentIdByUserId(ctx.user.id);
        if (!studentId) {
          const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
          throw new Error(tFunc("studentNotFound", { id: ctx.user.id }));
        }
      }
      return StudentProfileService.getProfile(
        ctx.user.id,
        studentId,
        { year: args.year, month: args.month },
        ctx.locale
      );
    },
  })
);
