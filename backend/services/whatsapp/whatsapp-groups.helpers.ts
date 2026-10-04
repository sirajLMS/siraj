/**
 * Infrastructure helpers for the WhatsApp groups service
 * (`whatsapp-groups.service.ts`): permission gates, group/account resolution,
 * the shared Graph action scaffold, Meta error translation, and the local
 * group upsert payload builder.
 */

import { WhatsappAccountRepository, WhatsappGroupRepository } from "@/backend/db/repo/whatsapp";
import { AppPermission } from "@/backend/enum";
import { WhatsappGroupJoinApprovalMode } from "@/backend/enum/whatsapp/whatsapp-groups.enum";
import { DomainError, ForbiddenError, NotFoundError, ValidationError } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  extractMetaErrorCode,
  GraphApiError,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import {
  buildGetGroupInfoRequest,
  buildGetGroupInviteLinkRequest,
  buildListGroupJoinRequestsRequest,
  buildResetGroupInviteLinkRequest,
  parseGetGroupInfoResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import { accountGraphContext, executeGraphApiCall } from "@/backend/services/whatsapp/whatsapp-graph.helpers";
import type {
  DBTransaction,
  GraphApiRequestContext,
  GraphApiRequestInit,
  GroupInfo,
  GroupInfoRaw,
  UserPermissionContext,
  WhatsappAccountSelectType,
  WhatsappGroupInsertType,
  WhatsappGroupReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

/** Page size for the sync list fetch (single page per sync run). */
export const SYNC_PAGE_LIMIT = 100;
/** Milliseconds in one day (pin-expiry computation). */
export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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

export async function assertCanViewGroups(context: UserPermissionContext, tErrors: ErrorsLabels): Promise<void> {
  const ok = await PermissionsService.hasPermission(context, AppPermission.WHATSAPP_GROUPS_VIEW);
  if (!ok) {
    throw new ForbiddenError(tErrors.insufficientPermissions);
  }
}

export async function assertCanManageGroups(context: UserPermissionContext, tErrors: ErrorsLabels): Promise<void> {
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
export const requireGroup = async (
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
export async function requireAccount(
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
export function translateGroupGraphError(error: unknown, tErrors: ErrorsLabels): never {
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

export type GroupGraphScope = {
  readonly groupJid: string;
  readonly account: WhatsappAccountSelectType;
  readonly ctx: GraphApiRequestContext;
};

/**
 * Required `expirationDays` for a group pin, rejecting an undefined value as
 * a validation error. Called at each use site instead of relying on
 * control-flow narrowing, which cannot cross the helper closure boundary.
 */
export function requirePinExpirationDays(input: { expirationDays?: number }, tErrors: ErrorsLabels): number {
  if (input.expirationDays === undefined) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return input.expirationDays;
}

/** Group-scoped request builders for the Graph actions without per-call inputs. */
export function buildListJoinRequests(scope: GroupGraphScope): GraphApiRequestInit {
  return buildListGroupJoinRequestsRequest(scope.ctx, { groupId: scope.groupJid });
}

export function buildGetInviteLink(scope: GroupGraphScope): GraphApiRequestInit {
  return buildGetGroupInviteLinkRequest(scope.ctx, { groupId: scope.groupJid });
}

export function buildResetInviteLink(scope: GroupGraphScope): GraphApiRequestInit {
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
export async function runGroupGraphCall<TResult>(
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
 * Build the local upsert payload for one Meta group, preferring the live
 * group-info read over the caller's fallback fields. The Meta group id is
 * stored as `groupJid` (the (accountId, groupJid) pair is the upsert key).
 */
export function groupUpsertPayload(
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
export async function fetchGroupInfo(ctx: GraphApiRequestContext, groupId: string): Promise<GroupInfo | null> {
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
