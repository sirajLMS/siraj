import { getBackendTranslations } from "@/backend/lib/intl";
import { StudentStatusService } from "@/backend/services";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";
import { StudentUpcomingClassesResultPothosObject } from "../pothos/student-status.pothos";

gqlSchemaBuilder.queryField("studentUpcomingClasses", t =>
  t.field({
    type: StudentUpcomingClassesResultPothosObject,
    args: {
      studentId: t.arg.string({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      return StudentStatusService.getUpcomingClasses(ctx.user.id, args.studentId, ctx.locale);
    },
  })
);
