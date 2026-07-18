// NEW FOR PLAN v5 (notificationPreferences extended props)
import { NotificationChannel, NotificationEventType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";

export type NotificationPrefRow = NonNullable<
  Operations.NotificationPreferencesQuery["notificationPreferences"]
>[number];

// NEW FOR PLAN v5: PreferenceMatrixRow — the desktop grid's row shape. Lifted
// out of the desktop tier so data-shaping lives in the ViewModel; the tier
// view stays render-only.
export interface PreferenceMatrixRow {
  readonly id: string;
  readonly eventType: NotificationEventType;
  readonly enabledMap: Record<string, boolean>;
}

export interface NotificationPreferencesTabVariantProps {
  readonly preferences: readonly NotificationPrefRow[];
  readonly onToggle: (channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) => void;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: "success" | "error";
  readonly onSnackbarClose: () => void;
  readonly errorLoading: boolean;
  // NEW FOR PLAN v5: channel-tab selection lifted from mobile tier so the
  // tier view remains pure (no `useState`). Mobile uses these; the desktop
  // matrix variant ignores them.
  readonly activeChannel?: NotificationChannel;
  readonly slideDirection?: "left" | "right";
  readonly onChannelChange?: (channel: NotificationChannel, slideDirection: "left" | "right") => void;
  // NEW FOR PLAN v5: pre-computed preference lookup map lifted out of both
  // tier views so the tier views stay render-only (no `buildPreferenceMap`
  // call inside tier). Mobile reads single-event entries; desktop reads the
  // matrix via `matrixRows`.
  readonly preferenceMap?: ReadonlyMap<string, NotificationPrefRow>;
  // NEW FOR PLAN v5: pre-shaped desktop matrix rows lifted out of the desktop
  // tier (data-shaping belongs in the ViewModel). Desktop only reads them.
  readonly matrixRows?: readonly PreferenceMatrixRow[];
}

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
  // Notification Wiring v5 — 14 new event types (specs.md §4.1)
  NotificationEventType.InvoiceStatusChanged,
  NotificationEventType.ClassScheduled,
  NotificationEventType.ClassActivated,
  NotificationEventType.ClassStarted,
  NotificationEventType.ClassCompleted,
  NotificationEventType.ClassMarkedAbsent,
  NotificationEventType.ClassMarkedMissed,
  NotificationEventType.ClassLeaveRequested,
  NotificationEventType.ClassRescheduled,
  NotificationEventType.ClassCancelled,
  NotificationEventType.ClassReset,
  NotificationEventType.StudentTeacherReassigned,
  NotificationEventType.StudentStatusChanged,
  NotificationEventType.StudentQuotaOverridden,
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

// NEW FOR PLAN v5: buildPreferenceMatrixRows — pure-data row-shaping for the
// desktop matrix grid. Lifted to common so the desktop tier view no longer
// derives data (specs.md §6.1 — the ViewModel owns data shaping).
export function buildPreferenceMatrixRows(
  preferenceMap: ReadonlyMap<string, NotificationPrefRow>
): PreferenceMatrixRow[] {
  return NOTIFICATION_EVENT_TYPES.map(eventType => {
    const enabledMap: Record<string, boolean> = {};
    for (const channel of NOTIFICATION_CHANNELS) {
      const pref = preferenceMap.get(preferenceKey(channel, eventType));
      enabledMap[channel] = pref?.enabled ?? true;
    }
    return { id: eventType, eventType, enabledMap };
  });
}
