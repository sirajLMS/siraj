import type { RootFieldBuilder } from "@pothos/core";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;

export type ReportQueryFieldBuilder = RootFieldBuilder<BuilderTypes, unknown, "Query">;

/**
 * Standard limit/offset page arguments for the paginated report query fields
 * (expenses, session audit, carryover, payroll): max 200 rows per page with a
 * 50-row default, and a zero-based offset.
 */
export function reportPaginationArgs(t: ReportQueryFieldBuilder) {
  return {
    limit: t.arg.int({
      required: false,
      defaultValue: 50,
      description: "Max rows per page (max 200)",
      directives: { constraint: { min: 1, max: 200 } },
    }),
    offset: t.arg.int({ required: false, defaultValue: 0 }),
  };
}

/**
 * Page window handed to the report services; the fallbacks mirror the arg
 * defaults above.
 */
export function reportPageWindow(args: { limit?: number | null; offset?: number | null }) {
  return { limit: args.limit ?? 50, offset: args.offset ?? 0 };
}

/**
 * Auth and locale prelude shared by the report query resolvers: resolves the
 * caller and binds the error translations for localized service errors.
 */
export async function reportResolverContext(ctx: BaseContext) {
  return { actorUserId: await requireAuth(ctx), tErrors: ctx.t().errorsTranslations };
}
