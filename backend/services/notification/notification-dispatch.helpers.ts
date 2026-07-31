/**
 * `dispatchWithPreferences` — the SOLE entry point through which domain
 * services dispatch notifications (rule #1).
 *
 * Algorithm (§5.2):
 *   1. Early-return `[]` if no payloads or no affected users.
 *   2. Apply `EVENT_CHANNEL_ALLOWLIST`: drop payloads whose
 *      `(eventType, channel)` pair is not in the per-event allowlist
 *      (events absent from the allowlist default to all 4 channels).
 *   3. For each affected user, fetch notification prefs via
 *      `NotificationPreferencesRepository.getByUserId(userId)`. On fetch
 *      failure: log a `logger.warn` and treat that user as
 *      "all channels enabled" — safer to over-notify than under-notify.
 *   4. Skip any payload whose `(channel, eventType)` pair the user has
 *      disabled in their prefs.
 *   5. Per-user, call `CommunicationService.dispatchMulti(userAwarePayloads, locale)`.
 *   6. Log dispatch stats via `logger.info`.
 *   7. Return aggregated `ChannelDispatchResult[]`.
 *
 * Per-user errors are caught and logged so a single user's fetch or dispatch
 * failure does NOT poison the dispatch for other users.
 */

import { NotificationPreferencesRepository, UserRepository } from "@/backend/db/repo";
import { NotificationChannel, NotificationEventType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import type { ChannelDispatchResult, CommunicationPayload } from "@/backend/types";

// ─── Event/channel allowlist ───────────────────────────────────────────

/**
 * Per-event channel restrictions. When an event is present here, only the
 * channels listed are dispatched. Events NOT present here default to all
 * 4 channels (`on_app`, `email`, `sms`, `push`).
 *
 * Enum members are used (not literal `"EMAIL"` strings — F15).
 */
export const EVENT_CHANNEL_ALLOWLIST: Partial<Record<NotificationEventType, NotificationChannel[]>> = {
  [NotificationEventType.CLASS_SCHEDULED]: [NotificationChannel.ON_APP, NotificationChannel.EMAIL],
  [NotificationEventType.CLASS_ACTIVATED]: [NotificationChannel.ON_APP, NotificationChannel.PUSH],
  [NotificationEventType.CLASS_STARTED]: [NotificationChannel.ON_APP, NotificationChannel.PUSH],
  [NotificationEventType.CLASS_COMPLETED]: [NotificationChannel.ON_APP, NotificationChannel.EMAIL],
  [NotificationEventType.CLASS_MARKED_ABSENT]: [NotificationChannel.ON_APP, NotificationChannel.EMAIL],
  [NotificationEventType.CLASS_MARKED_MISSED]: [NotificationChannel.ON_APP, NotificationChannel.EMAIL],
  [NotificationEventType.CLASS_LEAVE_REQUESTED]: [NotificationChannel.ON_APP, NotificationChannel.EMAIL],
  [NotificationEventType.CLASS_RESCHEDULED]: [NotificationChannel.ON_APP, NotificationChannel.EMAIL],
  [NotificationEventType.CLASS_CANCELLED]: [NotificationChannel.ON_APP, NotificationChannel.EMAIL],
  [NotificationEventType.CLASS_RESET]: [NotificationChannel.ON_APP, NotificationChannel.EMAIL],
  [NotificationEventType.STUDENT_STATUS_CHANGED]: [NotificationChannel.ON_APP, NotificationChannel.EMAIL],
  [NotificationEventType.STUDENT_QUOTA_OVERRIDDEN]: [NotificationChannel.ON_APP, NotificationChannel.EMAIL],
  [NotificationEventType.LESSON_REPORT_SUBMITTED]: [
    NotificationChannel.ON_APP,
    NotificationChannel.PUSH,
    NotificationChannel.EMAIL,
  ],
  [NotificationEventType.LESSON_REPORT_REVIEWED]: [
    NotificationChannel.ON_APP,
    NotificationChannel.PUSH,
    NotificationChannel.EMAIL,
  ],
};

// ─── Channel comparison helper ────────────────────────────────────────

const ALL_ENUM_CHANNELS: readonly NotificationChannel[] = Object.values(NotificationChannel).filter(
  ch => ch !== NotificationChannel.WHATSAPP
);

function isAllowed(eventType: NotificationEventType, channel: NotificationChannel): boolean {
  const allowedEnums = EVENT_CHANNEL_ALLOWLIST[eventType];
  if (!allowedEnums) return true; // absent → all channels allowed
  return allowedEnums.includes(channel);
}

// ─── Preferences helper ───────────────────────────────────────────────

type PreferencesByChannel = Map<string, boolean>;

function prefKey(channel: NotificationChannel, eventType: NotificationEventType): string {
  return `${channel}:${eventType}`;
}

/**
 * Convert rows from `NotificationPreferencesRepository.getByUserId(userId)`
 * to a `Map<preferenceKey(channel, eventType), enabled>`. Channel/enum
 * columns on the row are typed as the underlying DB string but cast to the
 * enum members (they're always set by `NotificationPreferencesRepository`
 * via `notificationChannelEnum`/`notificationEventTypeEnum` Drizzle enums,
 * so the cast is safe here).
 */
function prefsToMap(
  rows: ReadonlyArray<{
    readonly channel: NotificationChannel | string;
    readonly eventType: NotificationEventType | string;
    readonly enabled: boolean;
  }>
): PreferencesByChannel {
  const map = new Map<string, boolean>();
  for (const row of rows) {
    map.set(prefKey(row.channel as NotificationChannel, row.eventType as NotificationEventType), row.enabled);
  }
  return map;
}

/**
 * Resolve prefs for a user, returning an empty map on any fetch failure.
 * The caller treats an empty map as "all channels enabled" (safe over-notify).
 * Fetch errors are logged here so downstream callers don't need to.
 */
async function loadPrefsSafe(userId: string): Promise<PreferencesByChannel> {
  try {
    const rows = await NotificationPreferencesRepository.getByUserId(userId);
    return prefsToMap(rows);
  } catch (error) {
    logger.warn("dispatchWithPreferences: prefs fetch failed, falling back to all-enabled", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return new Map();
  }
}

/**
 * Resolve a user's contact info (email/phone) for recipient-address stamping.
 * Returns `null` on fetch failure or when the user is not found / soft-deleted
 * — the caller drops all email/sms payloads for that user (per-user isolation,
 * §5.2) rather than poisoning the dispatch. `findSafeById` is used
 * (not `findById`) because it RLS-excludes soft-deleted rows, matching the
 * safe-user resolution pattern in `gqlContext.ts` / `session.service.ts`.
 */
async function loadUserSafe(
  userId: string
): Promise<{ readonly email: string | null; readonly phone: string | null } | null> {
  try {
    return await UserRepository.findSafeById(userId);
  } catch (error) {
    logger.warn("dispatchWithPreferences: user fetch failed, dropping contact channels for user", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ─── Recipient resolution ─────────────────────────────────────────────

/**
 * Per-channel recipient address for a user. `null` means the channel does
 * not need a recipient address (on_app, push) — those payloads pass through
 * unchanged. An empty string means the channel NEEDS an address but the
 * user has none, so the payload must be dropped.
 */
type RecipientAddress = string | null;

/**
 * Resolve the recipient address for a payload's channel from the user row.
 *
 *   - `NotificationChannel.EMAIL` → `user.email` (always non-null in the schema, but defended).
 *   - `NotificationChannel.SMS`   → `user.phone` (nullable).
 *   - `NotificationChannel.ON_APP` / `NotificationChannel.PUSH` → `null` (no address needed).
 *
 * Returns `null` for channels that don't need an address, and `""` for
 * channels that do but the user lacks the contact field (caller drops the
 * payload). Keeping this pure (no I/O) lets the caller batch the user fetch.
 */
function recipientAddressForChannel(
  channel: NotificationChannel,
  user: { readonly email: string | null; readonly phone: string | null } | null
): RecipientAddress {
  if (channel === NotificationChannel.EMAIL) return user?.email ?? "";
  if (channel === NotificationChannel.SMS) return user?.phone ?? "";
  return null; // on_app, push — no address needed
}

/**
 * Stamp `metadata.to` onto each email/sms payload for `userId` and drop any
 * payload whose required contact field is empty. `on_app`/`push` payloads
 * pass through unchanged (no `to` needed).
 *
// The pure builders (§5.1) cannot do DB I/O, so they never populate
 * `metadata.to`. This is the single place where the recipient address is
 * resolved for the builder-driven dispatch path — keeping builders pure and
 * centralizing recipient resolution in the SOLE sanctioned dispatch entry
 * point (rule #1).
 *
 * `CommunicationPayload` fields are `readonly`, so this returns NEW payload
 * objects (spread + override `metadata`) rather than mutating.
 *
 * If `user` is null (deleted between build and dispatch), ALL email/sms
 * payloads for that user are dropped and a `logger.warn` is emitted — per-user
// isolation (§5.2): one missing user must not poison the dispatch.
 */
function stampRecipientAddress(
  userId: string,
  payloads: readonly CommunicationPayload[],
  user: { readonly email: string | null; readonly phone: string | null } | null
): CommunicationPayload[] {
  const stamped: CommunicationPayload[] = [];
  let droppedContactless = 0;

  for (const payload of payloads) {
    const address = recipientAddressForChannel(payload.channel, user);
    if (address === null) {
      // on_app / push — no recipient address needed.
      stamped.push(payload);
      continue;
    }
    if (!address) {
      // email/sms but user has no contact field — drop this payload.
      droppedContactless++;
      continue;
    }
    stamped.push({
      ...payload,
      metadata: { ...(payload.metadata ?? {}), to: address },
    });
  }

  if (droppedContactless > 0) {
    logger.warn("dispatchWithPreferences: dropped contactless payloads for user", {
      userId,
      droppedCount: droppedContactless,
      userFound: user !== null,
    });
  }

  return stamped;
}

// ─── dispatchWithPreferences ──────────────────────────────────────────

/** Outcome of dispatching one user's filtered payload set. */
interface UserDispatchOutcome {
  readonly results: ChannelDispatchResult[];
  readonly dispatched: number;
  readonly failed: number;
  readonly skippedByPref: number;
}

/**
 * Filter `allowlistedPayloads` to those `userId` has enabled (unknown prefs
 * count as enabled — safe over-notify, matching
 * `NotificationPreferencesService.mergeWithDefaults`) then dispatch them via
 * `CommunicationService.dispatchMulti`. Per-user errors are caught and
 * logged so a single user's failure does NOT poison other users'
 * dispatches (§5.2).
 */
async function dispatchForUser(
  userId: string,
  allowlistedPayloads: readonly CommunicationPayload[],
  prefs: PreferencesByChannel,
  locale: string | undefined
): Promise<UserDispatchOutcome> {
  const userPayloads: CommunicationPayload[] = [];
  let skippedByPref = 0;

  for (const payload of allowlistedPayloads) {
    if (payload.userId !== userId) continue;
    const enabled = prefs.get(prefKey(payload.channel, payload.eventType));
    if (enabled === false) {
      skippedByPref++;
      continue;
    }
    userPayloads.push(payload);
  }

  if (userPayloads.length === 0) {
    return { results: [], dispatched: 0, failed: 0, skippedByPref };
  }

  // Resolve the recipient's contact info and stamp `metadata.to` on each
  // email/sms payload. Pure builders can't do DB I/O (§5.1), so this
  // is the single place where the recipient address is populated for the
  // builder-driven dispatch path. Contactless payloads (user has no email or
  // phone) are dropped here with a warn — per-user isolation (§5.2).
  const user = await loadUserSafe(userId);
  const dispatchPayloads = stampRecipientAddress(userId, userPayloads, user);

  if (dispatchPayloads.length === 0) {
    return { results: [], dispatched: 0, failed: 0, skippedByPref };
  }

  try {
    const results = await CommunicationService.dispatchMulti(dispatchPayloads, locale);
    let dispatched = 0;
    let failed = 0;
    for (const r of results) {
      if (r.success) dispatched++;
      else failed++;
    }
    return { results, dispatched, failed, skippedByPref };
  } catch (error) {
    const message = error instanceof Error ? error.message : "dispatchMulti threw";
    logger.error("dispatchWithPreferences: per-user dispatchMulti failed", {
      userId,
      payloadCount: userPayloads.length,
      error: message,
    });
    const failResults: ChannelDispatchResult[] = dispatchPayloads.map(p => ({
      channel: p.channel,
      success: false,
      error: message,
    }));
    return { results: failResults, dispatched: 0, failed: dispatchPayloads.length, skippedByPref };
  }
}

/**
 * Dispatch notification payloads to all `affectedUserIds` honouring:
 *   - the per-event channel allowlist (`EVENT_CHANNEL_ALLOWLIST`),
 *   - each user's stored notification preferences.
 *
 * @param payloads         Built by a pure builder from
 *                         `notification-payloads.builders.ts` (one
 *                         `CommunicationPayload[]` fan-out: 4 channels ×
 *                         users). The caller passes the SAME builder output
 *                         here; this helper fans out per user
 *                         automatically by reading `payload.userId`.
 * @param affectedUserIds  Users whose prefs must be checked. Each must
 *                         already have at least one entry in `payloads`
 *                         with that `userId` (callers usually pass the
 *                         `affectedUserIds` used by the builder).
 * @param locale           Optional locale forwarded to
 *                         `CommunicationService.dispatchMulti` for i18n in
 *                         channel adapters.
 * @returns `ChannelDispatchResult[]` aggregated across all users + channels.
 */
export async function dispatchWithPreferences(
  payloads: CommunicationPayload[],
  affectedUserIds: string[],
  locale?: string
): Promise<ChannelDispatchResult[]> {
  if (payloads.length === 0 || affectedUserIds.length === 0) {
    return [];
  }

  // Step 2 — apply allowlist globally (independent of user prefs).
  const allowlistedPayloads = payloads.filter(p => isAllowed(p.eventType, p.channel));
  const skippedByAllowlist = payloads.length - allowlistedPayloads.length;

  // Steps 3-5 — per-user prefs filter + dispatch, aggregated.
  let dispatchedCount = 0;
  let skippedByPref = 0;
  let failedCount = 0;
  const allResults: ChannelDispatchResult[] = [];

  for (const userId of affectedUserIds) {
    const prefs = await loadPrefsSafe(userId);
    const outcome = await dispatchForUser(userId, allowlistedPayloads, prefs, locale);
    allResults.push(...outcome.results);
    dispatchedCount += outcome.dispatched;
    failedCount += outcome.failed;
    skippedByPref += outcome.skippedByPref;
  }

  // Step 6 — log dispatch stats.
  logger.info("dispatchWithPreferences complete", {
    affectedUserCount: affectedUserIds.length,
    totalPayloads: payloads.length,
    allowlistedPayloads: allowlistedPayloads.length,
    skippedByAllowlist,
    skippedByPref,
    dispatchedCount,
    failedCount,
  });

  return allResults;
}

/**
 * Convenience export: which channels an event allows. Used by callers that
 * want to introspect without dispatching (e.g. for UI hints or tests).
 */
export function getEventChannels(eventType: NotificationEventType): NotificationChannel[] {
  return EVENT_CHANNEL_ALLOWLIST[eventType] ?? [...ALL_ENUM_CHANNELS];
}
