import type { WhatsappGroupJoinApprovalMode } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { requireAuth } from "@/backend/graphql/utils/requireAuth";
import { WhatsappGroupsService } from "@/backend/services";
import type { UserPermissionContext, WhatsappGroupSendInput } from "@/backend/types";

type WhatsappGroupCreateInputShape = {
  readonly accountId: string;
  readonly subject: string;
  readonly description?: string | null;
  readonly joinApprovalMode?: WhatsappGroupJoinApprovalMode | null;
};

type WhatsappGroupSettingsUpdateInputShape = {
  readonly groupId: string;
  readonly subject?: string | null;
  readonly description?: string | null;
  readonly profilePicturePath?: string | null;
};

type WhatsappGroupIdsInputShape = {
  readonly groupId: string;
  readonly joinRequestIds: string[];
};

type WhatsappGroupParticipantsInputShape = {
  readonly groupId: string;
  readonly participants: string[];
};

type WhatsappGroupSendInputShape = {
  readonly groupId: string;
  readonly body?: string | null;
  readonly previewUrl?: boolean | null;
  readonly templateName?: string | null;
  readonly templateLanguageCode?: string | null;
  readonly templateGroupIdParameter?: string | null;
};

type WhatsappGroupPinInputShape = {
  readonly groupId: string;
  readonly messageId: string;
  readonly operation: string;
  readonly expirationDays?: number | null;
};

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
  tErrors: ReturnType<BaseContext["t"]>["errorsTranslations"];
  actorUserId: string;
}> {
  return {
    context: permissionContext(ctx),
    tErrors: ctx.t().errorsTranslations,
    actorUserId: await requireAuth(ctx),
  };
}

function groupSettingsUpdateInput(input: WhatsappGroupSettingsUpdateInputShape, actorUserId: string) {
  return {
    ...input,
    subject: input.subject ?? undefined,
    description: input.description ?? undefined,
    profilePicturePath: input.profilePicturePath ?? undefined,
    actorUserId,
  };
}

function pinMessageTarget(input: WhatsappGroupPinInputShape, actorUserId: string) {
  return { groupId: input.groupId, messageId: input.messageId, actorUserId };
}

export async function createWhatsappGroup(ctx: BaseContext, input: WhatsappGroupCreateInputShape) {
  const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
  return WhatsappGroupsService.createGroup(context, tErrors, {
    ...input,
    description: input.description ?? undefined,
    joinApprovalMode: input.joinApprovalMode ?? undefined,
    actorUserId,
  });
}

export async function deleteWhatsappGroup(ctx: BaseContext, groupId: string) {
  const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
  return WhatsappGroupsService.deleteGroup(context, tErrors, { groupId, actorUserId });
}

export async function updateWhatsappGroupSettings(ctx: BaseContext, input: WhatsappGroupSettingsUpdateInputShape) {
  const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
  return WhatsappGroupsService.updateGroupSettings(context, tErrors, groupSettingsUpdateInput(input, actorUserId));
}

export async function syncWhatsappGroups(ctx: BaseContext, accountId: string | null) {
  const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
  return WhatsappGroupsService.syncGroups(context, tErrors, { accountId, actorUserId });
}

export async function getWhatsappGroupInviteLink(ctx: BaseContext, groupId: string) {
  await requireAuth(ctx);
  const { inviteLink } = await WhatsappGroupsService.getInviteLink(permissionContext(ctx), ctx.t().errorsTranslations, {
    groupId,
  });
  return inviteLink;
}

export async function resetWhatsappGroupInviteLink(ctx: BaseContext, groupId: string) {
  const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
  const { inviteLink } = await WhatsappGroupsService.resetInviteLink(context, tErrors, { groupId, actorUserId });
  return inviteLink;
}

export async function approveWhatsappGroupJoinRequests(ctx: BaseContext, input: WhatsappGroupIdsInputShape) {
  const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
  return WhatsappGroupsService.approveJoinRequests(context, tErrors, {
    groupId: input.groupId,
    joinRequestIds: input.joinRequestIds,
    actorUserId,
  });
}

export async function rejectWhatsappGroupJoinRequests(ctx: BaseContext, input: WhatsappGroupIdsInputShape) {
  const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
  return WhatsappGroupsService.rejectJoinRequests(context, tErrors, {
    groupId: input.groupId,
    joinRequestIds: input.joinRequestIds,
    actorUserId,
  });
}

export async function removeWhatsappGroupParticipants(ctx: BaseContext, input: WhatsappGroupParticipantsInputShape) {
  const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
  return WhatsappGroupsService.removeParticipants(context, tErrors, {
    groupId: input.groupId,
    participants: input.participants,
    actorUserId,
  });
}

export async function sendWhatsappGroupMessage(ctx: BaseContext, input: WhatsappGroupSendInputShape) {
  const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
  const sendInput: WhatsappGroupSendInput = {
    groupId: input.groupId,
    ...(input.body != null
      ? {
          text: {
            body: input.body,
            ...(input.previewUrl != null ? { previewUrl: input.previewUrl } : {}),
          },
        }
      : {}),
    templateName: input.templateName ?? undefined,
    templateLanguageCode: input.templateLanguageCode ?? undefined,
    templateGroupIdParameter: input.templateGroupIdParameter ?? undefined,
    actorUserId,
  };
  return WhatsappGroupsService.sendGroupMessage(context, tErrors, sendInput);
}

export async function pinWhatsappGroupMessage(ctx: BaseContext, input: WhatsappGroupPinInputShape) {
  const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
  const { messageId } = await WhatsappGroupsService.pinGroupMessage(context, tErrors, {
    ...pinMessageTarget(input, actorUserId),
    operation: input.operation === "pin" ? "pin" : "unpin",
    expirationDays: input.expirationDays ?? undefined,
  });
  return messageId;
}

export async function unpinWhatsappGroupMessage(ctx: BaseContext, input: WhatsappGroupPinInputShape) {
  const { context, tErrors, actorUserId } = await groupMutationContext(ctx);
  const { messageId } = await WhatsappGroupsService.unpinGroupMessage(
    context,
    tErrors,
    pinMessageTarget(input, actorUserId)
  );
  return messageId;
}
