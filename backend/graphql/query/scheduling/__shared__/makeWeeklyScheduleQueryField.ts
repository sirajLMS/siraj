import type { ObjectRef } from "@pothos/core";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import type {
  WeeklyScheduleGridReturnType,
  WeeklyWorkloadMetricsReturnType,
} from "@/backend/types/scheduling/schedule.types";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type ErrorsTranslations = ReturnType<import("@/backend/graphql/gqlContext").BaseContext["t"]>["errorsTranslations"];

/**
 * Registers the `teacherWeeklyScheduleGrid` query field.
 *
 * Shared args/auth/resolve-prelude with `teacherWorkloadMetrics`:
 * - args: `{ teacherId?: string, weekDate: string }`
 * - authScopes: `{ loggedIn: true }`
 * - resolve: `requireAuth(ctx)` → `ctx.t().errorsTranslations` → service call
 *
 * Specialising per concrete return type sidesteps Pothos' `Resolver`
 * conditional, which cannot be evaluated for a generic shape.
 */
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
      args: {
        teacherId: t.arg.string({ required: false }),
        weekDate: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx) => {
        const userId = await requireAuth(ctx);
        const tErrors = ctx.t().errorsTranslations;
        return getService(userId, args.teacherId || null, args.weekDate, tErrors);
      },
    })
  );
}

/**
 * Registers the `teacherWorkloadMetrics` query field.
 *
 * Shared args/auth/resolve-prelude with `teacherWeeklyScheduleGrid`:
 * - args: `{ teacherId?: string, weekDate: string }`
 * - authScopes: `{ loggedIn: true }`
 * - resolve: `requireAuth(ctx)` → `ctx.t().errorsTranslations` → service call
 */
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
      args: {
        teacherId: t.arg.string({ required: false }),
        weekDate: t.arg.string({ required: true }),
      },
      resolve: async (_root, args, ctx) => {
        const userId = await requireAuth(ctx);
        const tErrors = ctx.t().errorsTranslations;
        return getService(userId, args.teacherId || null, args.weekDate, tErrors);
      },
    })
  );
}
