import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";

type DeleteResolverFn = (userId: string, id: string, locale?: string) => Promise<unknown>;
type UpdateResolverFn<TInput> = (userId: string, id: string, input: TInput, locale?: string) => Promise<unknown>;

/**
 * Registers a Boolean-returning delete mutation field on the schema builder.
 * Shared by class-subject and class-category mutations to avoid duplication.
 */
export function registerDeleteMutation(fieldName: string, resolverFn: DeleteResolverFn): void {
  gqlSchemaBuilder.mutationField(fieldName, t =>
    t.field({
      type: "Boolean",
      args: {
        id: t.arg.id({ required: true }),
      },
      authScopes: { loggedIn: true },
      resolve: async (_parent, args, ctx: BaseContext) => {
        const userId = await requireAuth(ctx);
        await resolverFn(userId, args.id, ctx.locale);
        return true;
      },
    })
  );
}

/**
 * Registers an update mutation field with id + input args on the schema builder.
 * Avoids duplicating the shared mutation structure (authScopes, requireAuth, locale)
 * across class-category and class-subject update mutations.
 */
export function registerUpdateMutation<TInput>(
  fieldName: string,
  objectType: ReturnType<typeof gqlSchemaBuilder.objectRef>,
  inputType: ReturnType<typeof gqlSchemaBuilder.inputRef>,
  resolverFn: UpdateResolverFn<TInput>
): void {
  gqlSchemaBuilder.mutationField(fieldName, t =>
    t.field({
      type: objectType,
      args: {
        id: t.arg.id({ required: true }),
        input: t.arg({ type: inputType, required: true }),
      },
      authScopes: { loggedIn: true },
      resolve: async (_parent, args, ctx: BaseContext) => {
        const userId = await requireAuth(ctx);
        // args.input is already typed correctly by Pothos based on inputType
        return resolverFn(userId, args.id, args.input as TInput, ctx.locale);
      },
    })
  );
}
