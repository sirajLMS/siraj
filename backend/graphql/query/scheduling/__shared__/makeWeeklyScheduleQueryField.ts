import type { ObjectRef, RootFieldBuilder } from "@pothos/core";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import type { WeeklyScheduleGridReturnType, WeeklyWorkloadMetricsReturnType } from "@/backend/types";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type QueryFieldBuilder = RootFieldBuilder<BuilderTypes, unknown, "Query">;
type ErrorsTranslations = ReturnType<BaseContext["t"]>["errorsTranslations"];

/** Shared args for teacher-weekly query fields (`teacherId?`, `weekDate`). */
function teacherWeeklyArgs(t: QueryFieldBuilder) {
  return {
    teacherId: t.arg.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
    weekDate: t.arg.string({ required: true, directives: { constraint: { maxLength: 10 } } }),
  };
}

/** Shared resolve prelude for teacher-weekly query fields. */
function teacherWeeklyResolve<TResult>(
  getService: (
    userId: string,
    teacherId: string | null,
    weekDate: string,
    tErrors: ErrorsTranslations
  ) => Promise<TResult>
) {
  return async (
    _root: unknown,
    args: { teacherId?: string | null; weekDate: string },
    ctx: BaseContext
  ): Promise<TResult> => {
    const userId = await requireAuth(ctx);
    const tErrors = ctx.t().errorsTranslations;
    return getService(userId, args.teacherId ?? null, args.weekDate, tErrors);
  };
}

/** Registers the `teacherWeeklyScheduleGrid` query field. */
export function makeTeacherWeeklyScheduleGridField(
  returnType: ObjectRef<BuilderTypes, WeeklyScheduleGridReturnType>,
  getService: (
    userId: string,
    teacherId: string | null,
    weekDate: string,
    tErrors: ErrorsTranslations
  ) => Promise<WeeklyScheduleGridReturnType>
): void {
  gqlSchemaBuilder.queryField("teacherWeeklyScheduleGrid", t =>
    t.field({
      type: returnType,
      authScopes: { loggedIn: true },
      args: teacherWeeklyArgs(t),
      resolve: teacherWeeklyResolve(getService),
    })
  );
}

/** Registers the `teacherWorkloadMetrics` query field. */
export function makeTeacherWorkloadMetricsField(
  returnType: ObjectRef<BuilderTypes, WeeklyWorkloadMetricsReturnType>,
  getService: (
    userId: string,
    teacherId: string | null,
    weekDate: string,
    tErrors: ErrorsTranslations
  ) => Promise<WeeklyWorkloadMetricsReturnType>
): void {
  gqlSchemaBuilder.queryField("teacherWorkloadMetrics", t =>
    t.field({
      type: returnType,
      authScopes: { loggedIn: true },
      args: teacherWeeklyArgs(t),
      resolve: teacherWeeklyResolve(getService),
    })
  );
}
