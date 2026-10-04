import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { PaginationArgsObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { WhatsappTemplateSnapshotPothosObject } from "@/backend/graphql/pothos/whatsapp/whatsapp-account.pothos";
import {
  WhatsappConversationThreadPothosObject,
  WhatsappTestRecipientPothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-conversations.pothos";
import { WhatsappConversationsResultPothosObject } from "@/backend/graphql/pothos/whatsapp/whatsapp-inbox.pothos";
import {
  whatsappConversationsListArgs,
  whatsappConversationsListResolve,
  whatsappQueryPermissionContext,
} from "@/backend/graphql/query/whatsapp/__shared__";
import { WhatsappConversationsService } from "@/backend/services";
import type { WhatsappConversationMessagesInput } from "@/backend/types";

/**
 * WhatsApp conversations workspace read surface: the per-account conversations
 * list, a single conversation thread (row detail + paginated messages), and
 * the test-recipient registry. All fields are gated on
 * `WHATSAPP_CONVERSATIONS_VIEW` at both the resolver (authScopes) and service
 * layers; the already-populated UserPermissionContext from ctx is handed to
 * the service so no extra permission-context round-trip happens per request.
 */

gqlSchemaBuilder.queryFields(t => ({
  whatsappConversationThreads: t.field({
    type: WhatsappConversationsResultPothosObject,
    description:
      "Paginated conversations list for the conversations workspace; spans all accounts when `accountId` is omitted.",
    authScopes: { permission: AppPermission.WHATSAPP_CONVERSATIONS_VIEW },
    args: whatsappConversationsListArgs(t),
    resolve: whatsappConversationsListResolve(WhatsappConversationsService.listConversations),
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
      return WhatsappConversationsService.getConversationThread(whatsappQueryPermissionContext(ctx), tErrors, input);
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
      return WhatsappConversationsService.listRecipients(whatsappQueryPermissionContext(ctx), tErrors, {
        accountId: args.accountId,
      });
    },
  }),

  whatsappAccountTemplates: t.field({
    type: [WhatsappTemplateSnapshotPothosObject],
    description:
      "Message templates for one account, listed live from Meta with the account's credentials (body text + parameter count surfaced for the composer picker).",
    authScopes: { permission: AppPermission.WHATSAPP_CONVERSATIONS_VIEW },
    args: {
      accountId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      return WhatsappConversationsService.listAccountTemplates(whatsappQueryPermissionContext(ctx), tErrors, {
        accountId: args.accountId,
      });
    },
  }),
}));
