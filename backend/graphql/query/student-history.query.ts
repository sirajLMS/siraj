import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  StudentClassHistoryPothosObject,
  StudentSessionDetailPothosObject,
} from "@/backend/graphql/pothos/student-history.pothos";
import { getBackendTranslations } from "@/backend/lib/intl";
import { StudentHistoryService } from "@/backend/services/history/student-history.service";

gqlSchemaBuilder.queryField("studentClassHistory", t =>
  t.field({
    type: StudentClassHistoryPothosObject,
    args: {
      studentId: t.arg.id({ required: true }),
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true }),
    },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      return StudentHistoryService.getStudentClassHistory(
        ctx.user.id,
        args.studentId,
        args.year,
        args.month,
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.queryField("studentClassSessionDetail", t =>
  t.field({
    type: StudentSessionDetailPothosObject,
    args: { classInstanceId: t.arg.id({ required: true }) },
    authScopes: { loggedIn: true },
    resolve: async (_parent, args, ctx) => {
      if (!ctx.user) {
        const tFunc = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
        throw new Error(tFunc("unauthorized"));
      }
      return StudentHistoryService.getStudentClassSessionDetail(ctx.user.id, args.classInstanceId, ctx.locale);
    },
  })
);
