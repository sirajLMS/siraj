import { NotificationChannel, NotificationEventType } from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";

export type NotificationPrefRow = NonNullable<
  Operations.NotificationPreferencesQuery["notificationPreferences"]
>[number];

export const NOTIFICATION_CHANNELS = [
  NotificationChannel.Email,
  NotificationChannel.Sms,
  NotificationChannel.Push,
  NotificationChannel.OnApp,
] as const;

export const NOTIFICATION_EVENT_TYPES = [
  NotificationEventType.ClassReminder,
  NotificationEventType.InvoiceGenerated,
  NotificationEventType.ComplaintResponse,
  NotificationEventType.PaymentMethodChanged,
  NotificationEventType.NewComplaint,
  NotificationEventType.NewSuggestion,
  NotificationEventType.SuggestionAcknowledged,
  NotificationEventType.SuggestionDuplicateMarked,
] as const;

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
