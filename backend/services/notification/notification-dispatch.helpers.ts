/**
 * `dispatchWithPreferences` — the SOLE entry point through which domain
 * services dispatch notifications (specs.md rule #1).
 *
 * Algorithm (specs.md §5.2):
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

import { NotificationPreferencesRepository } from "@/backend/db/repo";
import { NotificationChannel, NotificationEventType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import type { ChannelDispatchResult, CommunicationChannelType, CommunicationPayload } from "@/backend/types";

// ─── Event/channel allowlist ───────────────────────────────────────────

/**
 * Per-event channel restrictions. When an event is present here, only the
 * channels listed are dispatched. Events NOT present here default to all
 * 4 channels (`on_app`, `email`, `sms`, `push`).
 *
 * Enum members are used (not literal `"EMAIL"` strings — specs.md F15).
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
};

// ─── Channel comparison helper ────────────────────────────────────────

/**
 * Map `NotificationChannel` enum value → `CommunicationChannelType`
 * string literal (`NotificationChannel.EMAIL` is `"EMAIL"` while
 * `CommunicationChannelType` is `"email"` lowercase). Centralized so the
 * allowlist can stay keyed by enum members (specs.md F15) while payload
 * filtering matches by lowercase payload-channel string.
 */
const CHANNEL_FROM_ENUM: Readonly<Record<NotificationChannel, CommunicationChannelType>> = Object.freeze({
  [NotificationChannel.ON_APP]: "on_app",
  [NotificationChannel.EMAIL]: "email",
  [NotificationChannel.SMS]: "sms",
  [NotificationChannel.PUSH]: "push",
});

const ALL_ENUM_CHANNELS: readonly NotificationChannel[] = Object.values(NotificationChannel);

function isAllowed(eventType: NotificationEventType, channel: CommunicationChannelType): boolean {
  const allowedEnums = EVENT_CHANNEL_ALLOWLIST[eventType];
  if (!allowedEnums) return true; // absent → all 4 channels allowed
  return allowedEnums.some(enumChannel => CHANNEL_FROM_ENUM[enumChannel] === channel);
}

// ─── Preferences helper ───────────────────────────────────────────────

type PreferencesByChannel = Map<string, boolean>;

function prefKey(channel: CommunicationChannelType, eventType: NotificationEventType): string {
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
    const channel = CHANNEL_FROM_ENUM[row.channel as NotificationChannel];
    map.set(prefKey(channel, row.eventType as NotificationEventType), row.enabled);
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
 * dispatches (specs.md §5.2).
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

  try {
    const results = await CommunicationService.dispatchMulti(userPayloads, locale);
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
    const failResults: ChannelDispatchResult[] = userPayloads.map(p => ({
      channel: p.channel,
      success: false,
      error: message,
    }));
    return { results: failResults, dispatched: 0, failed: userPayloads.length, skippedByPref };
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
