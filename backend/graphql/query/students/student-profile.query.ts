import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { StudentProfilePothosObject } from "@/backend/graphql/pothos/students/student-profile.pothos";
import { getBackendTranslations } from "@/backend/lib/intl";
import { StudentProfileService } from "@/backend/services/student/student-profile.service";

gqlSchemaBuilder.queryField("studentProfile", t =>
  t.field({
    type: StudentProfilePothosObject,
    args: {
      studentId: t.arg.string({ required: true }),
      year: t.arg.int({ required: false }),
      month: t.arg.int({ required: false }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      return StudentProfileService.getProfile(
        ctx.user.id,
        args.studentId,
        { year: args.year, month: args.month },
        ctx.locale
      );
    },
  })
);
