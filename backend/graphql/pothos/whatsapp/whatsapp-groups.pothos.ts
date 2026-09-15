import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  WhatsappGroupJoinApprovalModePothosEnum,
  WhatsappMessageDirectionPothosEnum,
} from "@/backend/graphql/pothos/shared/enum.pothos";
import { PageInfoObject } from "@/backend/graphql/pothos/shared/pagination.objects";
import { whatsappGroupMetaIdInputField } from "@/backend/graphql/pothos/whatsapp/__shared__/whatsappGroupFieldHelpers";
import type {
  GroupMessageSendResult,
  JoinRequestsOutcome,
  RemoveParticipantsOutcome,
  WhatsappGroupJoinRequest,
  WhatsappGroupMessageReturnType,
  WhatsappGroupMessagesPaginatedResult,
  WhatsappGroupParticipantReturnType,
  WhatsappGroupReturnType,
  WhatsappGroupsPaginatedResult,
  WhatsappJoinRequestErrorType,
  WhatsappJoinRequestFailureType,
  WhatsappRemoveParticipantErrorType,
  WhatsappRemoveParticipantFailureType,
} from "@/backend/types";

/**
 * WhatsApp groups surface object types: group rows, participants, group
 * messages, pending join requests, the paginated result envelopes and the
 * approve/reject + remove-participants outcome wrappers. Group and message
 * objects live outside the inbox module because the underlying tables
 * (`whatsapp_groups` / `whatsapp_group_messages`) are distinct entities.
 */

export const WhatsappGroupRef = gqlSchemaBuilder.objectRef<WhatsappGroupReturnType>("WhatsappGroup");

export const WhatsappGroupPothosObject = WhatsappGroupRef.implement({
  fields: t => ({
    id: t.exposeString("id", { nullable: false }),
    accountId: t.exposeString("accountId", { nullable: false }),
    groupJid: t.exposeString("groupJid", { nullable: false }),
    subject: t.exposeString("subject", { nullable: false }),
    description: t.exposeString("description", { nullable: true }),
    joinApprovalMode: t.expose("joinApprovalMode", { type: WhatsappGroupJoinApprovalModePothosEnum, nullable: false }),
    inviteLink: t.exposeString("inviteLink", { nullable: true }),
    suspended: t.exposeBoolean("suspended", { nullable: false }),
    totalParticipantCount: t.exposeInt("totalParticipantCount", { nullable: false }),
    pendingJoinRequestCount: t.exposeInt("pendingJoinRequestCount", { nullable: false }),
    creationTimestamp: t.expose("creationTimestamp", { type: "DateTime", nullable: true }),
    syncedAt: t.expose("syncedAt", { type: "DateTime", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime", nullable: false }),
    updatedAt: t.expose("updatedAt", { type: "DateTime", nullable: false }),
  }),
});

export const WhatsappGroupParticipantRef =
  gqlSchemaBuilder.objectRef<WhatsappGroupParticipantReturnType>("WhatsappGroupParticipant");

export const WhatsappGroupParticipantPothosObject = WhatsappGroupParticipantRef.implement({
  fields: t => ({
    id: t.exposeString("id", { nullable: false }),
    groupId: t.exposeString("groupId", { nullable: false }),
    waId: t.exposeString("waId", { nullable: false }),
    joinedAt: t.expose("joinedAt", { type: "DateTime", nullable: true }),
    addedVia: t.exposeString("addedVia", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime", nullable: false }),
  }),
});

export const WhatsappGroupMessageRef =
  gqlSchemaBuilder.objectRef<WhatsappGroupMessageReturnType>("WhatsappGroupMessage");

export const WhatsappGroupMessagePothosObject = WhatsappGroupMessageRef.implement({
  fields: t => ({
    id: t.exposeString("id", { nullable: false }),
    groupId: t.exposeString("groupId", { nullable: false }),
    accountId: t.exposeString("accountId", { nullable: false }),
    wamid: t.exposeString("wamid", { nullable: false }),
    direction: t.expose("direction", { type: WhatsappMessageDirectionPothosEnum, nullable: false }),
    type: t.exposeString("type", { nullable: false }),
    content: t.expose("content", { type: "JSON", nullable: false }),
    status: t.exposeString("status", { nullable: true }),
    fromWaId: t.exposeString("fromWaId", { nullable: true }),
    mediaId: t.exposeString("mediaId", { nullable: true }),
    mediaMime: t.exposeString("mediaMime", { nullable: true }),
    pinnedAt: t.expose("pinnedAt", { type: "DateTime", nullable: true }),
    pinExpiresAt: t.expose("pinExpiresAt", { type: "DateTime", nullable: true }),
    sentAt: t.expose("sentAt", { type: "DateTime", nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime", nullable: false }),
  }),
});

export const WhatsappGroupJoinRequestRef =
  gqlSchemaBuilder.objectRef<WhatsappGroupJoinRequest>("WhatsappGroupJoinRequest");

export const WhatsappGroupJoinRequestPothosObject = WhatsappGroupJoinRequestRef.implement({
  fields: t => ({
    id: t.string({ resolve: request => request.joinRequestId }),
    joinRequestId: t.exposeString("joinRequestId", { nullable: false }),
    waId: t.exposeString("waId", { nullable: false }),
    // Meta reports the join-request creation timestamp as an ISO string.
    creationTimestamp: t.exposeString("creationTimestamp", { nullable: false }),
  }),
});

// ─── Paginated result envelopes ──────────────────────────────────────────────

export const WhatsappGroupsResultRef =
  gqlSchemaBuilder.objectRef<WhatsappGroupsPaginatedResult>("WhatsappGroupsResult");

export const WhatsappGroupsResultPothosObject = WhatsappGroupsResultRef.implement({
  fields: t => ({
    id: t.exposeString("id", { nullable: false }),
    rows: t.expose("rows", { type: [WhatsappGroupPothosObject], nullable: false }),
    totalCount: t.exposeInt("totalCount", { nullable: false }),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

export const WhatsappGroupMessagesResultRef =
  gqlSchemaBuilder.objectRef<WhatsappGroupMessagesPaginatedResult>("WhatsappGroupMessagesResult");

export const WhatsappGroupMessagesResultPothosObject = WhatsappGroupMessagesResultRef.implement({
  fields: t => ({
    id: t.exposeString("id", { nullable: false }),
    rows: t.expose("rows", { type: [WhatsappGroupMessagePothosObject], nullable: false }),
    totalCount: t.exposeInt("totalCount", { nullable: false }),
    pageInfo: t.expose("pageInfo", { type: PageInfoObject, nullable: true }),
  }),
});

// ─── Outcome wrappers ────────────────────────────────────────────────────────

const WhatsappJoinRequestErrorRef =
  gqlSchemaBuilder.objectRef<WhatsappJoinRequestErrorType>("WhatsappJoinRequestError");

export const WhatsappJoinRequestErrorPothosObject = WhatsappJoinRequestErrorRef.implement({
  fields: t => ({
    code: t.exposeInt("code", { nullable: true }),
    message: t.exposeString("message", { nullable: true }),
  }),
});

const WhatsappJoinRequestFailureRef =
  gqlSchemaBuilder.objectRef<WhatsappJoinRequestFailureType>("WhatsappJoinRequestFailure");

export const WhatsappJoinRequestFailurePothosObject = WhatsappJoinRequestFailureRef.implement({
  fields: t => ({
    id: t.string({ resolve: failure => failure.joinRequestId }),
    joinRequestId: t.exposeString("joinRequestId", { nullable: false }),
    errors: t.expose("errors", { type: [WhatsappJoinRequestErrorPothosObject], nullable: false }),
  }),
});

export const WhatsappJoinRequestsOutcomeRef =
  gqlSchemaBuilder.objectRef<JoinRequestsOutcome>("WhatsappJoinRequestsOutcome");

export const WhatsappJoinRequestsOutcomePothosObject = WhatsappJoinRequestsOutcomeRef.implement({
  fields: t => ({
    id: t.string({ resolve: outcome => outcome.approved.join(",") }),
    approved: t.stringList({ resolve: outcome => [...outcome.approved] }),
    failed: t.expose("failed", { type: [WhatsappJoinRequestFailurePothosObject], nullable: false }),
  }),
});

const WhatsappRemoveParticipantErrorRef = gqlSchemaBuilder.objectRef<WhatsappRemoveParticipantErrorType>(
  "WhatsappRemoveParticipantError"
);

export const WhatsappRemoveParticipantErrorPothosObject = WhatsappRemoveParticipantErrorRef.implement({
  fields: t => ({
    code: t.exposeInt("code", { nullable: true }),
    message: t.exposeString("message", { nullable: true }),
  }),
});

const WhatsappRemoveParticipantFailureRef = gqlSchemaBuilder.objectRef<WhatsappRemoveParticipantFailureType>(
  "WhatsappRemoveParticipantFailure"
);

export const WhatsappRemoveParticipantFailurePothosObject = WhatsappRemoveParticipantFailureRef.implement({
  fields: t => ({
    id: t.string({ resolve: failure => failure.input }),
    input: t.exposeString("input", { nullable: false }),
    errors: t.expose("errors", { type: [WhatsappRemoveParticipantErrorPothosObject], nullable: false }),
  }),
});

export const WhatsappRemoveParticipantsOutcomeRef = gqlSchemaBuilder.objectRef<RemoveParticipantsOutcome>(
  "WhatsappRemoveParticipantsOutcome"
);

export const WhatsappRemoveParticipantsOutcomePothosObject = WhatsappRemoveParticipantsOutcomeRef.implement({
  fields: t => ({
    id: t.string({ resolve: outcome => outcome.removed.join(",") }),
    removed: t.stringList({ resolve: outcome => [...outcome.removed] }),
    failed: t.expose("failed", { type: [WhatsappRemoveParticipantFailurePothosObject], nullable: false }),
  }),
});

export const WhatsappGroupSendResultRef = gqlSchemaBuilder.objectRef<GroupMessageSendResult>("WhatsappGroupSendResult");

export const WhatsappGroupSendResultPothosObject = WhatsappGroupSendResultRef.implement({
  fields: t => ({
    id: t.string({ resolve: result => result.providerMessageId }),
    providerMessageId: t.exposeString("providerMessageId", { nullable: false }),
    groupId: t.exposeString("groupId", { nullable: false }),
  }),
});

// ─── Input types ─────────────────────────────────────────────────────────────

export const WhatsappGroupCreateInputPothosObject = gqlSchemaBuilder.inputType("WhatsappGroupCreateInput", {
  fields: t => ({
    accountId: t.string({
      required: true,
      description: "Owning WhatsApp account id (max 36 chars)",
      directives: { constraint: { maxLength: 36 } },
    }),
    subject: t.string({
      required: true,
      description: "Group subject (1-128 characters, Meta-enforced limit)",
      directives: { constraint: { minLength: 1, maxLength: 128 } },
    }),
    description: t.string({
      required: false,
      description: "Optional group description (max 2048 chars)",
      directives: { constraint: { maxLength: 2048 } },
    }),
    joinApprovalMode: t.field({
      type: WhatsappGroupJoinApprovalModePothosEnum,
      required: false,
      description: "How the group admits new members: admin approval or automatic.",
    }),
  }),
});

export const WhatsappGroupSettingsUpdateInputPothosObject = gqlSchemaBuilder.inputType(
  "WhatsappGroupSettingsUpdateInput",
  {
    fields: t => ({
      groupId: whatsappGroupMetaIdInputField(t),
      subject: t.string({
        required: false,
        description: "Updated group subject (max 128 chars)",
        directives: { constraint: { maxLength: 128 } },
      }),
      description: t.string({
        required: false,
        description: "Updated group description (max 2048 chars)",
        directives: { constraint: { maxLength: 2048 } },
      }),
      profilePicturePath: t.string({
        required: false,
        description: "Local file path staged for multipart upload to the media endpoint (max 1024 chars)",
        directives: { constraint: { maxLength: 1024 } },
      }),
    }),
  }
);

export const WhatsappGroupSendInputPothosObject = gqlSchemaBuilder.inputType("WhatsappGroupSendInput", {
  fields: t => ({
    groupId: whatsappGroupMetaIdInputField(t),
    body: t.string({
      required: false,
      description: "Free-text message body (max 4096 chars); required when templateName is omitted",
      directives: { constraint: { maxLength: 4096 } },
    }),
    previewUrl: t.boolean({
      required: false,
      description: "Render URL previews in the free-text body.",
    }),
    templateName: t.string({
      required: false,
      description: "Approved template name from Meta Template Manager (max 256 chars)",
      directives: { constraint: { maxLength: 256 } },
    }),
    templateLanguageCode: t.string({
      required: false,
      description: "Exact language code from the synced template payload (max 16 chars)",
      directives: { constraint: { maxLength: 16 } },
    }),
    templateGroupIdParameter: t.string({
      required: false,
      description: "Optional group-id template parameter binding (max 256 chars)",
      directives: { constraint: { maxLength: 256 } },
    }),
  }),
});

export const WhatsappGroupPinInputPothosObject = gqlSchemaBuilder.inputType("WhatsappGroupPinInput", {
  fields: t => ({
    groupId: whatsappGroupMetaIdInputField(t),
    messageId: t.string({
      required: true,
      description: "WhatsApp message id (wamid) to pin or unpin (max 128 chars)",
      directives: { constraint: { maxLength: 128 } },
    }),
    operation: t.string({
      required: true,
      description: "Pin operation: pin or unpin.",
      directives: { constraint: { pattern: "^(pin|unpin)$" } },
    }),
    expirationDays: t.int({
      required: false,
      description: "Pin lifetime in days (1-30, Meta-enforced maximum)",
      directives: { constraint: { min: 1, max: 30 } },
    }),
  }),
});

export const WhatsappGroupIdsInputPothosObject = gqlSchemaBuilder.inputType("WhatsappGroupIdsInput", {
  fields: t => ({
    groupId: whatsappGroupMetaIdInputField(t),
    joinRequestIds: t.stringList({
      required: true,
      description: "Pending join request ids to approve or reject (max 100, each max 128 chars)",
      directives: { constraint: { maxItems: 100, maxLength: 128 } },
    }),
  }),
});

export const WhatsappGroupParticipantsInputPothosObject = gqlSchemaBuilder.inputType("WhatsappGroupParticipantsInput", {
  fields: t => ({
    groupId: whatsappGroupMetaIdInputField(t),
    participants: t.stringList({
      required: true,
      description: "Participant WhatsApp ids, normalized to digits only server-side (max 100, each max 32 chars)",
      directives: { constraint: { maxItems: 100, maxLength: 32 } },
    }),
  }),
});
