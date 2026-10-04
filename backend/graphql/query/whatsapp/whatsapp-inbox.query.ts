import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import {
  WhatsappAccountSyncOverviewPothosObject,
  WhatsappConversationMessagesResultPothosObject,
  WhatsappConversationsResultPothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-inbox.pothos";
import {
  whatsappConversationsListArgs,
  whatsappConversationsListResolve,
  whatsappQueryPermissionContext,
} from "@/backend/graphql/query/whatsapp/__shared__";
import { WhatsappInboxService } from "@/backend/services";
import type { WhatsappConversationMessagesInput } from "@/backend/types";

/**
 * WhatsApp inbox read surface: conversation list, per-thread messages, and the
 * coexistence sync overview. Resolver + service both gate on
 * `WHATSAPP_INBOX_VIEW`; the resolver hands the already-populated
 * `UserPermissionContext` from ctx to the service so no extra
 * `PermissionsService.getUserContext` round-trip happens per request.
 */

gqlSchemaBuilder.queryFields(t => ({
  whatsappConversations: t.field({
    type: WhatsappConversationsResultPothosObject,
    description: "Paginated WhatsApp inbox conversation list. Spans all accounts when `accountId` is omitted.",
    authScopes: { permission: AppPermission.WHATSAPP_INBOX_VIEW },
    args: whatsappConversationsListArgs(t),
    resolve: whatsappConversationsListResolve(WhatsappInboxService.listConversations),
  }),

  whatsappConversationMessages: t.field({
    type: WhatsappConversationMessagesResultPothosObject,
    description: "Paginated message thread for one inbox conversation.",
    authScopes: { permission: AppPermission.WHATSAPP_INBOX_VIEW },
    args: {
      conversationId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
      pagination: t.arg({ type: PaginationArgsObject, required: false }),
    },
    resolve: (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      const input: WhatsappConversationMessagesInput = {
        conversationId: args.conversationId,
        paginationArgs: args.pagination ?? null,
      };
      return WhatsappInboxService.listConversationMessages(whatsappQueryPermissionContext(ctx), tErrors, input);
    },
  }),

  whatsappSyncStatus: t.field({
    type: WhatsappAccountSyncOverviewPothosObject,
    description: "Per-account coexistence sync overview (status, progress, per-type request rows).",
    authScopes: { permission: AppPermission.WHATSAPP_INBOX_VIEW },
    args: {
      accountId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      return WhatsappInboxService.getSyncStatus(whatsappQueryPermissionContext(ctx), tErrors, args.accountId);
    },
  }),
}));
