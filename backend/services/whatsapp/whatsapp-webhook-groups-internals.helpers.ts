/**
 * Internal projections for the groups-facing webhook helpers
 * (`whatsapp-webhook-groups.helpers.ts`): untrusted-payload narrowing, the
 * shared groups-field scaffold, participant batch writes, and the inbound
 * group-message/status projections. Payloads are untrusted parsed JSON —
 * every accessor narrows via guards rather than casts, and message content is
 * never logged (ids and counts only).
 */

import {
  WhatsappGroupMessageRepository,
  WhatsappGroupParticipantRepository,
  WhatsappGroupRepository,
} from "@/backend/db/repo/whatsapp";
import { WhatsappGroupJoinApprovalMode } from "@/backend/enum/whatsapp/whatsapp-groups.enum";
import { logger } from "@/backend/lib/logger";
import {
  isRecord,
  isValidWamid,
  resolveAccountByPhoneNumberId,
  toSafeString,
} from "@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers";
import type { WhatsappAccountReturnType, WhatsappGroupReturnType } from "@/backend/types";

/** Group subject column cap (schema varchar(128)). */
export const SUBJECT_MAX = 128;

/** Participant wa_id column cap (schema varchar(32)). */
const WA_ID_MAX = 32;

/** Default membership provenance when the event carries no `reason`. */
export const DEFAULT_ADDED_VIA = "invite_link";

/** Fallback type label for group messages whose `type` is absent/unparseable. */
const UNKNOWN_GROUP_MESSAGE_TYPE = "unknown";

/** Meta Unix-seconds timestamp (number or digit string) → Date; else null. */
export function parseGroupTimestamp(raw: unknown): Date | null {
  let seconds = NaN;
  if (typeof raw === "number") {
    seconds = raw;
  } else if (typeof raw === "string" && /^\d{1,13}$/.test(raw)) {
    seconds = Number(raw);
  }
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Map the Meta wire `join_approval_mode` literal to the enum. Unknown values
 * fall back to `ApprovalRequired`, the conservative moderation default.
 */
export function coerceJoinApprovalMode(raw: unknown): WhatsappGroupJoinApprovalMode {
  // Compare against the Meta wire literal ("auto_approve") — the enum member
  // is `WhatsappGroupJoinApprovalMode.AutoApprove` (oxlint string-literal fix pattern).
  if (raw === "auto_approve") {
    return WhatsappGroupJoinApprovalMode.AutoApprove;
  }
  return WhatsappGroupJoinApprovalMode.ApprovalRequired;
}

/** Group events array of an untrusted groups-field value (empty when absent). */
function groupEventsOf(value: Record<string, unknown>): Record<string, unknown>[] {
  return Array.isArray(value.groups) ? value.groups.filter(isRecord) : [];
}

/** Typed references to one group event (narrowed where the jid is usable). */
interface GroupEventRef {
  readonly event: Record<string, unknown>;
  readonly type: string | undefined;
  readonly groupId: string;
}

/** group_id of an untrusted group event (null when absent). */
function groupIdOf(event: Record<string, unknown>): string | null {
  return toSafeString(event.group_id) ?? null;
}

/**
 * Narrow a groups-field event batch into typed refs, dropping events without
 * a usable group_id (expected rejection: logged and skipped).
 */
function groupEventRefsOf(value: Record<string, unknown>, description: string): GroupEventRef[] {
  return groupEventsOf(value)
    .map(event => ({ event, type: toSafeString(event.type), groupId: groupIdOf(event) }))
    .filter((ref): ref is GroupEventRef => {
      if (ref.groupId) {
        return true;
      }
      logger.logDomainError(`whatsapp-webhook-groups: ${description} event without group_id; skipped`, {
        type: ref.type,
      });
      return false;
    });
}

/**
 * Shared groups-field scaffold: resolve the account from the value's
 * `phone_number_id` (throwing when absent — a groups field without a
 * resolvable account is an ingest failure, not a skippable event), narrow the
 * batch into typed refs, and dispatch each event in parallel. Group events
 * are independent per group jid.
 */
export async function forGroupEvent(
  value: Record<string, unknown>,
  wabaId: string,
  description: string,
  handle: (account: WhatsappAccountReturnType, ref: GroupEventRef) => Promise<void>
): Promise<void> {
  const account = await resolveAccountByPhoneNumberId(value, wabaId);
  if (!account) {
    throw new Error(`whatsapp-webhook-groups: no account for ${description} update`);
  }
  const events = groupEventRefsOf(value, description);
  // Group events are independent per group jid — parallelize the batch.
  await Promise.all(events.map(ref => handle(account, ref)));
}

/** True when the event carries a non-empty `errors` array (Meta-side failure). */
export function eventHasErrors(event: Record<string, unknown>): boolean {
  return Array.isArray(event.errors) && event.errors.length > 0;
}

/** Resolve the group row for a jid; expected-rejection log + null when unknown. */
export async function resolveGroupByJid(
  account: WhatsappAccountReturnType,
  groupId: string,
  description: string
): Promise<WhatsappGroupReturnType | null> {
  const group = await WhatsappGroupRepository.findByGroupJid(account.id, groupId);
  if (!group) {
    logger.logDomainError(`whatsapp-webhook-groups: ${description} for unknown group; skipped`, { groupId });
  }
  return group;
}

/**
 * Membership identity of one untrusted participant entry: a bare wa_id string,
 * or a record carrying `wa_id` (member events) / `input` (business removals
 * name the phone or wa_id that was passed to the API). Null when unusable or
 * over the column cap.
 */
function participantWaIdOf(entry: unknown): string | null {
  let waId: string | null = null;
  if (typeof entry === "string" && entry.length > 0) {
    waId = entry;
  } else if (isRecord(entry)) {
    waId = toSafeString(entry.wa_id) ?? toSafeString(entry.input) ?? null;
  }
  return waId && waId.length <= WA_ID_MAX ? waId : null;
}

/** Re-sync the denormalized totalParticipantCount rollup after a membership change. */
async function syncParticipantCount(groupId: string): Promise<void> {
  const count = await WhatsappGroupParticipantRepository.countByGroup(groupId);
  await WhatsappGroupRepository.updateSettings(groupId, { totalParticipantCount: count });
}

/**
 * Shared membership-batch scaffold: resolve the group row for the event's jid
 * (skipping when unknown), narrow the participant list, and upsert/delete each
 * usable membership in parallel before re-syncing the count rollup.
 */
export async function applyParticipantBatch(
  account: WhatsappAccountReturnType,
  event: Record<string, unknown>,
  groupId: string,
  listKey: "added_participants" | "removed_participants",
  description: string,
  writeMembership: (group: WhatsappGroupReturnType, waId: string) => Promise<unknown>
): Promise<void> {
  const group = await resolveGroupByJid(account, groupId, description);
  if (!group) {
    return;
  }
  const participants = Array.isArray(event[listKey]) ? event[listKey] : [];
  // Membership writes are independent per (groupId, waId) — parallelize.
  await Promise.all(
    participants.map(entry => {
      const waId = participantWaIdOf(entry);
      if (!waId) {
        logger.logDomainError(`whatsapp-webhook-groups: ${description} participant without usable wa_id; skipped`, {
          groupId,
        });
        return Promise.resolve();
      }
      return writeMembership(group, waId);
    })
  );
  await syncParticipantCount(group.id);
}

/**
 * Adjust the denormalized pending join request counter by one settlement.
 * The group row is resolved first so out-of-order events for unknown groups
 * are logged and skipped instead of fabricating rows.
 */
export async function adjustPendingJoinRequests(
  account: WhatsappAccountReturnType,
  groupId: string,
  delta: number
): Promise<void> {
  const group = await resolveGroupByJid(account, groupId, "group join request update");
  if (!group) {
    return;
  }
  await WhatsappGroupRepository.adjustPendingJoinRequests(group.id, delta);
}

/** Normalized view of one inbound group message record (untrusted input). */
interface NormalizedGroupMessage {
  readonly wamid: string;
  readonly type: string;
  readonly content: Record<string, unknown>;
  readonly sentAt: Date | null;
}

/** Narrow one untrusted group message record; null when the wamid is unusable. */
export function normalizeGroupMessage(raw: Record<string, unknown>): NormalizedGroupMessage | null {
  const wamid = toSafeString(raw.id);
  if (!wamid || !isValidWamid(wamid)) {
    logger.warn("whatsapp-webhook-groups: group message skipped — invalid wamid", {
      wamid: String(raw.id).slice(0, 20),
    });
    return null;
  }
  const type = toSafeString(raw.type) ?? UNKNOWN_GROUP_MESSAGE_TYPE;
  return { wamid, type, content: isRecord(raw[type]) ? raw[type] : {}, sentAt: parseGroupTimestamp(raw.timestamp) };
}

/** Group row for an inbound message: the existing row, or a bare placeholder. */
export async function findOrCreateGroupByJid(
  account: WhatsappAccountReturnType,
  groupId: string
): Promise<WhatsappGroupReturnType> {
  const existing = await WhatsappGroupRepository.findByGroupJid(account.id, groupId);
  if (existing) {
    return existing;
  }
  // Placeholder row (subject = the group jid) until the group_lifecycle
  // webhook enriches it via updateSettings — the inbound message must not be
  // dropped while the lifecycle event is still in flight.
  return WhatsappGroupRepository.upsertByGroupJid({
    accountId: account.id,
    groupJid: groupId,
    subject: groupId.slice(0, SUBJECT_MAX),
    joinApprovalMode: WhatsappGroupJoinApprovalMode.ApprovalRequired,
  });
}

/** One group status: rewrite the stored row's status varchar. */
export async function applyGroupMessageStatus(status: unknown): Promise<void> {
  const record = isRecord(status) ? status : {};
  const wamid = toSafeString(record.id);
  const metaStatus = toSafeString(record.status);
  if (!wamid || !metaStatus) {
    return;
  }
  if (!isValidWamid(wamid)) {
    logger.warn("whatsapp-webhook-groups: group status skipped — invalid wamid", { wamid: String(wamid).slice(0, 20) });
    return;
  }
  const updated = await WhatsappGroupMessageRepository.updateStatus(wamid, metaStatus);
  if (updated) {
    logger.info("whatsapp-webhook-groups: group message status updated", { wamid, metaStatus });
  } else {
    logger.debug("whatsapp-webhook-groups: no group message row for wamid; status skipped", { wamid, metaStatus });
  }
}
