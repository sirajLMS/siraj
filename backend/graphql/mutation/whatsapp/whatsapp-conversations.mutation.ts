import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  WhatsappConversationSendInputPothosObject,
  WhatsappConversationSendResultPothosObject,
  WhatsappTestRecipientAddInputPothosObject,
  WhatsappTestRecipientPothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-conversations.pothos";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { WhatsappConversationsService } from "@/backend/services";
import type { UserPermissionContext, WhatsappConversationSendInput } from "@/backend/types";

/**
 * WhatsApp conversations workspace mutations: test-recipient registry
 * management (add/remove/verify) and the composer send. All fields are gated
 * on `WHATSAPP_CONVERSATIONS_MANAGE` at both the resolver and service layers.
 * `actorUserId` comes from the authenticated session — the client never
 * supplies it.
 */

function permissionContext(ctx: BaseContext): UserPermissionContext {
  return {
    permissions: ctx.permissions,
    permissionGroups: ctx.permissionGroups,
    isSuperAdmin: ctx.isSuperAdmin,
    role: ctx.role,
  };
}

gqlSchemaBuilder.mutationFields(t => ({
  addWhatsappTestRecipient: t.field({
    type: WhatsappTestRecipientPothosObject,
    description: "Register a recipient for a Meta test number's allow-list.",
    authScopes: { permission: AppPermission.WHATSAPP_CONVERSATIONS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappTestRecipientAddInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return WhatsappConversationsService.addRecipient(permissionContext(ctx), tErrors, {
        actorUserId,
        accountId: args.input.accountId,
        phoneNumber: args.input.phoneNumber,
        note: args.input.note,
      });
    },
  }),

  removeWhatsappTestRecipient: t.field({
    type: "Boolean",
    description: "Remove a recipient from a Meta test number's allow-list registry.",
    authScopes: { permission: AppPermission.WHATSAPP_CONVERSATIONS_MANAGE },
    args: {
      recipientId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      await WhatsappConversationsService.removeRecipient(permissionContext(ctx), tErrors, {
        actorUserId,
        recipientId: args.recipientId,
      });
      return true;
    },
  }),

  verifyWhatsappTestRecipient: t.field({
    type: WhatsappTestRecipientPothosObject,
    description:
      "Verify a registry recipient by sending Meta's hello_world test template; returns the row with the refreshed status, lastCheckedAt, and lastErrorCode.",
    authScopes: { permission: AppPermission.WHATSAPP_CONVERSATIONS_MANAGE },
    args: {
      recipientId: t.arg.string({ required: true, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return WhatsappConversationsService.verifyRecipient(permissionContext(ctx), tErrors, {
        actorUserId,
        recipientId: args.recipientId,
      });
    },
  }),

  sendWhatsappConversationMessage: t.field({
    type: WhatsappConversationSendResultPothosObject,
    description:
      "Send a composer message from the conversations workspace (TEXT inside the 24h service window, TEMPLATE anytime). Test numbers enforce the recipient allow-list.",
    authScopes: { permission: AppPermission.WHATSAPP_CONVERSATIONS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappConversationSendInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const actorUserId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const input: WhatsappConversationSendInput = {
        accountId: args.input.accountId,
        conversationId: args.input.conversationId ?? null,
        to: args.input.to,
        mode: args.input.mode,
        templateName: args.input.templateName ?? undefined,
        templateLanguage: args.input.templateLanguage ?? undefined,
        body: args.input.body ?? undefined,
      };
      return WhatsappConversationsService.sendMessage(permissionContext(ctx), tErrors, {
        ...input,
        actorUserId,
      });
    },
  }),
}));
