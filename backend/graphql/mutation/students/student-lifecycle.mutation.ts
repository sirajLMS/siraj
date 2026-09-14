import { AppPermission } from "@/backend/enum";
import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  ChangeStudentStatusResultRef,
  ReassignStudentTeacherResultRef,
  StudentStatusPothosObject,
} from "@/backend/graphql/pothos";
import { StudentLifecycleService } from "@/backend/services";

gqlSchemaBuilder.mutationField("reassignStudentTeacher", t =>
  t.field({
    type: ReassignStudentTeacherResultRef,
    authScopes: { permission: AppPermission.STUDENT_REASSIGN_TEACHER },
    args: {
      studentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      newTeacherId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      return StudentLifecycleService.reassignTeacher(
        requireUserId(ctx),
        args.studentId,
        args.newTeacherId,
        tErrors,
        args.expectedVersion ?? undefined
      );
    },
  })
);

gqlSchemaBuilder.mutationField("changeStudentStatus", t =>
  t.field({
    type: ChangeStudentStatusResultRef,
    authScopes: { permission: AppPermission.STUDENT_MANAGE_STATUS },
    args: {
      studentId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      newStatus: t.arg({ type: StudentStatusPothosObject, required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      return StudentLifecycleService.changeStudentStatus(
        requireUserId(ctx),
        args.studentId,
        args.newStatus,
        tErrors,
        args.expectedVersion ?? undefined
      );
    },
  })
);
