import { AppPermission } from "@/backend/enum";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import {
  approveWhatsappGroupJoinRequests,
  createWhatsappGroup,
  deleteWhatsappGroup,
  getWhatsappGroupInviteLink,
  pinWhatsappGroupMessage,
  rejectWhatsappGroupJoinRequests,
  removeWhatsappGroupParticipants,
  resetWhatsappGroupInviteLink,
  sendWhatsappGroupMessage,
  syncWhatsappGroups,
  unpinWhatsappGroupMessage,
  updateWhatsappGroupSettings,
} from "@/backend/graphql/mutation/whatsapp/whatsapp-groups.mutation.helpers";
import {
  WhatsappGroupCreateInputPothosObject,
  WhatsappGroupIdsInputPothosObject,
  WhatsappGroupParticipantsInputPothosObject,
  WhatsappGroupPinInputPothosObject,
  WhatsappGroupPothosObject,
  WhatsappGroupSendInputPothosObject,
  WhatsappGroupSendResultPothosObject,
  WhatsappGroupSettingsUpdateInputPothosObject,
  WhatsappJoinRequestsOutcomePothosObject,
  WhatsappRemoveParticipantsOutcomePothosObject,
} from "@/backend/graphql/pothos/whatsapp/whatsapp-groups.pothos";

/**
 * WhatsApp groups workspace mutations: local group registry lifecycle
 * (create/delete/settings/invite links), the Meta-side sync, join-request
 * moderation, participant removal, and the group composer send + pin/unpin.
 * All fields are gated on `WHATSAPP_GROUPS_MANAGE` at both the resolver and
 * service layers. `actorUserId` comes from the authenticated session — the
 * client never supplies it.
 */

gqlSchemaBuilder.mutationFields(t => ({
  createWhatsappGroup: t.field({
    type: WhatsappGroupPothosObject,
    description:
      "Create a group on Meta under the owning WhatsApp account and register it locally; returns the local group row.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupCreateInputPothosObject, required: true }),
    },
    resolve: (_root, { input }, ctx) => createWhatsappGroup(ctx, input),
  }),

  deleteWhatsappGroup: t.field({
    type: "Boolean",
    description:
      "Delete a group on Meta, then soft-delete the local row. A Meta-rejected delete leaves the group active.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      groupId: t.arg.string({ required: true, directives: { constraint: { maxLength: 256 } } }),
    },
    resolve: (_root, args, ctx) => deleteWhatsappGroup(ctx, args.groupId),
  }),

  updateWhatsappGroupSettings: t.field({
    type: WhatsappGroupPothosObject,
    description:
      "Update a group's subject/description on Meta (a staged profile picture switches to multipart upload) and persist the text fields locally.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupSettingsUpdateInputPothosObject, required: true }),
    },
    resolve: (_root, args, ctx) => updateWhatsappGroupSettings(ctx, args.input),
  }),

  syncWhatsappGroups: t.field({
    type: "Int",
    description:
      "Sync groups from Meta into the local registry (one list page, live info fetch per group); returns the synced count. Resolves the account by id when given, otherwise the active GENERAL-purpose account.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      accountId: t.arg.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: (_root, args, ctx) => syncWhatsappGroups(ctx, args.accountId ?? null),
  }),
}));

gqlSchemaBuilder.mutationFields(t => ({
  getWhatsappGroupInviteLink: t.field({
    type: "String",
    description: "Read the current group invite link from Meta and cache it on the local row; returns the link.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      groupId: t.arg.string({ required: true, directives: { constraint: { maxLength: 256 } } }),
    },
    resolve: (_root, args, ctx) => getWhatsappGroupInviteLink(ctx, args.groupId),
  }),

  resetWhatsappGroupInviteLink: t.field({
    type: "String",
    description:
      "Revoke the current group invite link on Meta, issue and cache a new one; every previously shared link becomes invalid.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      groupId: t.arg.string({ required: true, directives: { constraint: { maxLength: 256 } } }),
    },
    resolve: (_root, args, ctx) => resetWhatsappGroupInviteLink(ctx, args.groupId),
  }),

  approveWhatsappGroupJoinRequests: t.field({
    type: WhatsappJoinRequestsOutcomePothosObject,
    description:
      "Approve pending join requests on Meta; returns the provider's outcome (approved list + per-request failures). Local membership reconciliation is owned by the participants-update webhook.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupIdsInputPothosObject, required: true }),
    },
    resolve: (_root, args, ctx) => approveWhatsappGroupJoinRequests(ctx, args.input),
  }),

  rejectWhatsappGroupJoinRequests: t.field({
    type: WhatsappJoinRequestsOutcomePothosObject,
    description:
      "Reject pending join requests on Meta; returns the provider's outcome (per-request failures). Local membership reconciliation is owned by the participants-update webhook.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupIdsInputPothosObject, required: true }),
    },
    resolve: (_root, args, ctx) => rejectWhatsappGroupJoinRequests(ctx, args.input),
  }),

  removeWhatsappGroupParticipants: t.field({
    type: WhatsappRemoveParticipantsOutcomePothosObject,
    description:
      "Remove participants from a group on Meta; the provider's outcome arrives asynchronously via the participants-update webhook.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupParticipantsInputPothosObject, required: true }),
    },
    resolve: (_root, args, ctx) => removeWhatsappGroupParticipants(ctx, args.input),
  }),
}));

gqlSchemaBuilder.mutationFields(t => ({
  sendWhatsappGroupMessage: t.field({
    type: WhatsappGroupSendResultPothosObject,
    description:
      "Send a message to a group from the owning account (TEXT when templateName is omitted, TEMPLATE with a synced language code otherwise); the sent message is persisted as API_OUTBOUND.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupSendInputPothosObject, required: true }),
    },
    resolve: (_root, args, ctx) => sendWhatsappGroupMessage(ctx, args.input),
  }),

  pinWhatsappGroupMessage: t.field({
    type: "String",
    description:
      "Pin a message inside a group on Meta (pin lifetime in days is required) and stamp the local pin state; returns the message id.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupPinInputPothosObject, required: true }),
    },
    resolve: (_root, args, ctx) => pinWhatsappGroupMessage(ctx, args.input),
  }),

  unpinWhatsappGroupMessage: t.field({
    type: "String",
    description:
      "Unpin a message inside a group on Meta and clear the local pin state; returns the message id. Unpin has no expiry — the input's expirationDays is ignored.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupPinInputPothosObject, required: true }),
    },
    resolve: (_root, args, ctx) => unpinWhatsappGroupMessage(ctx, args.input),
  }),
}));
