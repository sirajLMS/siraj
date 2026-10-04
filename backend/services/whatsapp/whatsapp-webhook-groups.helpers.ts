import {
  WhatsappGroupMessageRepository,
  WhatsappGroupParticipantRepository,
  WhatsappGroupRepository,
} from "@/backend/db/repo/whatsapp";
import { WhatsappMessageDirection } from "@/backend/enum/whatsapp/whatsapp-inbox.enum";
import { logger } from "@/backend/lib/logger";
import {
  adjustPendingJoinRequests,
  applyGroupMessageStatus,
  applyParticipantBatch,
  coerceJoinApprovalMode,
  DEFAULT_ADDED_VIA,
  eventHasErrors,
  findOrCreateGroupByJid,
  forGroupEvent,
  normalizeGroupMessage,
  parseGroupTimestamp,
  resolveGroupByJid,
  SUBJECT_MAX,
} from "@/backend/services/whatsapp/whatsapp-webhook-groups-internals.helpers";
import { isRecord, toSafeString } from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import type { WhatsappAccountReturnType } from "@/backend/types";

/**
 * Groups-facing ingest projections for the durable webhook worker: the four
 * WhatsApp Groups webhook fields (`group_lifecycle_update`,
 * `group_participants_update`, `group_settings_update`, `group_status_update`)
 * plus the inbound group-message branch of the `messages` field and its
 * delivery-status follow-ups.
 *
 * Every helper is idempotent — Meta redelivers payloads for up to 7 days with
 * no ordering guarantee, so every write keys on the group jid / participant /
 * wamid guards implemented by the repositories. Out-of-order events (a
 * participant update arriving before the group lifecycle webhook) are logged
 * and skipped instead of fabricating rows.
 *
 * Payloads are untrusted parsed JSON: every accessor narrows via guards
 * (`isRecord` / `toSafeString`) rather than casts, and message content is
 * never logged (ids and counts only).
 */

// ─── group_lifecycle_update ─────────────────────────────────────────────────

/**
 * Ingest a `group_lifecycle_update` value: `group_create` upserts the group
 * row (re-activating a soft-deleted one first) and `group_delete` soft-deletes
 * it. Events carrying a Meta-side `errors` array are skipped — the group
 * state they describe never settled.
 */
export async function handleGroupLifecycleField(value: Record<string, unknown>, wabaId: string): Promise<void> {
  await forGroupEvent(value, wabaId, "group lifecycle", (account, { event, groupId, type }) =>
    dispatchGroupLifecycleEvent(account, event, groupId, type)
  );
}

/** Dispatch one settled lifecycle event to its projection. */
async function dispatchGroupLifecycleEvent(
  account: WhatsappAccountReturnType,
  event: Record<string, unknown>,
  groupId: string,
  type: string | undefined
): Promise<void> {
  // A lifecycle event carrying a Meta-side errors array describes a change
  // that never settled — skipping the upsert keeps the stored group state.
  if (eventHasErrors(event)) {
    logger.logDomainError("whatsapp-webhook-groups: group lifecycle event carried errors; skipped", {
      groupId,
      type,
    });
    return;
  }
  if (type === "group_create") {
    await applyGroupCreate(account, event, groupId);
  } else if (type === "group_delete") {
    await applyGroupDelete(account, groupId);
  } else {
    logger.debug("whatsapp-webhook-groups: unknown group lifecycle event type", { groupId, type });
  }
}

/** group_create: re-activate a soft-deleted row, then upsert by jid. */
async function applyGroupCreate(
  account: WhatsappAccountReturnType,
  event: Record<string, unknown>,
  groupId: string
): Promise<void> {
  const existing = await WhatsappGroupRepository.findByGroupJid(account.id, groupId);
  if (existing?.deletedAt) {
    // The (accountId, groupJid) unique keys survive a soft delete; the row
    // must be active again before the upsert or the conflict branch would
    // silently leave it hidden from every active read path.
    await WhatsappGroupRepository.markActive(existing.id);
  }
  const group = await WhatsappGroupRepository.upsertByGroupJid({
    accountId: account.id,
    groupJid: groupId,
    subject: (toSafeString(event.subject) ?? groupId).slice(0, SUBJECT_MAX),
    joinApprovalMode: coerceJoinApprovalMode(event.join_approval_mode),
    inviteLink: toSafeString(event.invite_link) ?? null,
    creationTimestamp: parseGroupTimestamp(event.timestamp),
  });
  logger.info("whatsapp-webhook-groups: group created", { groupId: group.groupJid, accountId: account.id });
}

/** group_delete: soft-delete the local row; groups we never synced are skipped. */
async function applyGroupDelete(account: WhatsappAccountReturnType, groupId: string): Promise<void> {
  const group = await resolveGroupByJid(account, groupId, "group_delete");
  if (!group) {
    return;
  }
  await WhatsappGroupRepository.markDeleted(group.id);
  logger.info("whatsapp-webhook-groups: group deleted", { groupId });
}

// ─── group_participants_update ──────────────────────────────────────────────

/**
 * Ingest a `group_participants_update` value: membership adds/removes upsert
 * or delete participant rows and then re-sync the denormalized
 * `totalParticipantCount` rollup; join-request events adjust the pending
 * counter atomically.
 */
export async function handleGroupParticipantsField(value: Record<string, unknown>, wabaId: string): Promise<void> {
  await forGroupEvent(value, wabaId, "group participants", (account, { event, groupId, type }) =>
    dispatchParticipantsEvent(account, event, groupId, type)
  );
}

/** Dispatch one participants event to its projection. */
async function dispatchParticipantsEvent(
  account: WhatsappAccountReturnType,
  event: Record<string, unknown>,
  groupId: string,
  type: string | undefined
): Promise<void> {
  if (type === "group_participants_add") {
    await applyParticipantsAdded(account, event, groupId);
  } else if (type === "group_participants_remove") {
    await applyParticipantsRemoved(account, event, groupId);
  } else if (type === "group_join_request_created") {
    await adjustPendingJoinRequests(account, groupId, 1);
  } else if (type === "group_join_request_revoked") {
    await adjustPendingJoinRequests(account, groupId, -1);
  } else {
    logger.debug("whatsapp-webhook-groups: unknown group participants event type", { groupId, type });
  }
}

/** group_participants_add: upsert memberships, then sync the count rollup. */
async function applyParticipantsAdded(
  account: WhatsappAccountReturnType,
  event: Record<string, unknown>,
  groupId: string
): Promise<void> {
  const joinedAt = parseGroupTimestamp(event.timestamp) ?? new Date();
  const addedVia = toSafeString(event.reason) ?? DEFAULT_ADDED_VIA;
  await applyParticipantBatch(account, event, groupId, "added_participants", "group_participants_add", (group, waId) =>
    WhatsappGroupParticipantRepository.upsertByWaId({ groupId: group.id, waId, joinedAt, addedVia })
  );
}

/**
 * group_participants_remove: delete memberships, then sync the count rollup.
 * `initiated_by: "participant"` (self-leave) follows the same removal path —
 * only the Meta-side provenance differs, which the membership rows do not
 * track.
 */
async function applyParticipantsRemoved(
  account: WhatsappAccountReturnType,
  event: Record<string, unknown>,
  groupId: string
): Promise<void> {
  await applyParticipantBatch(
    account,
    event,
    groupId,
    "removed_participants",
    "group_participants_remove",
    (group, waId) => WhatsappGroupParticipantRepository.removeByWaId(group.id, waId)
  );
}

// ─── group_settings_update ──────────────────────────────────────────────────

/**
 * Ingest a `group_settings_update` value: fold every successful subject /
 * description change into one settings patch. Profile picture changes have no
 * storage column and are logged only.
 */
export async function handleGroupSettingsField(value: Record<string, unknown>, wabaId: string): Promise<void> {
  await forGroupEvent(value, wabaId, "group settings", (account, { event, groupId }) =>
    applyGroupSettings(account, event, groupId)
  );
}

/** One settings event: apply subject/description patches that settled. */
async function applyGroupSettings(
  account: WhatsappAccountReturnType,
  event: Record<string, unknown>,
  groupId: string
): Promise<void> {
  const group = await resolveGroupByJid(account, groupId, "group settings update");
  if (!group) {
    return;
  }
  const patch: { subject?: string; description?: string | null } = {};
  const subject = isRecord(event.group_subject) ? event.group_subject : null;
  if (subject?.update_successful === true) {
    const text = toSafeString(subject.text);
    if (text) {
      patch.subject = text.slice(0, SUBJECT_MAX);
    }
  }
  const description = isRecord(event.group_description) ? event.group_description : null;
  if (description?.update_successful === true) {
    patch.description = toSafeString(description.text) ?? null;
  }
  if (Object.keys(patch).length > 0) {
    await WhatsappGroupRepository.updateSettings(group.id, patch);
  }
  const picture = isRecord(event.profile_picture) ? event.profile_picture : null;
  if (picture?.update_successful === true) {
    logger.debug("whatsapp-webhook-groups: profile picture update has no storage column; skipped", { groupId });
  }
}

// ─── group_status_update ────────────────────────────────────────────────────

/**
 * Ingest a `group_status_update` value: suspend / suspend-cleared flip the
 * group's `suspended` flag. Unknown event types are logged and skipped.
 */
export async function handleGroupStatusField(value: Record<string, unknown>, wabaId: string): Promise<void> {
  await forGroupEvent(value, wabaId, "group status", (account, { groupId, type }) =>
    applyGroupStatus(account, groupId, type)
  );
}

/** One status event: suspend / suspend-cleared flips the suspended flag. */
async function applyGroupStatus(
  account: WhatsappAccountReturnType,
  groupId: string,
  type: string | undefined
): Promise<void> {
  if (type !== "group_suspend" && type !== "group_suspend_cleared") {
    logger.debug("whatsapp-webhook-groups: unknown group status event type", { groupId, type });
    return;
  }
  const suspended = type === "group_suspend";
  const group = await resolveGroupByJid(account, groupId, "group status update");
  if (!group) {
    return;
  }
  await WhatsappGroupRepository.updateSettings(group.id, { suspended });
  logger.info("whatsapp-webhook-groups: group suspend state updated", { groupId, suspended });
}

// ─── inbound group messages (messages field branch) ─────────────────────────

/**
 * Ingest one inbound group message (a `messages`-field record carrying
 * `group_id`): find-or-create the group row, then upsert the message keyed on
 * the globally unique wamid. Group messages never create 1:1 inbox
 * conversations.
 */
export async function ingestGroupInboundMessage(
  account: WhatsappAccountReturnType,
  raw: Record<string, unknown>
): Promise<void> {
  const groupId = toSafeString(raw.group_id);
  if (!groupId) {
    return;
  }
  const message = normalizeGroupMessage(raw);
  if (!message) {
    return;
  }
  if (message.type === "revoke" || message.type === "edit") {
    // The group message table has no revoked/edited markers — the mutation
    // has no storage projection and the original row keeps its content.
    logger.debug("whatsapp-webhook-groups: group message mutation has no storage projection; skipped", {
      groupId,
      wamid: message.wamid,
    });
    return;
  }
  const group = await findOrCreateGroupByJid(account, groupId);
  await WhatsappGroupMessageRepository.upsertByWamid({
    groupId: group.id,
    accountId: account.id,
    wamid: message.wamid,
    direction: WhatsappMessageDirection.INBOUND,
    type: message.type,
    content: message.content,
    status: null,
    fromWaId: toSafeString(raw.from) ?? null,
    mediaId: toSafeString(message.content.id) ?? null,
    mediaMime: toSafeString(message.content.mime_type) ?? null,
    sentAt: message.sentAt,
  });
  logger.info("whatsapp-webhook-groups: inbound group message ingested", { groupId, wamid: message.wamid });
}

// ─── group message delivery statuses (statuses field branch) ────────────────

/** Guard: is this webhook status update addressed to a group thread? */
export function isGroupStatusUpdate(status: unknown): boolean {
  return isRecord(status) && status.recipient_type === "group";
}

/**
 * Ingest the group branch of a `messages`-field statuses array: rewrite the
 * stored group message's status per wamid. Statuses are independent
 * wamid-keyed updates — parallelize the batch. Statuses without a stored
 * group message row are skipped (pure inbound / lifecycle noise).
 */
export async function ingestGroupMessageStatuses(statuses: unknown[]): Promise<void> {
  const groupStatuses = statuses.filter(isGroupStatusUpdate);
  await Promise.all(groupStatuses.map(applyGroupMessageStatus));
}
