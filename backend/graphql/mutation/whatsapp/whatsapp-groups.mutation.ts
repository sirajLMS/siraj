import { AppPermission } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
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
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { WhatsappGroupsService } from "@/backend/services";
import type { UserPermissionContext, WhatsappGroupSendInput } from "@/backend/types";
import type { Translations } from "@/shared/locale";

/**
 * WhatsApp groups workspace mutations: local group registry lifecycle
 * (create/delete/settings/invite links), the Meta-side sync, join-request
 * moderation, participant removal, and the group composer send + pin/unpin.
 * All fields are gated on `WHATSAPP_GROUPS_MANAGE` at both the resolver and
 * service layers. `actorUserId` comes from the authenticated session — the
 * client never supplies it.
 */

function permissionContext(ctx: BaseContext): UserPermissionContext {
  return {
    permissions: ctx.permissions,
    permissionGroups: ctx.permissionGroups,
    isSuperAdmin: ctx.isSuperAdmin,
    role: ctx.role,
  };
}

async function groupMutationContext(ctx: BaseContext): Promise<{
  context: UserPermissionContext;
  tErrors: Translations["errorsTranslations"];
  actorUserId: string;
}> {
  return {
    context: permissionContext(ctx),
    tErrors: ctx.t().errorsTranslations,
    actorUserId: await requireAuth(ctx),
  };
}

gqlSchemaBuilder.mutationFields(t => ({
  createWhatsappGroup: t.field({
    type: WhatsappGroupPothosObject,
    description:
      "Create a group on Meta under the owning WhatsApp account and register it locally; returns the local group row.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupCreateInputPothosObject, required: true }),
    },
    resolve: async (_root, { input }, ctx) => {
      const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
      return WhatsappGroupsService.createGroup(context, tErrors, {
        ...input,
        description: input.description ?? undefined,
        joinApprovalMode: input.joinApprovalMode ?? undefined,
        actorUserId,
      });
    },
  }),

  deleteWhatsappGroup: t.field({
    type: "Boolean",
    description:
      "Delete a group on Meta, then soft-delete the local row. A Meta-rejected delete leaves the group active.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      groupId: t.arg.string({ required: true, directives: { constraint: { maxLength: 256 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
      return WhatsappGroupsService.deleteGroup(context, tErrors, {
        groupId: args.groupId,
        actorUserId,
      });
    },
  }),

  updateWhatsappGroupSettings: t.field({
    type: WhatsappGroupPothosObject,
    description:
      "Update a group's subject/description on Meta (a staged profile picture switches to multipart upload) and persist the text fields locally.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupSettingsUpdateInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
      return WhatsappGroupsService.updateGroupSettings(context, tErrors, {
        ...args.input,
        subject: args.input.subject ?? undefined,
        description: args.input.description ?? undefined,
        profilePicturePath: args.input.profilePicturePath ?? undefined,
        actorUserId,
      });
    },
  }),

  syncWhatsappGroups: t.field({
    type: "Int",
    description:
      "Sync groups from Meta into the local registry (one list page, live info fetch per group); returns the synced count. Resolves the account by id when given, otherwise the active GENERAL-purpose account.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      accountId: t.arg.string({ required: false, directives: { constraint: { maxLength: 36 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
      return WhatsappGroupsService.syncGroups(context, tErrors, {
        accountId: args.accountId ?? null,
        actorUserId,
      });
    },
  }),

  getWhatsappGroupInviteLink: t.field({
    type: "String",
    description: "Read the current group invite link from Meta and cache it on the local row; returns the link.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      groupId: t.arg.string({ required: true, directives: { constraint: { maxLength: 256 } } }),
    },
    resolve: async (_root, args, ctx) => {
      await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const { inviteLink } = await WhatsappGroupsService.getInviteLink(permissionContext(ctx), tErrors, {
        groupId: args.groupId,
      });
      return inviteLink;
    },
  }),

  resetWhatsappGroupInviteLink: t.field({
    type: "String",
    description:
      "Revoke the current group invite link on Meta, issue and cache a new one; every previously shared link becomes invalid.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      groupId: t.arg.string({ required: true, directives: { constraint: { maxLength: 256 } } }),
    },
    resolve: async (_root, args, ctx) => {
      const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
      const { inviteLink } = await WhatsappGroupsService.resetInviteLink(context, tErrors, {
        groupId: args.groupId,
        actorUserId,
      });
      return inviteLink;
    },
  }),

  approveWhatsappGroupJoinRequests: t.field({
    type: WhatsappJoinRequestsOutcomePothosObject,
    description:
      "Approve pending join requests on Meta; returns the provider's outcome (approved list + per-request failures). Local membership reconciliation is owned by the participants-update webhook.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupIdsInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
      return WhatsappGroupsService.approveJoinRequests(context, tErrors, {
        groupId: args.input.groupId,
        joinRequestIds: args.input.joinRequestIds,
        actorUserId,
      });
    },
  }),

  rejectWhatsappGroupJoinRequests: t.field({
    type: WhatsappJoinRequestsOutcomePothosObject,
    description:
      "Reject pending join requests on Meta; returns the provider's outcome (per-request failures). Local membership reconciliation is owned by the participants-update webhook.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupIdsInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
      return WhatsappGroupsService.rejectJoinRequests(context, tErrors, {
        groupId: args.input.groupId,
        joinRequestIds: args.input.joinRequestIds,
        actorUserId,
      });
    },
  }),

  removeWhatsappGroupParticipants: t.field({
    type: WhatsappRemoveParticipantsOutcomePothosObject,
    description:
      "Remove participants from a group on Meta; the provider's outcome arrives asynchronously via the participants-update webhook.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupParticipantsInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
      return WhatsappGroupsService.removeParticipants(context, tErrors, {
        groupId: args.input.groupId,
        participants: args.input.participants,
        actorUserId,
      });
    },
  }),

  sendWhatsappGroupMessage: t.field({
    type: WhatsappGroupSendResultPothosObject,
    description:
      "Send a message to a group from the owning account (TEXT when templateName is omitted, TEMPLATE with a synced language code otherwise); the sent message is persisted as API_OUTBOUND.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupSendInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
      const input: WhatsappGroupSendInput = {
        groupId: args.input.groupId,
        ...(args.input.body != null
          ? {
              text: {
                body: args.input.body,
                ...(args.input.previewUrl != null ? { previewUrl: args.input.previewUrl } : {}),
              },
            }
          : {}),
        templateName: args.input.templateName ?? undefined,
        templateLanguageCode: args.input.templateLanguageCode ?? undefined,
        templateGroupIdParameter: args.input.templateGroupIdParameter ?? undefined,
        actorUserId,
      };
      return WhatsappGroupsService.sendGroupMessage(context, tErrors, input);
    },
  }),

  pinWhatsappGroupMessage: t.field({
    type: "String",
    description:
      "Pin a message inside a group on Meta (pin lifetime in days is required) and stamp the local pin state; returns the message id.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupPinInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
      const { messageId } = await WhatsappGroupsService.pinGroupMessage(context, tErrors, {
        groupId: args.input.groupId,
        messageId: args.input.messageId,
        operation: args.input.operation === "pin" ? "pin" : "unpin",
        expirationDays: args.input.expirationDays ?? undefined,
        actorUserId,
      });
      return messageId;
    },
  }),

  unpinWhatsappGroupMessage: t.field({
    type: "String",
    description:
      "Unpin a message inside a group on Meta and clear the local pin state; returns the message id. Unpin has no expiry — the input's expirationDays is ignored.",
    authScopes: { permission: AppPermission.WHATSAPP_GROUPS_MANAGE },
    args: {
      input: t.arg({ type: WhatsappGroupPinInputPothosObject, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
      const { messageId } = await WhatsappGroupsService.unpinGroupMessage(context, tErrors, {
        groupId: args.input.groupId,
        messageId: args.input.messageId,
        actorUserId,
      });
      return messageId;
    },
  }),
}));
