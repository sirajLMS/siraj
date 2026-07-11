import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { deleteEntityResolver } from "@/backend/graphql/utils";

/**
 * Common update input fields shared by class-category and class-subject update mutations.
 * Both entities expose `description`, `isActive`, and `sortOrder` on their update inputs
 * with the same `?? undefined` coercion pattern.
 */
export function commonClassUpdateInputFields<
  T extends {
    description?: string | null;
    isActive?: boolean | null;
    sortOrder?: number | null;
  },
>(
  input: T
): {
  description: T["description"];
  isActive: boolean | undefined;
  sortOrder: number | undefined;
} {
  return {
    description: input.description,
    isActive: input.isActive ?? undefined,
    sortOrder: input.sortOrder ?? undefined,
  };
}

/**
 * Registers a standard "delete entity by id" Boolean mutation field.
 *
 * Encapsulates the common pattern: a Boolean mutation accepting a required `id`
 * argument, `loggedIn` auth scope, and a resolver that authenticates, invokes
 * the entity-specific delete service, and returns `true`.
 *
 * @param fieldName - The GraphQL mutation field name (e.g. "deleteClassCategory")
 * @param deleteFn - The service delete function `(userId, entityId, locale?) => Promise<unknown>`
 */
export function registerDeleteEntityMutation(
  fieldName: string,
  deleteFn: (userId: string, entityId: string, locale?: string) => Promise<unknown>
): void {
  gqlSchemaBuilder.mutationField(fieldName, t =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg.id({ required: true }),
      },
      authScopes: { loggedIn: true },
      resolve: async (_parent, args, ctx) => {
        return deleteEntityResolver(ctx, args.id, deleteFn);
      },
    })
  );
}
