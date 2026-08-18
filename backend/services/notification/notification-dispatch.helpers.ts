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

import { NotificationPreferencesRepository } from "@/backend/db/repo/notifications";
import { UserRepository } from "@/backend/db/repo/users";
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
  [NotificationEventType.PASSWORD_RESET_BY_ADMIN]: [NotificationChannel.ON_APP, NotificationChannel.EMAIL],
};

// String arrays for O(1) type guard lookup (avoids unsafe casts in includes)
const NOTIFICATION_CHANNEL_STRINGS = Object.values(NotificationChannel) as readonly string[];
const NOTIFICATION_EVENT_TYPE_STRINGS = Object.values(NotificationEventType) as readonly string[];

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
 * Type guard + parser for NotificationChannel.
 * Safely narrows a string to NotificationChannel | null.
 */
function isNotificationChannel(value: unknown): value is NotificationChannel {
  return typeof value === "string" && NOTIFICATION_CHANNEL_STRINGS.includes(value);
}

function parseNotificationChannel(value: unknown): NotificationChannel | null {
  return isNotificationChannel(value) ? value : null;
}

/**
 * Type guard + parser for NotificationEventType.
 * Safely narrows a string to NotificationEventType | null.
 */
function isNotificationEventType(value: unknown): value is NotificationEventType {
  return typeof value === "string" && NOTIFICATION_EVENT_TYPE_STRINGS.includes(value);
}

function parseNotificationEventType(value: unknown): NotificationEventType | null {
  return isNotificationEventType(value) ? value : null;
}

/**
 * Convert rows from `NotificationPreferencesRepository.getByUserId(userId)`
 * to a `Map<preferenceKey(channel, eventType), enabled>`. Channel/enum
 * columns on the row are typed as the underlying DB string but parsed to the
 * enum members via safe helpers (avoiding unsafe `as` casts).
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
    const channel = parseNotificationChannel(row.channel);
    const eventType = parseNotificationEventType(row.eventType);
    // DB rows should always have valid enum values; skip if not (defensive)
    if (channel !== null && eventType !== null) {
      map.set(prefKey(channel, eventType), row.enabled);
    }
  }
  return map;
}

/**
 * Resolve prefs for a user from a pre-loaded batch `Map<userId, prefRows[]>`.
 * Returns an empty `PreferencesByChannel` (all-enabled) when the user has no
 * stored prefs — matching the safe over-notify contract from the former
 * per-user `_loadPrefsSafe` fallback.
 */
function prefsMapForUser(
  userId: string,
  batch: ReadonlyMap<
    string,
    ReadonlyArray<{ readonly channel: string; readonly eventType: string; readonly enabled: boolean }>
  >
): PreferencesByChannel {
  const rows = batch.get(userId);
  return rows ? prefsToMap(rows) : new Map();
}

/**
 * Resolve contact info for multiple users from a pre-loaded
 * `Map<userId, UserSelectType | null>`. Returns `null` for users not found
 * in the map (fetch failure or soft-deleted) — matching the per-user
 * `loadUserSafe` contract. This avoids the N+1 of calling `loadUserSafe`
 * per user inside the dispatch loop.
 */
function userFromBatch(
  userId: string,
  batch: ReadonlyMap<string, { readonly email: string | null; readonly phone: string | null } | null>
): { readonly email: string | null; readonly phone: string | null } | null {
  return batch.get(userId) ?? null;
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
      metadata:
        payload.metadata && Object.keys(payload.metadata).length > 0
          ? { ...payload.metadata, to: address }
          : { to: address },
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
 *
 * @param prefs  Pre-loaded preference map for this user (from batch fetch).
 * @param user   Pre-loaded user contact info for this user (from batch fetch),
 *               or `null` if not found / fetch failed.
 */
async function dispatchForUser(
  userId: string,
  allowlistedPayloads: readonly CommunicationPayload[],
  prefs: PreferencesByChannel,
  user: { readonly email: string | null; readonly phone: string | null } | null,
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

  // Stamp recipient addresses using pre-loaded user data. Pure builders
  // can't do DB I/O (§5.1), so this is the single place where the recipient
  // address is populated for the builder-driven dispatch path. Contactless
  // payloads (user has no email or phone) are dropped here with a warn —
  // per-user isolation (§5.2).
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

  // Steps 3-4 — batch-fetch ALL user prefs and user contact info in parallel
  // before the dispatch loop, eliminating the N+1 of per-user `getByUserId` +
  // `findSafeById` inside a sequential `for...of`.
  const [prefsBatch, userBatch] = await Promise.all([
    NotificationPreferencesRepository.getByUserIds(affectedUserIds),
    UserRepository.findSafeByIds(affectedUserIds),
  ]);

  // Step 5 — dispatch per-user with pre-loaded data. Dispatches are
  // independent across users, so they run in parallel via `Promise.allSettled`
  // — a failure for one user does NOT poison others (§5.2).
  const settled = await Promise.allSettled(
    affectedUserIds.map(userId =>
      dispatchForUser(
        userId,
        allowlistedPayloads,
        prefsMapForUser(userId, prefsBatch),
        userFromBatch(userId, userBatch),
        locale
      )
    )
  );

  // Aggregate results from all settled outcomes.
  let dispatchedCount = 0;
  let skippedByPref = 0;
  let failedCount = 0;
  const allResults: ChannelDispatchResult[] = [];

  for (const result of settled) {
    // `dispatchForUser` catches its own errors internally and returns a
    // `UserDispatchOutcome` with per-user failure results, so a "rejected"
    // promise here is an unexpected bug. Log and skip — never re-throw,
    // matching the per-user isolation contract (§5.2).
    if (result.status === "rejected") {
      const error = result.reason;
      logger.error("dispatchWithPreferences: unexpected rejection from dispatchForUser", {
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
    const outcome = result.value;
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
