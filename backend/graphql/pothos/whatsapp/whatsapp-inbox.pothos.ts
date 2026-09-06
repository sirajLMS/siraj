import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  WhatsappAccountPurposePothosEnum,
  WhatsappMessageDirectionPothosEnum,
  WhatsappSyncRequestStatusPothosEnum,
  WhatsappSyncStatusPothosEnum,
  WhatsappSyncTypePothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import type {
  WhatsappAccountSyncOverview,
  WhatsappContactReturnType,
  WhatsappConversationMessagesPaginatedResult,
  WhatsappConversationReturnType,
  WhatsappConversationsPaginatedResult,
  WhatsappMessageReturnType,
  WhatsappSyncRequestReturnType,
} from "@/backend/types";

/**
 * WhatsApp inbox surface object types (conversations, messages, contacts) and
 * the coexistence sync-status overview read by the Numbers tab badge and the
 * inbox sync indicator. Conversation identity stays flexible (`waId` /
 * `userId` / `username`) while Meta migrates contacts to business-scoped ids.
 */

export const WhatsappConversationRef =
  gqlSchemaBuilder.objectRef<WhatsappConversationReturnType>("WhatsappConversation");

export const WhatsappConversationPothosObject = WhatsappConversationRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    accountId: t.exposeString("accountId"),
    waId: t.exposeString("waId", { nullable: true }),
    userId: t.exposeString("userId", { nullable: true }),
    username: t.exposeString("username", { nullable: true }),
    displayName: t.exposeString("displayName", { nullable: true }),
    lastMessageAt: t.expose("lastMessageAt", { type: "DateTime", nullable: true }),
    lastMessagePreview: t.exposeString("lastMessagePreview", { nullable: true }),
    accountPurpose: t.expose("accountPurpose", { type: WhatsappAccountPurposePothosEnum, nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});
export const WhatsappMessageRef = gqlSchemaBuilder.objectRef<WhatsappMessageReturnType>("WhatsappMessage");

export const WhatsappMessagePothosObject = WhatsappMessageRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    conversationId: t.exposeString("conversationId"),
    accountId: t.exposeString("accountId"),
    wamid: t.exposeString("wamid"),
    direction: t.expose("direction", { type: WhatsappMessageDirectionPothosEnum }),
    type: t.exposeString("type"),
    content: t.expose("content", { type: "JSON" }),
    status: t.exposeString("status", { nullable: true }),
    mediaPlaceholder: t.exposeBoolean("mediaPlaceholder"),
    mediaId: t.exposeString("mediaId", { nullable: true }),
    mediaMime: t.exposeString("mediaMime", { nullable: true }),
    mediaSha256: t.exposeString("mediaSha256", { nullable: true }),
    phase: t.exposeInt("phase", { nullable: true }),
    chunkOrder: t.exposeInt("chunkOrder", { nullable: true }),
    sentAt: t.expose("sentAt", { type: "DateTime", nullable: true }),
    editedAt: t.expose("editedAt", { type: "DateTime", nullable: true }),
    revokedAt: t.expose("revokedAt", { type: "DateTime", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
  }),
});
export const WhatsappContactRef = gqlSchemaBuilder.objectRef<WhatsappContactReturnType>("WhatsappContact");

export const WhatsappContactPothosObject = WhatsappContactRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    accountId: t.exposeString("accountId"),
    phoneNumber: t.exposeString("phoneNumber", { nullable: true }),
    userId: t.exposeString("userId", { nullable: true }),
    username: t.exposeString("username", { nullable: true }),
    fullName: t.exposeString("fullName", { nullable: true }),
    firstName: t.exposeString("firstName", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ─── Sync status ─────────────────────────────────────────────────────────────

export const WhatsappSyncRequestRef = gqlSchemaBuilder.objectRef<WhatsappSyncRequestReturnType>("WhatsappSyncRequest");

export const WhatsappSyncRequestPothosObject = WhatsappSyncRequestRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    accountId: t.exposeString("accountId"),
    syncType: t.expose("syncType", { type: WhatsappSyncTypePothosEnum }),
    requestId: t.exposeString("requestId", { nullable: true }),
    status: t.expose("status", { type: WhatsappSyncRequestStatusPothosEnum }),
    requestedAt: t.expose("requestedAt", { type: "DateTime", nullable: true }),
    completedAt: t.expose("completedAt", { type: "DateTime", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});
export const WhatsappAccountSyncOverviewRef =
  gqlSchemaBuilder.objectRef<WhatsappAccountSyncOverview>("WhatsappAccountSyncOverview");

export const WhatsappAccountSyncOverviewPothosObject = WhatsappAccountSyncOverviewRef.implement({
  fields: t => ({
    // Apollo cache key: one overview per account.
    id: t.string({ resolve: overview => overview.accountId }),
    accountId: t.exposeString("accountId"),
    syncStatus: t.expose("syncStatus", { type: WhatsappSyncStatusPothosEnum }),
    syncPhase: t.exposeInt("syncPhase", { nullable: true }),
    syncProgress: t.exposeInt("syncProgress"),
    syncDeadlineAt: t.expose("syncDeadlineAt", { type: "DateTime", nullable: true }),
    syncFailureReason: t.exposeString("syncFailureReason", { nullable: true }),
    requests: t.expose("requests", { type: [WhatsappSyncRequestPothosObject] }),
  }),
});

// ─── Paginated inbox result wrappers ─────────────────────────────────────────

export const WhatsappConversationsResultRef =
  gqlSchemaBuilder.objectRef<WhatsappConversationsPaginatedResult>("WhatsappConversationsResult");

export const WhatsappConversationsResultPothosObject = WhatsappConversationsResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [WhatsappConversationPothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

export const WhatsappConversationMessagesResultRef =
  gqlSchemaBuilder.objectRef<WhatsappConversationMessagesPaginatedResult>("WhatsappConversationMessagesResult");

export const WhatsappConversationMessagesResultPothosObject = WhatsappConversationMessagesResultRef.implement({
  fields: t => ({
    id: t.exposeString("id"),
    rows: t.expose("rows", { type: [WhatsappMessagePothosObject] }),
    totalCount: t.exposeInt("totalCount"),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});
