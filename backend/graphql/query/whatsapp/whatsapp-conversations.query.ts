import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import {
  WhatsappConversationThreadPothosObject,
  WhatsappTestRecipientPothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-conversations.pothos";
import { WhatsappConversationsResultPothosObject } from "@/backend/graphql/pothos/whatsapp/whatsapp-inbox.pothos";
import { WhatsappConversationsService } from "@/backend/services";
import type {
  UserPermissionContext,
  WhatsappConversationMessagesInput,
  WhatsappConversationsListInput,
} from "@/backend/types";

/**
 * WhatsApp conversations workspace read surface: the per-account conversations
 * list, a single conversation thread (row detail + paginated messages), and
 * the test-recipient registry. All fields are gated on
 * `WHATSAPP_CONVERSATIONS_VIEW` at both the resolver (authScopes) and service
 * layers; the already-populated UserPermissionContext from ctx is handed to
 * the service so no extra permission-context round-trip happens per request.
 */

function permissionContext(ctx: BaseContext): UserPermissionContext {
  return {
    permissions: ctx.permissions,
    permissionGroups: ctx.permissionGroups,
    isSuperAdmin: ctx.isSuperAdmin,
    role: ctx.role,
  };
}

gqlSchemaBuilder.queryFields(t => ({
  whatsappConversationThreads: t.field({
    type: WhatsappConversationsResultPothosObject,
    description:
      "Paginated conversations list for the conversations workspace; spans all accounts when `accountId` is omitted.",
    authScopes: { permission: AppPermission.WHATSAPP_CONVERSATIONS_VIEW },
    args: {
      accountId: t.arg.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const input: WhatsappConversationsListInput = {
        accountId: args.accountId ?? null,
        paginationArgs: args.pagination ?? null,
      };
      return WhatsappConversationsService.listConversations(permissionContext(ctx), tErrors, input);
    },
  }),

  whatsappConversationThread: t.field({
    type: WhatsappConversationThreadPothosObject,
    description: "One conversation thread for the workspace: the conversation detail plus its paginated messages.",
    authScopes: { permission: AppPermission.WHATSAPP_CONVERSATIONS_VIEW },
    args: {
      id: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const input: WhatsappConversationMessagesInput = {
        conversationId: args.id,
        paginationArgs: args.pagination ?? null,
      };
      return WhatsappConversationsService.getConversationThread(permissionContext(ctx), tErrors, input);
    },
  }),

  whatsappTestRecipients: t.field({
    type: [WhatsappTestRecipientPothosObject],
    description: "Registered recipients for a Meta test number (the per-account allow-list).",
    authScopes: { permission: AppPermission.WHATSAPP_CONVERSATIONS_VIEW },
    args: {
      accountId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      return WhatsappConversationsService.listRecipients(permissionContext(ctx), tErrors, {
        accountId: args.accountId,
      });
    },
  }),
}));
