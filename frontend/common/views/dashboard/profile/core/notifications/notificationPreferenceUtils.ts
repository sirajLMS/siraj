import { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  NotificationPrefRow,
  PreferenceMatrixRow,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import { UserRole } from "@/shared/constants/auth.enum";
import {
  isEventAllowedForRole,
  type NotificationPreferenceRole,
  resolveNotificationEventAllowlist,
} from "@/shared/constants/notification-event-allowlists";
import { ProfileAudience } from "@/shared/constants/profile.enum";

/**
 * Maps viewer `UserRole` / `ProfileAudience` to the shared prefs allowlist role.
 * Prefer `role` from the auth user store; fall back to profile audience.
 */
export function resolveNotificationPreferenceRole(params: {
  readonly role?: string | null;
  readonly audience?: ProfileAudience | null;
}): NotificationPreferenceRole {
  const { role, audience } = params;

  switch (role) {
    case UserRole.STUDENT:
      return "student";
    case UserRole.SUPERVISOR:
      return "supervisor";
    case UserRole.PARENT:
      return "parent";
    case UserRole.TEACHER:
      return "teacher";
    case UserRole.STAFF:
      return "staff";
    case UserRole.SUPER_ADMIN:
    case UserRole.ACADEMY_ADMIN:
      return "admin";
    default:
      break;
  }

  switch (audience) {
    case ProfileAudience.STUDENT:
      return "student";
    case ProfileAudience.PARENT:
      return "parent";
    case ProfileAudience.TEACHER:
      return "teacher";
    case ProfileAudience.STAFF:
      return "staff";
    default:
      return "staff";
  }
}

/** Event types visible in the prefs matrix for a prefs role. */
export function getNotificationEventTypesForRole(role: NotificationPreferenceRole): readonly NotificationEventType[] {
  const allowlist = resolveNotificationEventAllowlist(role);
  const allEventTypes = Object.values(NotificationEventType);

  if (allowlist === "ALL") {
    return allEventTypes;
  }

  return allEventTypes.filter(eventType => isEventAllowedForRole(role, eventType));
}

export function preferenceKey(channel: NotificationChannel, eventType: NotificationEventType): string {
  return `${channel}:${eventType}`;
}

export function buildPreferenceMap(preferences: readonly NotificationPrefRow[]): Map<string, NotificationPrefRow> {
  const entries: Array<[string, NotificationPrefRow]> = [];

  for (const pref of preferences) {
    if (pref.channel && pref.eventType) {
      entries.push([preferenceKey(pref.channel, pref.eventType), pref]);
    }
  }

  return new Map(entries);
}

export function buildPreferenceMatrixRows(
  preferenceMap: ReadonlyMap<string, NotificationPrefRow>,
  eventTypes: readonly NotificationEventType[],
  channels: readonly NotificationChannel[]
): PreferenceMatrixRow[] {
  return eventTypes.map(eventType => {
    const enabledMap: Record<string, boolean> = {};
    for (const channel of channels) {
      const pref = preferenceMap.get(preferenceKey(channel, eventType));
      enabledMap[channel] = pref?.enabled ?? true;
    }
    return { id: eventType, eventType, enabledMap };
  });
}

export function buildDefaultPreferences(
  channels: readonly NotificationChannel[],
  eventTypes: readonly NotificationEventType[]
): NotificationPrefRow[] {
  return channels.flatMap(channel =>
    eventTypes.map(
      eventType =>
        ({
          id: preferenceKey(channel, eventType),
          channel,
          eventType,
          enabled: true,
        }) satisfies NotificationPrefRow
    )
  );
}

/** Ordered channel list for UI rendering. */
export const CHANNEL_ORDER: readonly NotificationChannel[] = [
  NotificationChannel.Email,
  NotificationChannel.Whatsapp,
  NotificationChannel.Push,
  NotificationChannel.OnApp,
  NotificationChannel.Sms,
];
