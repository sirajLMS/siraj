import {
  NotificationChannel,
  NotificationEventType,
  ProfileAudience,
  UserRole,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  NotificationPrefRow,
  PreferenceMatrixRow,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes";
import {
  isEventAllowedForRole,
  type NotificationPreferenceRole,
  resolveNotificationEventAllowlist,
} from "@/shared/constants/notification-event-allowlists";

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
    case UserRole.Student:
      return "student";
    case UserRole.Supervisor:
      return "supervisor";
    case UserRole.Parent:
      return "parent";
    case UserRole.Teacher:
      return "teacher";
    case UserRole.Staff:
      return "staff";
    case UserRole.SuperAdmin:
    case UserRole.AcademyAdmin:
      return "admin";
    default:
      break;
  }

  switch (audience) {
    case ProfileAudience.Student:
      return "student";
    case ProfileAudience.Parent:
      return "parent";
    case ProfileAudience.Teacher:
      return "teacher";
    case ProfileAudience.Staff:
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
