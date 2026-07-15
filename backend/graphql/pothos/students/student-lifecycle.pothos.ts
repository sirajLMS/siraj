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
    authScopes: { superAdmin: true },
    args: {
      studentId: t.arg.string({ required: true }),
      newTeacherId: t.arg.string({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = await ctx.t("errors");
      return StudentLifecycleService.reassignTeacher(
        ctx.user?.id || "",
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
    authScopes: { superAdmin: true },
    args: {
      studentId: t.arg.string({ required: true }),
      newStatus: t.arg({ type: StudentStatusPothosObject, required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      const tErrors = await ctx.t("errors");
      return StudentLifecycleService.changeStudentStatus(
        ctx.user?.id || "",
        args.studentId,
        args.newStatus,
        tErrors,
        args.expectedVersion ?? undefined
      );
    },
  })
);
