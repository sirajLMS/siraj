import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import {
  WhatsappAccountSyncOverviewPothosObject,
  WhatsappConversationMessagesResultPothosObject,
  WhatsappConversationsResultPothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-inbox.pothos";
import { WhatsappInboxService } from "@/backend/services";
import type {
  UserPermissionContext,
  WhatsappConversationMessagesInput,
  WhatsappConversationsListInput,
} from "@/backend/types";

/**
 * WhatsApp inbox read surface: conversation list, per-thread messages, and the
 * coexistence sync overview. Resolver + service both gate on
 * `WHATSAPP_INBOX_VIEW`; the resolver hands the already-populated
 * `UserPermissionContext` from ctx to the service so no extra
 * `PermissionsService.getUserContext` round-trip happens per request.
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
  whatsappConversations: t.field({
    type: WhatsappConversationsResultPothosObject,
    description: "Paginated WhatsApp inbox conversation list. Spans all accounts when `accountId` is omitted.",
    authScopes: { permission: AppPermission.WHATSAPP_INBOX_VIEW },
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
      return WhatsappInboxService.listConversations(permissionContext(ctx), tErrors, input);
    },
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
      return WhatsappInboxService.listConversationMessages(permissionContext(ctx), tErrors, input);
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
      return WhatsappInboxService.getSyncStatus(permissionContext(ctx), tErrors, args.accountId);
    },
  }),
}));
