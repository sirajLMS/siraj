import type { RootFieldBuilder } from "@pothos/core";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import type { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { whatsappQueryPermissionContext } from "@/backend/graphql/query/whatsapp/__shared__/whatsapp-query-permission-context";
import type { PaginationInput, UserPermissionContext, WhatsappConversationsListInput } from "@/backend/types";

type BuilderTypes = typeof gqlSchemaBuilder extends { $inferSchemaTypes: infer T } ? T : never;
type QueryFieldBuilder = RootFieldBuilder<BuilderTypes, unknown, "Query">;
type ErrorsTranslations = ReturnType<BaseContext["t"]>["errorsTranslations"];

type ListConversationsFn<TResult> = (
  permissionContext: UserPermissionContext,
  tErrors: ErrorsTranslations,
  input: WhatsappConversationsListInput
) => Promise<TResult>;

/** Shared args for WhatsApp conversations-list query fields (`accountId?`, `pagination?`). */
export function whatsappConversationsListArgs(t: QueryFieldBuilder) {
  return {
    accountId: t.arg.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
    pagination: t.arg({ type: PaginationArgsObject, required: false }),
  };
}

/** Shared resolve for WhatsApp conversations-list query fields: builds the list input and delegates to the caller's service. */
export function whatsappConversationsListResolve<TResult>(listConversations: ListConversationsFn<TResult>) {
  return async (
    _root: unknown,
    args: { accountId?: string | null; pagination?: PaginationInput | null },
    ctx: BaseContext
  ): Promise<TResult> => {
    const tErrors = ctx.t().errorsTranslations;
    const input: WhatsappConversationsListInput = {
      accountId: args.accountId ?? null,
      paginationArgs: args.pagination ?? null,
    };
    return listConversations(whatsappQueryPermissionContext(ctx), tErrors, input);
  };
}
