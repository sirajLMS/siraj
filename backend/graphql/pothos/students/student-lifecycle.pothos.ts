import { AppPermission } from "@/backend/enum";
import { requireUserId } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { StudentStatusPothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";
import { StudentLifecycleService } from "@/backend/services";
import type { ChangeStudentStatusResult, ReassignStudentTeacherResult } from "@/backend/types";

// ─── ReassignStudentTeacherResult Object ─────────────────────────────────────

const ReassignStudentTeacherResultRef =
  gqlSchemaBuilder.objectRef<ReassignStudentTeacherResult>("ReassignStudentTeacherResult");

export const ReassignStudentTeacherResultPothosObject = ReassignStudentTeacherResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
    version: t.exposeInt("version"),
  }),
});

// ─── ChangeStudentStatusResult Object ────────────────────────────────────────

const ChangeStudentStatusResultRef = gqlSchemaBuilder.objectRef<ChangeStudentStatusResult>("ChangeStudentStatusResult");

export const ChangeStudentStatusResultPothosObject = ChangeStudentStatusResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    status: t.expose("status", { type: StudentStatusPothosObject }),
    version: t.exposeInt("version"),
  }),
});

// ─── Mutations ───────────────────────────────────────────────────────────────

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
