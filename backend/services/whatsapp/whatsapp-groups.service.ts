import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import { db } from "@/backend/db/drizzleDb";
import {
  WhatsappAccountRepository,
  WhatsappGroupMessageRepository,
  WhatsappGroupRepository,
} from "@/backend/db/repo/whatsapp";
import { AppPermission } from "@/backend/enum";
import { WhatsappAccountPurpose } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { WhatsappGroupJoinApprovalMode } from "@/backend/enum/whatsapp/whatsapp-groups.enum";
import { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import { DomainError, ForbiddenError, NotFoundError, ValidationError } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  extractMetaErrorCode,
  GraphApiError,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import {
  buildApproveGroupJoinRequestsRequest,
  buildCreateGroupRequest,
  buildDeleteGroupRequest,
  buildGetGroupInfoRequest,
  buildGetGroupInviteLinkRequest,
  buildListGroupJoinRequestsRequest,
  buildListGroupsRequest,
  buildPinGroupMessageRequest,
  buildRejectGroupJoinRequestsRequest,
  buildRemoveGroupParticipantsRequest,
  buildResetGroupInviteLinkRequest,
  buildSendGroupMessageRequest,
  buildUpdateGroupSettingsMultipartRequest,
  buildUpdateGroupSettingsRequest,
  parseApproveGroupJoinRequestsResponse,
  parseCreateGroupResponse,
  parseDeleteGroupResponse,
  parseGetGroupInfoResponse,
  parseGetGroupInviteLinkResponse,
  parseListGroupJoinRequestsResponse,
  parseListGroupsResponse,
  parsePinGroupMessageResponse,
  parseRejectGroupJoinRequestsResponse,
  parseRemoveGroupParticipantsResponse,
  parseResetGroupInviteLinkResponse,
  parseSendGroupMessageResponse,
  parseUpdateGroupSettingsResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import { accountGraphContext, executeGraphApiCall } from "@/backend/services/whatsapp/whatsapp-graph.helpers";
import type {
  ApproveWhatsappGroupJoinRequestsInput,
  CreateGroupResponseBody,
  DBTransaction,
  DeleteWhatsappGroupInput,
  GraphApiRequestContext,
  GraphApiRequestInit,
  GroupInfo,
  GroupInfoRaw,
  GroupInviteLinkRaw,
  GroupMessageSendResult,
  JoinRequestsOutcome,
  ListGroupsRaw,
  RejectWhatsappGroupJoinRequestsInput,
  RemoveParticipantsOutcome,
  RemoveWhatsappGroupParticipantsInput,
  SendGroupMessageInput,
  SendTemplateMessageResponseBody,
  SyncWhatsappGroupsInput,
  UnpinWhatsappGroupMessageInput,
  UserPermissionContext,
  WhatsappAccountSelectType,
  WhatsappGroupCreateServiceInput,
  WhatsappGroupInsertType,
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
import { PaginationArgs } from "@/backend/types/shared/pagination.types";
import { PaginationUtils } from "@/backend/utils/pagination.utils";
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
 */

/** Page size for the sync list fetch (single page per sync run). */
const SYNC_PAGE_LIMIT = 100;
/**
 * Meta Groups API error codes mapped to dedicated localized rejections
 * (`groups_error-codes.md`): 131041 unknown group, 131207 suspended group,
 * 131208 group rate limit, 131211 group create limit reached, 131214 group
 * creation temporarily disabled, 131215 phone number not eligible for the
 * Groups APIs (Official Business Account required), 131212 participant not in
 * the group, 131213 join request no longer exists.
 */
const META_GROUP_ERROR_TRANSLATIONS: Readonly<Record<number, (tErrors: ErrorsLabels) => DomainError>> = {
  131041: tErrors => new DomainError("WHATSAPP_GROUP_UNKNOWN", tErrors.whatsappGroupUnknown),
  131207: tErrors => new DomainError("WHATSAPP_GROUP_SUSPENDED", tErrors.whatsappGroupSuspended),
  131208: tErrors => new DomainError("WHATSAPP_GROUP_RATE_LIMIT_HIT", tErrors.whatsappGroupRateLimitHit),
  131211: tErrors => new DomainError("WHATSAPP_GROUP_CREATE_LIMIT_REACHED", tErrors.whatsappGroupCreateLimitReached),
  131212: tErrors =>
    new DomainError("WHATSAPP_GROUP_PARTICIPANT_NOT_IN_GROUP", tErrors.whatsappGroupParticipantNotInGroup),
  131213: tErrors => new DomainError("WHATSAPP_GROUP_JOIN_REQUEST_NOT_FOUND", tErrors.whatsappGroupJoinRequestNotFound),
  131214: tErrors =>
    new DomainError("WHATSAPP_GROUP_CREATION_TEMPORARILY_DISABLED", tErrors.whatsappGroupCreationTemporarilyDisabled),
  131215: tErrors => new ValidationError(tErrors.whatsappGroupNotEligible),
};
/** Default join-approval mode applied when neither the input nor Meta's info read carries one. */
const DEFAULT_JOIN_APPROVAL_MODE = WhatsappGroupJoinApprovalMode.ApprovalRequired;
/** Milliseconds in one day (pin-expiry computation). */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function assertCanViewGroups(context: UserPermissionContext, tErrors: ErrorsLabels): Promise<void> {
  const ok = await PermissionsService.hasPermission(context, AppPermission.WHATSAPP_GROUPS_VIEW);
  if (!ok) {
    throw new ForbiddenError(tErrors.insufficientPermissions);
  }
}

async function assertCanManageGroups(context: UserPermissionContext, tErrors: ErrorsLabels): Promise<void> {
  const ok = await PermissionsService.hasPermission(context, AppPermission.WHATSAPP_GROUPS_MANAGE);
  if (!ok) {
    throw new ForbiddenError(tErrors.insufficientPermissions);
  }
}

/** Reject a failed id lookup as the caller's NOT_FOUND domain error. */
function assertFound<T>(row: T | null, notFound: () => DomainError): T {
  if (row === null) {
    throw notFound();
  }
  return row;
}

/**
 * Load an active (non-deleted) group row by id, rejecting unknown ids before
 * any Graph call or dependent read runs.
 */
const requireGroup = async (
  groupId: string,
  tErrors: ErrorsLabels,
  tx?: DBTransaction
): Promise<WhatsappGroupReturnType> =>
  assertFound(
    await WhatsappGroupRepository.findById(groupId, tx),
    () => new NotFoundError("WHATSAPP_GROUP", tErrors.notFound)
  );

/**
 * Load the account row with its decrypted credential columns. The
 * `encryptedText` column driver decrypts at read time, so
 * `encryptedAccessToken` here is the plaintext Meta token.
 */
async function requireAccount(
  accountId: string,
  tErrors: ErrorsLabels,
  tx?: DBTransaction
): Promise<WhatsappAccountSelectType> {
  const account = await WhatsappAccountRepository.findCredentialsById(accountId, tx);
  return assertFound(account, () => new NotFoundError("WHATSAPP_ACCOUNT", tErrors.whatsappAccountNotFound(accountId)));
}

/**
 * Translate a group Graph API failure: Meta's documented Groups API error
 * codes map to dedicated localized rejections (131215 — the phone number is
 * not eligible for the Groups APIs — surfaces as a validation rejection
 * telling the caller to request OBA status), every other failure — other
 * Graph API rejections, builder validation errors, network/timeout — maps to
 * the generic groups domain error. Already-localized domain errors (e.g. the
 * missing-credentials config error) propagate unchanged.
 */
function translateGroupGraphError(error: unknown, tErrors: ErrorsLabels): never {
  if (error instanceof DomainError) {
    throw error;
  }
  const metaCode = error instanceof GraphApiError ? extractMetaErrorCode(error.errorBody) : undefined;
  const translate = metaCode !== undefined ? META_GROUP_ERROR_TRANSLATIONS[metaCode] : undefined;
  if (translate) {
    throw translate(tErrors);
  }
  throw new DomainError("WHATSAPP_GROUPS_GRAPH_FAILED", tErrors.whatsappGroupActionFailed, { cause: error });
}

type GroupGraphScope = {
  readonly groupJid: string;
  readonly account: WhatsappAccountSelectType;
  readonly ctx: GraphApiRequestContext;
};

/**
 * Required `expirationDays` for a group pin, rejecting an undefined value as
 * a validation error. Called at each use site instead of relying on
 * control-flow narrowing, which cannot cross the helper closure boundary.
 */
function requirePinExpirationDays(input: WhatsappGroupPinInput, tErrors: ErrorsLabels): number {
  if (input.expirationDays === undefined) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return input.expirationDays;
}

/** Group-scoped request builders for the Graph actions without per-call inputs. */
function buildListJoinRequests(scope: GroupGraphScope): GraphApiRequestInit {
  return buildListGroupJoinRequestsRequest(scope.ctx, { groupId: scope.groupJid });
}

function buildGetInviteLink(scope: GroupGraphScope): GraphApiRequestInit {
  return buildGetGroupInviteLinkRequest(scope.ctx, { groupId: scope.groupJid });
}

function buildResetInviteLink(scope: GroupGraphScope): GraphApiRequestInit {
  return buildResetGroupInviteLinkRequest(scope.ctx, { groupId: scope.groupJid });
}

/**
 * Shared scaffold for the group Graph actions: resolve the local group row,
 * its owning account's decrypted credentials, and the per-account Graph
 * context, then execute the caller's Graph call against that scope and
 * translate every failure through the groups domain error mapping. The
 * optional `validate` hook runs after account resolution and before the
 * Graph context is built, so payload guards keep their place ahead of the
 * missing-credentials config error. Returns the resolved local group row so
 * callers can run their post-Graph persistence against it — post-Graph
 * repository writes stay outside the execute callback so their failures are
 * not wrapped as Graph failures.
 */
async function runGroupGraphAction<T>(
  groupId: string,
  tErrors: ErrorsLabels,
  execute: (scope: GroupGraphScope) => Promise<T>,
  options: { validate?: () => void; tx?: DBTransaction } = {}
): Promise<{ group: WhatsappGroupReturnType; result: T }> {
  const group = await requireGroup(groupId, tErrors, options.tx);
  const account = await requireAccount(group.accountId, tErrors, options.tx);
  options.validate?.();
  const ctx = await accountGraphContext(account, tErrors);
  let result: T;
  try {
    result = await execute({ groupJid: group.groupJid, account, ctx });
  } catch (error) {
    throw translateGroupGraphError(error, tErrors);
  }
  return { group, result };
}

/**
 * Execute one Graph API call through the shared group action scaffold and
 * parse the raw response body with the caller's parser, so failure
 * translation and wire-shape validation happen in one place (matching the
 * original per-function behavior). The optional `validate` hook keeps
 * payload guards ahead of the Graph context build.
 */
async function runGroupGraphCall<TResult>(
  groupId: string,
  tErrors: ErrorsLabels,
  build: (scope: GroupGraphScope) => GraphApiRequestInit,
  parseResponse: (raw: never) => TResult,
  options: { validate?: () => void; tx?: DBTransaction } = {}
): Promise<{ group: WhatsappGroupReturnType; parsed: TResult }> {
  const { group, result } = await runGroupGraphAction(
    groupId,
    tErrors,
    scope => executeGraphApiCall<never>(build(scope)),
    options
  );
  return { group, parsed: parseResponse(result) };
}

/**
 * Approve or reject pending join requests on Meta, returning the provider's
 * parsed outcome verbatim — local membership/participant reconciliation is
 * left to the `group_participants_update` webhook.
 */
async function moderateJoinRequests(
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
 * Build the local upsert payload for one Meta group, preferring the live
 * group-info read over the caller's fallback fields. The Meta group id is
 * stored as `groupJid` (the (accountId, groupJid) pair is the upsert key).
 */
function groupUpsertPayload(
  accountId: string,
  groupJid: string,
  fallback: { subject: string; description?: string; joinApprovalMode?: WhatsappGroupJoinApprovalMode },
  info: GroupInfo | null,
  syncedAt: Date
): WhatsappGroupInsertType {
  return {
    accountId,
    groupJid,
    subject: info?.subject ?? fallback.subject,
    description: info?.description ?? fallback.description ?? null,
    joinApprovalMode: info?.joinApprovalMode ?? fallback.joinApprovalMode ?? DEFAULT_JOIN_APPROVAL_MODE,
    suspended: info?.suspended ?? false,
    totalParticipantCount: info?.totalParticipantCount ?? 0,
    ...(info?.creationTimestamp !== undefined
      ? { creationTimestamp: new Date(Number(info.creationTimestamp) * 1000) }
      : {}),
    syncedAt,
  };
}

/** Fetch and map one group's live info from Meta; `null` when the read fails (caller falls back). */
async function fetchGroupInfo(ctx: GraphApiRequestContext, groupId: string): Promise<GroupInfo | null> {
  try {
    return parseGetGroupInfoResponse(
      await executeGraphApiCall<GroupInfoRaw>(buildGetGroupInfoRequest(ctx, { groupId }))
    );
  } catch (error) {
    logger.error(
      `whatsapp-groups-service: group info fetch failed groupId=${groupId}: ${error instanceof Error ? error.message : String(error)}`,
      { groupId, error }
    );
    return null;
  }
}

export namespace WhatsappGroupsService {
  /**
   * Paginated group list for the workspace. When `accountId` is present the
   * list is scoped to that account, otherwise it spans every account the
   * caller is permitted to see.
   */
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

  /**
   * Read or regenerate the group's invite link on Meta with the owning
   * account's credentials, then cache it on the local row. Meta is the
   * authority on link validity — the cached column is advisory.
   */
  async function resolveGroupInviteLink(
    input: { groupId: string },
    tErrors: ErrorsLabels,
    buildRequest: (scope: GroupGraphScope) => GraphApiRequestInit,
    parseResponse: (body: GroupInviteLinkRaw) => { inviteLink: string },
    tx?: DBTransaction
  ): Promise<{ inviteLink: string }> {
    const { group, parsed } = await runGroupGraphCall(input.groupId, tErrors, buildRequest, parseResponse, { tx });
    const inviteLink = parsed.inviteLink;
    await WhatsappGroupRepository.updateSettings(group.id, { inviteLink }, tx);
    return { inviteLink };
  }

  /**
   * Paginated message thread for one group. `groupId` is client-supplied, so
   * the group row is loaded first and must exist (and thus belong to an
   * account of this tenant) — otherwise the read is rejected as NOT_FOUND
   * before any message rows are fetched.
   */
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

  /**
   * Pending join requests for one group, listed live from Meta with the
   * owning account's credentials (view-permission gated). Webhooks own the
   * pending-join-request rollup; this read is always straight from Meta.
   */
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
   * Create a group on Meta and register it locally:
   * 1. manage-permission gate and account resolution;
   * 2. Graph create with the account's phone number — the create response
   *    carries only the group id;
   * 3. immediate group-info fetch for subject/description/approval-mode
   *    detail — a failed info fetch is non-fatal (logged) and the upsert
   *    falls back to the create input's fields;
   * 4. idempotent local upsert keyed on (accountId, groupJid), returning the
   *    local row.
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

  /**
   * Delete a group on Meta, then soft-delete the local row. Meta's
   * `{ success: true }` confirmation is required before the local
   * `deletedAt` stamp — a Meta-rejected delete leaves the group active.
   */
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

  /**
   * Update group settings on Meta, then persist the subject/description
   * locally. The JSON variant carries text fields only; a staged
   * `profilePicturePath` switches to the multipart variant (Meta only
   * accepts JPEG group photos). Per-field update failures arrive
   * asynchronously via the `group_settings_update` webhook.
   */
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

  /**
   * Read the current invite link from Meta and cache it on the local row.
   * Meta is the authority on link validity — the cached column is advisory.
   */
  export async function getInviteLink(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: { groupId: string },
    tx?: DBTransaction
  ): Promise<{ inviteLink: string }> {
    await assertCanManageGroups(context, tErrors);
    return resolveGroupInviteLink(input, tErrors, buildGetInviteLink, parseGetGroupInviteLinkResponse, tx);
  }

  /**
   * Revoke the current invite link on Meta and issue a new one, caching the
   * regenerated link on the local row. Every previously shared link becomes
   * invalid.
   */
  export async function resetInviteLink(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: { groupId: string; actorUserId: string },
    tx?: DBTransaction
  ): Promise<{ inviteLink: string }> {
    await assertCanManageGroups(context, tErrors);
    return resolveGroupInviteLink(input, tErrors, buildResetInviteLink, parseResetGroupInviteLinkResponse, tx);
  }

  /**
   * Approve pending join requests on Meta. The provider's parsed outcome
   * (approved list + per-request failures) is returned verbatim — local
   * membership/participant reconciliation is left to the
   * `group_participants_update` webhook.
   */
  export async function approveJoinRequests(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: ApproveWhatsappGroupJoinRequestsInput,
    tx?: DBTransaction
  ): Promise<JoinRequestsOutcome> {
    return moderateJoinRequests(context, tErrors, input.groupId, input.joinRequestIds, "approve", tx);
  }

  /**
   * Reject pending join requests on Meta. The provider's parsed outcome
   * (per-request failures) is returned verbatim — reconciliation is left to
   * the `group_participants_update` webhook.
   */
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

  /**
   * Send a message to a group from the owning account:
   * 1. manage-permission gate, group + account resolution;
   * 2. mode resolution from the payload — `templateName` present → template
   *    send (requires a synced language code), otherwise free-text send
   *    (requires a body);
   * 3. Graph API send with the account's own credentials; Meta's 131215
   *    (member not eligible) maps to a validation rejection, everything else
   *    to the generic groups domain error;
   * 4. persist the message as API_OUTBOUND (idempotent via wamid) inside one
   *    transaction after the Graph call completes.
   */
  export async function sendGroupMessage(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappGroupSendInput,
    tx?: DBTransaction
  ): Promise<GroupMessageSendResult> {
    await assertCanManageGroups(context, tErrors);
    const group = await requireGroup(input.groupId, tErrors, tx);
    const account = await requireAccount(group.accountId, tErrors, tx);
    const isTemplate = input.templateName !== undefined && input.templateName.length > 0;
    const body = (input.text?.body ?? "").trim();
    const templateLanguageCode = isTemplate ? (input.templateLanguageCode ?? "") : "";
    if (isTemplate && !templateLanguageCode) {
      throw new ValidationError(tErrors.whatsappTemplateRequired);
    }
    if (!isTemplate && !body) {
      throw new ValidationError(tErrors.whatsappMessageRequired);
    }
    const sendInput: SendGroupMessageInput = isTemplate
      ? {
          groupId: group.groupJid,
          type: "template",
          template: {
            name: input.templateName,
            languageCode: templateLanguageCode,
            ...(input.templateComponents ? { components: input.templateComponents } : {}),
            ...(input.templateGroupIdParameter ? { groupIdParameter: input.templateGroupIdParameter } : {}),
          },
        }
      : {
          groupId: group.groupJid,
          type: "text",
          text: {
            body,
            ...(input.text?.previewUrl !== undefined ? { previewUrl: input.text.previewUrl } : {}),
          },
        };
    let providerMessageId: string;
    try {
      providerMessageId = parseSendGroupMessageResponse(
        await executeGraphApiCall<SendTemplateMessageResponseBody>(
          buildSendGroupMessageRequest(await accountGraphContext(account, tErrors), {
            ...sendInput,
            phoneNumberId: account.phoneNumberId,
          })
        )
      ).providerMessageId;
    } catch (error) {
      throw translateGroupGraphError(error, tErrors);
    }
    const sentAt = new Date();
    const persistSend = async (t: DBTransaction): Promise<GroupMessageSendResult> => {
      await WhatsappGroupMessageRepository.upsertByWamid(
        {
          groupId: group.id,
          accountId: account.id,
          wamid: providerMessageId,
          direction: WhatsappMessageDirection.API_OUTBOUND,
          type: isTemplate ? "template" : "text",
          content: isTemplate ? { body: `[template] ${input.templateName}`, name: input.templateName } : { body },
          status: "sent",
          sentAt,
        },
        t
      );
      return { providerMessageId, groupId: group.id };
    };
    return tx ? await persistSend(tx) : await db.transaction(persistSend);
  }

  /**
   * Pin a message inside a group on Meta and stamp the local pin state
   * (`pinnedAt` + expiry computed from `expirationDays`). A message row not
   * yet ingested locally leaves the stamp to the inbound webhook.
   */
  export async function pinGroupMessage(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: WhatsappGroupPinInput,
    tx?: DBTransaction
  ): Promise<{ messageId: string }> {
    await assertCanManageGroups(context, tErrors);
    const buildRequest = (scope: GroupGraphScope) =>
      buildPinGroupMessageRequest(scope.ctx, {
        groupId: scope.groupJid,
        messageId: input.messageId,
        operation: "pin",
        expirationDays: requirePinExpirationDays(input, tErrors),
        phoneNumberId: scope.account.phoneNumberId,
      });
    await runGroupGraphCall(input.groupId, tErrors, buildRequest, parsePinGroupMessageResponse, {
      validate: () => requirePinExpirationDays(input, tErrors),
      tx,
    });
    const expirationDays = requirePinExpirationDays(input, tErrors);
    const pinnedAt = new Date();
    await WhatsappGroupMessageRepository.markPinned(
      input.messageId,
      pinnedAt,
      new Date(pinnedAt.getTime() + expirationDays * ONE_DAY_MS),
      tx
    );
    return { messageId: input.messageId };
  }

  /**
   * Unpin a message inside a group on Meta and clear the local pin state.
   * A message row not yet ingested locally leaves the clear to the inbound
   * webhook.
   */
  export async function unpinGroupMessage(
    context: UserPermissionContext,
    tErrors: ErrorsLabels,
    input: UnpinWhatsappGroupMessageInput,
    tx?: DBTransaction
  ): Promise<{ messageId: string }> {
    await assertCanManageGroups(context, tErrors);
    const buildRequest = (scope: GroupGraphScope) =>
      buildPinGroupMessageRequest(scope.ctx, {
        groupId: scope.groupJid,
        messageId: input.messageId,
        operation: "unpin",
        phoneNumberId: scope.account.phoneNumberId,
      });
    await runGroupGraphCall(input.groupId, tErrors, buildRequest, parsePinGroupMessageResponse, { tx });
    await WhatsappGroupMessageRepository.markPinned(input.messageId, null, null, tx);
    return { messageId: input.messageId };
  }
}

