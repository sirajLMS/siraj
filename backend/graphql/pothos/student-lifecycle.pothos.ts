import { StudentLifecycleService } from "@/backend/services/student/student-lifecycle.service";
import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

// ─── ReassignStudentTeacherResult Object ─────────────────────────────────────

export type ReassignStudentTeacherResultDefinition = {
  id: string;
  primaryTeacherId: string | null;
  version: number;
};

const ReassignStudentTeacherResultRef =
  gqlSchemaBuilder.objectRef<ReassignStudentTeacherResultDefinition>("ReassignStudentTeacherResult");

export const ReassignStudentTeacherResultPothosObject = ReassignStudentTeacherResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    primaryTeacherId: t.exposeString("primaryTeacherId", { nullable: true }),
    version: t.exposeInt("version"),
  }),
});

// ─── ChangeStudentStatusResult Object ────────────────────────────────────────

export type ChangeStudentStatusResultDefinition = {
  id: string;
  status: string;
  version: number;
};

const ChangeStudentStatusResultRef =
  gqlSchemaBuilder.objectRef<ChangeStudentStatusResultDefinition>("ChangeStudentStatusResult");

export const ChangeStudentStatusResultPothosObject = ChangeStudentStatusResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    status: t.exposeString("status"),
    version: t.exposeInt("version"),
  }),
});

// ─── Mutations ───────────────────────────────────────────────────────────────

gqlSchemaBuilder.mutationField("reassignStudentTeacher", t =>
  t.field({
    type: ReassignStudentTeacherResultRef,
    args: {
      studentId: t.arg.string({ required: true }),
      newTeacherId: t.arg.string({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      return StudentLifecycleService.reassignTeacher(
        ctx.user?.id || "",
        args.studentId,
        args.newTeacherId,
        args.expectedVersion ?? undefined,
        ctx.locale
      );
    },
  })
);

gqlSchemaBuilder.mutationField("changeStudentStatus", t =>
  t.field({
    type: ChangeStudentStatusResultRef,
    args: {
      studentId: t.arg.string({ required: true }),
      newStatus: t.arg.string({ required: true }),
      expectedVersion: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      return StudentLifecycleService.changeStudentStatus(
        ctx.user?.id || "",
        args.studentId,
        args.newStatus,
        args.expectedVersion ?? undefined,
        ctx.locale
      );
    },
  })
);
