import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";

/**
 * Registers a `delete<Entity>` root mutation field that returns `Boolean`.
 * Encapsulates the common pattern: authenticate via `requireAuth`, invoke a
 * service delete function with `(userId, id, locale)`, and return `true`.
 *
 * This eliminates the SonarQube-tracked duplication across mutation files that
 * share the identical delete-by-id resolver boilerplate.
 */
export function registerDeleteMutation(
  fieldName: string,
  deleteFn: (userId: string, id: string, locale?: string) => Promise<void>
): void {
  gqlSchemaBuilder.mutationField(fieldName, t =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg.id({ required: true }),
      },
      authScopes: { loggedIn: true },
      resolve: async (_parent, args, ctx: BaseContext) => {
        const userId = await requireAuth(ctx);
        await deleteFn(userId, args.id, ctx.locale);
        return true;
      },
    })
  );
}
