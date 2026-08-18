import type { ObjectRef } from "@pothos/core";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import type { StudentMonthlyReportReturnType, TeacherMonthlyReportReturnType } from "@/backend/types";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;

/**
 * Options for the teacherMonthlyReport query field.
 */
interface TeacherMonthlyReportQueryOptions {
  fieldName: string;
  returnType: ObjectRef<BuilderTypes, TeacherMonthlyReportReturnType>;
  description: string;
  getReport: (
    userId: string,
    teacherId: string,
    year: number,
    month: number,
    locale: string
  ) => Promise<TeacherMonthlyReportReturnType>;
}

/**
 * Options for the studentMonthlyReport query field.
 */
interface StudentMonthlyReportQueryOptions {
  fieldName: string;
  returnType: ObjectRef<BuilderTypes, StudentMonthlyReportReturnType>;
  description: string;
  getReport: (
    userId: string,
    studentId: string,
    year: number,
    month: number,
    locale: string
  ) => Promise<StudentMonthlyReportReturnType>;
}

/**
 * Factory for the `teacherMonthlyReport` query field.
 *
 * Each entity-id arg name is hardcoded so Pothos' arg-type inference keeps
 * `args.year`/`args.month` typed as `number`. Specializing per return type
 * sidesteps Pothos' `Resolver` conditional, which cannot be evaluated for a
 * generic shape.
 */
export function makeTeacherMonthlyReportQueryField(opts: TeacherMonthlyReportQueryOptions): void {
  gqlSchemaBuilder.queryField(opts.fieldName, t =>
    t.field({
      type: opts.returnType,
      nullable: false,
      description: opts.description,
      authScopes: { loggedIn: true },
      args: {
        teacherId: t.arg.id({ required: true }),
        year: t.arg.int({ required: true }),
        month: t.arg.int({ required: true }),
      },
      resolve: async (_root, args, ctx) => {
        const userId = await requireAuth(ctx);
        return opts.getReport(userId, args.teacherId, args.year, args.month, ctx.locale);
      },
    })
  );
}

/**
 * Factory for the `studentMonthlyReport` query field.
 *
 * Each entity-id arg name is hardcoded so Pothos' arg-type inference keeps
 * `args.year`/`args.month` typed as `number`. Specializing per return type
 * sidesteps Pothos' `Resolver` conditional, which cannot be evaluated for a
 * generic shape.
 */
export function makeStudentMonthlyReportQueryField(opts: StudentMonthlyReportQueryOptions): void {
  gqlSchemaBuilder.queryField(opts.fieldName, t =>
    t.field({
      type: opts.returnType,
      nullable: false,
      description: opts.description,
      authScopes: { loggedIn: true },
      args: {
        studentId: t.arg.id({ required: true }),
        year: t.arg.int({ required: true }),
        month: t.arg.int({ required: true }),
      },
      resolve: async (_root, args, ctx) => {
        const userId = await requireAuth(ctx);
        return opts.getReport(userId, args.studentId, args.year, args.month, ctx.locale);
      },
    })
  );
}
