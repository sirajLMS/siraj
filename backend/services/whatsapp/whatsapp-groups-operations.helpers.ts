/**
 * Registry/sync operation bodies for the WhatsApp groups service
 * (`whatsapp-groups.service.ts`): group listing, create/delete/settings,
 * join-request moderation, invite links, and the Meta-side sync. Each
 * exported function here implements one `WhatsappGroupsService` entry point,
 * including its permission gate.
 */

import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import {
  WhatsappAccountRepository,
  WhatsappGroupMessageRepository,
  WhatsappGroupRepository,
} from "@/backend/db/repo/whatsapp";
import { WhatsappAccountPurpose } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { DomainError, NotFoundError, ValidationError } from "@/backend/lib";
import {
  buildApproveGroupJoinRequestsRequest,
  buildCreateGroupRequest,
  buildDeleteGroupRequest,
  buildListGroupsRequest,
  buildRejectGroupJoinRequestsRequest,
  buildUpdateGroupSettingsMultipartRequest,
  buildUpdateGroupSettingsRequest,
  parseApproveGroupJoinRequestsResponse,
  parseCreateGroupResponse,
  parseDeleteGroupResponse,
  parseListGroupJoinRequestsResponse,
  parseListGroupsResponse,
  parseRejectGroupJoinRequestsResponse,
  parseUpdateGroupSettingsResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import { accountGraphContext, executeGraphApiCall } from "@/backend/services/whatsapp/whatsapp-graph.helpers";
import {
  assertCanManageGroups,
  assertCanViewGroups,
  buildListJoinRequests,
  fetchGroupInfo,
  type GroupGraphScope,
  groupUpsertPayload,
  requireAccount,
  requireGroup,
  runGroupGraphCall,
  SYNC_PAGE_LIMIT,
  translateGroupGraphError,
} from "@/backend/services/whatsapp/whatsapp-groups.helpers";
import type {
  CreateGroupResponseBody,
  DBTransaction,
  DeleteWhatsappGroupInput,
  GraphApiRequestInit,
  GroupInviteLinkRaw,
  JoinRequestsOutcome,
  ListGroupsRaw,
  SyncWhatsappGroupsInput,
  UserPermissionContext,
  WhatsappGroupCreateServiceInput,
  WhatsappGroupJoinRequest,
  WhatsappGroupMessagesListInput,
  WhatsappGroupMessagesPaginatedResult,
  WhatsappGroupReturnType,
  WhatsappGroupSettingsUpdateInput,
  WhatsappGroupsListInput,
  WhatsappGroupsPaginatedResult,
} from "@/backend/types";
import { PaginationArgs } from "@/backend/types/shared/pagination.types";
import { PaginationUtils } from "@/backend/utils/pagination.utils";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Approve or reject pending join requests on Meta, returning the provider's
 * parsed outcome verbatim — local membership/participant reconciliation is
 * left to the `group_participants_update` webhook.
 */
export async function moderateJoinRequests(
  context: UserPermissionContext,
  tErrors: ErrorsLabels,
  groupId: string,
  joinRequestIds: string[],
  moderation: "approve" | "reject",
  tx?: DBTransaction
): Promise<JoinRequestsOutcome> {
  await assertCanManageGroups(context, tErrors);
  const buildRequest = (scope: GroupGraphScope) =>
    moderation === "approve"
      ? buildApproveGroupJoinRequestsRequest(scope.ctx, { groupId: scope.groupJid, joinRequestIds })
      : buildRejectGroupJoinRequestsRequest(scope.ctx, { groupId: scope.groupJid, joinRequestIds });
  const parseResponse =
    moderation === "approve" ? parseApproveGroupJoinRequestsResponse : parseRejectGroupJoinRequestsResponse;
  return (await runGroupGraphCall(groupId, tErrors, buildRequest, parseResponse, { tx })).parsed;
}

/**
 * Read or regenerate the group's invite link on Meta with the owning
 * account's credentials, then cache it on the local row. Meta is the
 * authority on link validity — the cached column is advisory.
 */
export async function resolveGroupInviteLink(
  context: UserPermissionContext,
  input: { groupId: string },
  tErrors: ErrorsLabels,
  buildRequest: (scope: GroupGraphScope) => GraphApiRequestInit,
  parseResponse: (body: GroupInviteLinkRaw) => { inviteLink: string },
  tx?: DBTransaction
): Promise<{ inviteLink: string }> {
  await assertCanManageGroups(context, tErrors);
  const { group, parsed } = await runGroupGraphCall(input.groupId, tErrors, buildRequest, parseResponse, { tx });
  const inviteLink = parsed.inviteLink;
  await WhatsappGroupRepository.updateSettings(group.id, { inviteLink }, tx);
  return { inviteLink };
}

/** Paginated group list body, scoped to one account or spanning every visible account. */
export async function listGroups(
  context: UserPermissionContext,
  tErrors: ErrorsLabels,
  input: WhatsappGroupsListInput,
  tx?: DBTransaction
): Promise<WhatsappGroupsPaginatedResult> {
  await assertCanViewGroups(context, tErrors);
  const accountId = input.accountId ?? null;
  const pagination = input.paginationArgs ? PaginationArgs.fromArgs(input.paginationArgs) : null;
  const { rows, totalCount } = await WhatsappGroupRepository.listForAccount(
    { accountId, search: input.search ?? null, pagination: input.paginationArgs ?? null },
    tx
  );
  return {
    id: `whatsapp-groups:${accountId ?? "all"}`,
    rows,
    totalCount,
    pageInfo: PaginationUtils.buildPageInfoFromArgs(pagination, rows.length, totalCount),
  };
}

/** Paginated message thread body for one group. */
export async function listGroupMessages(
  context: UserPermissionContext,
  tErrors: ErrorsLabels,
  input: WhatsappGroupMessagesListInput,
  tx?: DBTransaction
): Promise<WhatsappGroupMessagesPaginatedResult> {
  await assertCanViewGroups(context, tErrors);
  const group = await requireGroup(input.groupId, tErrors, tx);
  const pagination = input.paginationArgs ? PaginationArgs.fromArgs(input.paginationArgs) : null;
  const [rows, total] = await Promise.all([
    WhatsappGroupMessageRepository.listByGroup(group.id, pagination, tx),
    WhatsappGroupMessageRepository.countByGroup(group.id, tx),
  ]);
  return {
    id: `whatsapp-group-messages:${group.id}`,
    rows,
    totalCount: total,
    pageInfo: PaginationUtils.buildPageInfoFromArgs(pagination, rows.length, total),
  };
}

/** Pending join requests for one group, listed live from Meta. */
export async function listJoinRequests(
  context: UserPermissionContext,
  tErrors: ErrorsLabels,
  input: { groupId: string },
  tx?: DBTransaction
): Promise<WhatsappGroupJoinRequest[]> {
  await assertCanViewGroups(context, tErrors);
  const { parsed } = await runGroupGraphCall(
    input.groupId,
    tErrors,
    buildListJoinRequests,
    parseListGroupJoinRequestsResponse,
    { tx }
  );
  return parsed.requests.map(request => ({
    joinRequestId: request.joinRequestId,
    waId: request.waId,
    creationTimestamp: request.creationTimestamp.toISOString(),
  }));
}

/**
 * Create a group on Meta and register it locally, fetching the live info for
 * subject/description/approval-mode detail (a failed info fetch is non-fatal
 * and falls back to the create input's fields).
 */
export async function createGroup(
  context: UserPermissionContext,
  tErrors: ErrorsLabels,
  input: WhatsappGroupCreateServiceInput,
  tx?: DBTransaction
): Promise<WhatsappGroupReturnType> {
  await assertCanManageGroups(context, tErrors);
  const account = await requireAccount(input.accountId, tErrors, tx);
  const ctx = await accountGraphContext(account, tErrors);
  let createdGroupId: string;
  try {
    createdGroupId = parseCreateGroupResponse(
      await executeGraphApiCall<CreateGroupResponseBody>(
        buildCreateGroupRequest(ctx, {
          phoneNumberId: account.phoneNumberId,
          subject: input.subject,
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.joinApprovalMode !== undefined ? { joinApprovalMode: input.joinApprovalMode } : {}),
        })
      )
    ).groupId;
  } catch (error) {
    throw translateGroupGraphError(error, tErrors);
  }
  const info = await fetchGroupInfo(ctx, createdGroupId);
  return WhatsappGroupRepository.upsertByGroupJid(
    groupUpsertPayload(
      account.id,
      createdGroupId,
      { subject: input.subject, description: input.description, joinApprovalMode: input.joinApprovalMode },
      info,
      new Date()
    ),
    tx
  );
}

/** Delete a group on Meta, then soft-delete the local row. */
export async function deleteGroup(
  context: UserPermissionContext,
  tErrors: ErrorsLabels,
  input: DeleteWhatsappGroupInput,
  tx?: DBTransaction
): Promise<boolean> {
  await assertCanManageGroups(context, tErrors);
  const group = await requireGroup(input.groupId, tErrors, tx);
  const account = await requireAccount(group.accountId, tErrors, tx);
  const ctx = await accountGraphContext(account, tErrors);
  let deleted: boolean;
  try {
    deleted = parseDeleteGroupResponse(
      await executeGraphApiCall<{ success?: boolean }>(buildDeleteGroupRequest(ctx, { groupId: group.groupJid }))
    );
  } catch (error) {
    throw translateGroupGraphError(error, tErrors);
  }
  if (!deleted) {
    throw new DomainError("WHATSAPP_GROUPS_GRAPH_FAILED", tErrors.whatsappGroupActionFailed);
  }
  return WhatsappGroupRepository.markDeleted(group.id, tx);
}

/** Update group settings on Meta, then persist the subject/description locally. */
export async function updateGroupSettings(
  context: UserPermissionContext,
  tErrors: ErrorsLabels,
  input: WhatsappGroupSettingsUpdateInput,
  tx?: DBTransaction
): Promise<WhatsappGroupReturnType> {
  await assertCanManageGroups(context, tErrors);
  const group = await requireGroup(input.groupId, tErrors, tx);
  const account = await requireAccount(group.accountId, tErrors, tx);
  const ctx = await accountGraphContext(account, tErrors);
  if (input.subject === undefined && input.description === undefined && !input.profilePicturePath) {
    throw new ValidationError(tErrors.invalidInput);
  }
  try {
    const request = input.profilePicturePath
      ? buildUpdateGroupSettingsMultipartRequest(ctx, {
          groupId: group.groupJid,
          file: await readFile(input.profilePicturePath),
          fileName: basename(input.profilePicturePath),
          mimeType: "image/jpeg",
          ...(input.subject !== undefined ? { subject: input.subject } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        })
      : buildUpdateGroupSettingsRequest(ctx, {
          groupId: group.groupJid,
          ...(input.subject !== undefined ? { subject: input.subject } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        });
    parseUpdateGroupSettingsResponse(await executeGraphApiCall<{ success?: boolean }>(request));
  } catch (error) {
    throw translateGroupGraphError(error, tErrors);
  }
  const updated = await WhatsappGroupRepository.updateSettings(
    group.id,
    {
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
    tx
  );
  if (!updated) {
    throw new NotFoundError("WHATSAPP_GROUP", tErrors.notFound);
  }
  return updated;
}

/**
 * Sync groups from Meta into the local registry: one list page (limit 100)
 * for the resolved account, a live info fetch per group (failures logged,
 * list fields used as fallback), and an idempotent upsert per group. The
 * account resolves by id when given, otherwise the active GENERAL-purpose
 * account, falling back to the first active account.
 */
export async function syncGroups(
  context: UserPermissionContext,
  tErrors: ErrorsLabels,
  input: SyncWhatsappGroupsInput,
  tx?: DBTransaction
): Promise<number> {
  await assertCanManageGroups(context, tErrors);
  const account = input.accountId
    ? await requireAccount(input.accountId, tErrors, tx)
    : ((await WhatsappAccountRepository.findActiveByPurpose(WhatsappAccountPurpose.GENERAL, tx)) ??
      (await WhatsappAccountRepository.findFirstActiveForCredentials(tx)));
  if (!account) {
    throw new NotFoundError("WHATSAPP_ACCOUNT", tErrors.whatsappAccountNotFound(input.accountId ?? "active"));
  }
  const ctx = await accountGraphContext(account, tErrors);
  let page: ReturnType<typeof parseListGroupsResponse>;
  try {
    page = parseListGroupsResponse(
      await executeGraphApiCall<ListGroupsRaw>(
        buildListGroupsRequest(ctx, { phoneNumberId: account.phoneNumberId, limit: SYNC_PAGE_LIMIT })
      )
    );
  } catch (error) {
    throw translateGroupGraphError(error, tErrors);
  }
  const syncedAt = new Date();
  const infos = await Promise.all(page.groups.map(group => fetchGroupInfo(ctx, group.groupId)));
  await Promise.all(
    page.groups.map((group, index) =>
      WhatsappGroupRepository.upsertByGroupJid(
        groupUpsertPayload(
          account.id,
          group.groupId,
          { subject: group.subject, description: undefined, joinApprovalMode: undefined },
          infos[index],
          syncedAt
        ),
        tx
      )
    )
  );
  return page.groups.length;
}
