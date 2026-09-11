import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  WhatsappAccountPurposePothosEnum,
  WhatsappConversationSendModePothosEnum,
  WhatsappTestRecipientStatusPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import {
  WhatsappConversationMessagesResultPothosObject,
  WhatsappMessagePothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-inbox.pothos";
import type {
  WhatsappConversationSendResult,
  WhatsappConversationThreadResult,
  WhatsappTestRecipientReturnType,
} from "@/backend/types";

/**
 * WhatsApp conversations workspace surface: the test-recipient registry for
 * Meta test numbers, the composer send input/result, and the thread detail
 * (conversation row + paginated messages). Conversation and message objects
 * are reused from the inbox pothos module (single canonical object type per
 * entity).
 */

export const WhatsappTestRecipientRef =
  gqlSchemaBuilder.objectRef<WhatsappTestRecipientReturnType>("WhatsappTestRecipient");

export const WhatsappTestRecipientPothosObject = WhatsappTestRecipientRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    accountId: t.exposeString("accountId"),
    phoneNumber: t.exposeString("phoneNumber"),
    status: t.expose("status", { type: WhatsappTestRecipientStatusPothosEnum }),
    note: t.exposeString("note", { nullable: true }),
    lastCheckedAt: t.expose("lastCheckedAt", { type: "DateTime", nullable: true }),
    lastErrorCode: t.exposeString("lastErrorCode", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

export const WhatsappConversationSendResultRef = gqlSchemaBuilder.objectRef<WhatsappConversationSendResult>(
  "WhatsappConversationSendResult"
);

export const WhatsappConversationSendResultPothosObject = WhatsappConversationSendResultRef.implement({
  fields: t => ({
    id: t.string({ resolve: result => result.message.id }),
    message: t.expose("message", { type: WhatsappMessagePothosObject }),
  }),
});

export const WhatsappConversationThreadRef =
  gqlSchemaBuilder.objectRef<WhatsappConversationThreadResult>("WhatsappConversationThread");

/** Conversation fields resolve straight off the embedded conversation row. */
export const WhatsappConversationThreadPothosObject = WhatsappConversationThreadRef.implement({
  fields: t => ({
    id: t.string({ resolve: thread => thread.conversation.id }),
    accountId: t.string({ resolve: thread => thread.conversation.accountId }),
    waId: t.string({ nullable: true, resolve: thread => thread.conversation.waId }),
    userId: t.string({ nullable: true, resolve: thread => thread.conversation.userId }),
    username: t.string({ nullable: true, resolve: thread => thread.conversation.username }),
    displayName: t.string({ nullable: true, resolve: thread => thread.conversation.displayName }),
    lastMessageAt: t.field({ type: "DateTime", nullable: true, resolve: thread => thread.conversation.lastMessageAt }),
    lastMessagePreview: t.string({ nullable: true, resolve: thread => thread.conversation.lastMessagePreview }),
    accountPurpose: t.field({
      type: WhatsappAccountPurposePothosEnum,
      nullable: true,
      resolve: thread => thread.conversation.accountPurpose,
    }),
    createdAt: t.field({ type: "DateTime", resolve: thread => thread.conversation.createdAt }),
    updatedAt: t.field({ type: "DateTime", resolve: thread => thread.conversation.updatedAt }),
    messages: t.field({ type: WhatsappConversationMessagesResultPothosObject, resolve: thread => thread.messages }),
  }),
});

export const WhatsappTestRecipientAddInputPothosObject = gqlSchemaBuilder.inputType("WhatsappTestRecipientAddInput", {
  fields: t => ({
    accountId: t.string({
      required: true,
      description: "Owning WhatsApp account id (max 36 chars)",
      directives: { constraint: { maxLength: 36 } },
    }),
    phoneNumber: t.string({
      required: true,
      description: "Recipient phone number (normalized to digits only server-side; max 32 chars)",
      directives: { constraint: { maxLength: 32 } },
    }),
    note: t.string({
      required: false,
      description: "Free-form operator note (max 200 chars)",
      directives: { constraint: { maxLength: 200 } },
    }),
  }),
});

export const WhatsappConversationSendInputPothosObject = gqlSchemaBuilder.inputType("WhatsappConversationSendInput", {
  fields: t => ({
    accountId: t.string({
      required: true,
      description: "Sending WhatsApp account id (max 36 chars)",
      directives: { constraint: { maxLength: 36 } },
    }),
    conversationId: t.string({
      required: false,
      description: "Existing conversation id for the send; omitted for a brand-new recipient (max 36 chars)",
      directives: { constraint: { maxLength: 36 } },
    }),
    to: t.string({
      required: true,
      description: "Recipient phone number (normalized to digits only server-side; max 32 chars)",
      directives: { constraint: { maxLength: 32 } },
    }),
    mode: t.field({
      type: WhatsappConversationSendModePothosEnum,
      required: true,
      description: "TEXT (inside the 24h service window) or TEMPLATE (always allowed).",
    }),
    templateName: t.string({
      required: false,
      description: "Template name; required when mode is TEMPLATE (max 512 chars)",
      directives: { constraint: { maxLength: 512 } },
    }),
    templateLanguage: t.string({
      required: false,
      description: "Template language code; defaults to en_US (max 35 chars)",
      directives: { constraint: { maxLength: 35 } },
    }),
    body: t.string({
      required: false,
      description: "Free-text body; required when mode is TEXT (max 4096 chars)",
      directives: { constraint: { maxLength: 4096 } },
    }),
  }),
});
