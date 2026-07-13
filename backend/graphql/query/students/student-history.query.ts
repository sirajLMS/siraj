import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  StudentClassHistoryPothosObject,
  StudentSessionDetailPothosObject,
} from "@/backend/graphql/pothos/students/student-history.pothos";
import { getBackendTranslations } from "@/backend/lib/intl";
import { StudentHistoryService } from "@/backend/services/history/student-history.service";

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
      return StudentHistoryService.getStudentClassHistory(ctx.user.id, studentId, args.year, args.month, ctx.locale);
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
