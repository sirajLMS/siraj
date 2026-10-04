import {
  buildRemoveGroupParticipantsRequest,
  parseGetGroupInviteLinkResponse,
  parseRemoveGroupParticipantsResponse,
  parseResetGroupInviteLinkResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import {
  assertCanManageGroups,
  assertCanViewGroups,
  buildGetInviteLink,
  buildResetInviteLink,
  type GroupGraphScope,
  requireGroup,
  runGroupGraphCall,
} from "@/backend/services/whatsapp/whatsapp-groups.helpers";
import {
  pinGroupMessage as pinGroupMessageOperation,
  sendGroupMessage as sendGroupMessageOperation,
  unpinGroupMessage as unpinGroupMessageOperation,
} from "@/backend/services/whatsapp/whatsapp-groups-messaging.helpers";
import {
  createGroup as createGroupOperation,
  deleteGroup as deleteGroupOperation,
  listGroupMessages as listGroupMessagesOperation,
  listGroups as listGroupsOperation,
  listJoinRequests as listJoinRequestsOperation,
  moderateJoinRequests,
  resolveGroupInviteLink,
  syncGroups as syncGroupsOperation,
  updateGroupSettings as updateGroupSettingsOperation,
} from "@/backend/services/whatsapp/whatsapp-groups-operations.helpers";
import type {
  ApproveWhatsappGroupJoinRequestsInput,
  DBTransaction,
  DeleteWhatsappGroupInput,
  GroupMessageSendResult,
  JoinRequestsOutcome,
  RejectWhatsappGroupJoinRequestsInput,
  RemoveParticipantsOutcome,
  RemoveWhatsappGroupParticipantsInput,
  SyncWhatsappGroupsInput,
  UnpinWhatsappGroupMessageInput,
  UserPermissionContext,
  WhatsappGroupCreateServiceInput,
  WhatsappGroupJoinRequest,
  WhatsappGroupMessagesListInput,
  WhatsappGroupMessagesPaginatedResult,
  WhatsappGroupPinInput,
  WhatsappGroupReturnType,
  WhatsappGroupSendInput,
  WhatsappGroupSettingsUpdateInput,
  WhatsappGroupsListInput,
  WhatsappGroupsPaginatedResult,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Orchestrator for the `/whatsapp` groups workspace: local group registry
 * (create/delete/settings/invite links), group message threads and sends,
 * join-request moderation, and the Meta-side group sync. Meta is the
 * authority on group membership — participant and join-request reconciliation
 * arrives asynchronously via the `group_participants_update` /
 * `group_settings_update` webhooks, so Graph mutations return the provider's
 * parsed outcome without mutating local membership rows. Every entry point
 * takes the caller's `UserPermissionContext` (already on the GraphQL context)
 * so permission checks never re-fetch the context.
 *
 * Each entry point delegates to its operation helper (which owns the
 * permission gate and the Graph/repository work).
 */
export namespace WhatsappGroupsService {
  /** Paginated group list for the workspace, scoped to one account or all visible accounts. */
  export async function listGroups(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappGroupsListInput,
    tx?: DBTransaction
  ): Promise<WhatsappGroupsPaginatedResult> {
    return listGroupsOperation(context, tErrors, input, tx);
  }

  /** Active group row by id (view-permission gated). */
  export async function getGroup(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: { groupId: string },
    tx?: DBTransaction
  ): Promise<WhatsappGroupReturnType> {
    await assertCanViewGroups(context, tErrors);
    return requireGroup(input.groupId, tErrors, tx);
  }

  /** Paginated message thread for one group (view-permission gated). */
  export async function listGroupMessages(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappGroupMessagesListInput,
    tx?: DBTransaction
  ): Promise<WhatsappGroupMessagesPaginatedResult> {
    return listGroupMessagesOperation(context, tErrors, input, tx);
  }

  /** Pending join requests for one group, listed live from Meta (view-permission gated). */
  export async function listJoinRequests(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: { groupId: string },
    tx?: DBTransaction
  ): Promise<WhatsappGroupJoinRequest[]> {
    return listJoinRequestsOperation(context, tErrors, input, tx);
  }

  /** Create a group on Meta and register it locally (manage-permission gated). */
  export async function createGroup(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappGroupCreateServiceInput,
    tx?: DBTransaction
  ): Promise<WhatsappGroupReturnType> {
    return createGroupOperation(context, tErrors, input, tx);
  }

  /** Delete a group on Meta, then soft-delete the local row (manage-permission gated). */
  export async function deleteGroup(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: DeleteWhatsappGroupInput,
    tx?: DBTransaction
  ): Promise<boolean> {
    return deleteGroupOperation(context, tErrors, input, tx);
  }

  /** Update group settings on Meta, then persist them locally (manage-permission gated). */
  export async function updateGroupSettings(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappGroupSettingsUpdateInput,
    tx?: DBTransaction
  ): Promise<WhatsappGroupReturnType> {
    return updateGroupSettingsOperation(context, tErrors, input, tx);
  }

  /** Sync groups from Meta into the local registry (manage-permission gated). */
  export async function syncGroups(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: SyncWhatsappGroupsInput,
    tx?: DBTransaction
  ): Promise<number> {
    return syncGroupsOperation(context, tErrors, input, tx);
  }

  /** Read the current invite link from Meta and cache it on the local row. */
  export async function getInviteLink(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: { groupId: string },
    tx?: DBTransaction
  ): Promise<{ inviteLink: string }> {
    return resolveGroupInviteLink(context, input, tErrors, buildGetInviteLink, parseGetGroupInviteLinkResponse, tx);
  }

  /** Revoke the current invite link on Meta and issue a new one, caching it locally. */
  export async function resetInviteLink(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: { groupId: string; actorUserId: string },
    tx?: DBTransaction
  ): Promise<{ inviteLink: string }> {
    return resolveGroupInviteLink(context, input, tErrors, buildResetInviteLink, parseResetGroupInviteLinkResponse, tx);
  }

  /** Approve pending join requests on Meta (manage-permission gated). */
  export async function approveJoinRequests(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: ApproveWhatsappGroupJoinRequestsInput,
    tx?: DBTransaction
  ): Promise<JoinRequestsOutcome> {
    return moderateJoinRequests(context, tErrors, input.groupId, input.joinRequestIds, "approve", tx);
  }

  /** Reject pending join requests on Meta (manage-permission gated). */
  export async function rejectJoinRequests(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: RejectWhatsappGroupJoinRequestsInput,
    tx?: DBTransaction
  ): Promise<JoinRequestsOutcome> {
    return moderateJoinRequests(context, tErrors, input.groupId, input.joinRequestIds, "reject", tx);
  }

  /**
   * Remove participants from a group on Meta. The sync response only
   * confirms acceptance (`success: true`) — the actual removed/failed
   * outcome arrives asynchronously via the `group_participants_update`
   * webhook, so the returned outcome always carries empty lists.
   */
  export async function removeParticipants(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: RemoveWhatsappGroupParticipantsInput,
    tx?: DBTransaction
  ): Promise<RemoveParticipantsOutcome> {
    await assertCanManageGroups(context, tErrors);
    const buildRequest = (scope: GroupGraphScope) =>
      buildRemoveGroupParticipantsRequest(scope.ctx, { groupId: scope.groupJid, participants: input.participants });
    return (await runGroupGraphCall(input.groupId, tErrors, buildRequest, parseRemoveGroupParticipantsResponse, { tx }))
      .parsed;
  }

  /** Send a message to a group from the owning account (manage-permission gated). */
  export async function sendGroupMessage(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappGroupSendInput,
    tx?: DBTransaction
  ): Promise<GroupMessageSendResult> {
    return sendGroupMessageOperation(context, tErrors, input, tx);
  }

  /** Pin a message inside a group on Meta and stamp the local pin state. */
  export async function pinGroupMessage(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappGroupPinInput,
    tx?: DBTransaction
  ): Promise<{ messageId: string }> {
    return pinGroupMessageOperation(context, tErrors, input, tx);
  }

  /** Unpin a message inside a group on Meta and clear the local pin state. */
  export async function unpinGroupMessage(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: UnpinWhatsappGroupMessageInput,
    tx?: DBTransaction
  ): Promise<{ messageId: string }> {
    return unpinGroupMessageOperation(context, tErrors, input, tx);
  }
}
