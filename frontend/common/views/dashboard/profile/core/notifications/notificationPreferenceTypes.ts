import {
  NotificationChannel,
  NotificationEventType,
  type NotificationPreferencesQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { SnackbarSeverity } from "@/frontend/common/stores/__shared__";
import { preferenceKey } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceUtils";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

/** Mirrors backend enum NotificationEventCategory — frontend-local copy for prefs UI grouping. */
export type NotificationEventCategory = "info" | "reminder" | "urgent" | "digest";

/** Maps every NotificationEventType → category so the prefs UI can group/toggle by category. */
export const NOTIFICATION_EVENT_CATEGORY: Record<NotificationEventType, NotificationEventCategory> = {
  [NotificationEventType.ClassReminder]: "reminder",
  [NotificationEventType.InvoiceGenerated]: "info",
  [NotificationEventType.ComplaintResponse]: "info",
  [NotificationEventType.PaymentMethodChanged]: "info",
  [NotificationEventType.NewComplaint]: "info",
  [NotificationEventType.NewSuggestion]: "info",
  [NotificationEventType.SuggestionAcknowledged]: "info",
  [NotificationEventType.SuggestionDuplicateMarked]: "info",
  [NotificationEventType.InvoiceStatusChanged]: "info",
  [NotificationEventType.ClassScheduled]: "info",
  [NotificationEventType.ClassActivated]: "info",
  [NotificationEventType.ClassStarted]: "info",
  [NotificationEventType.ClassCompleted]: "info",
  [NotificationEventType.ClassMarkedAbsent]: "info",
  [NotificationEventType.ClassMarkedMissed]: "info",
  [NotificationEventType.ClassLeaveRequested]: "info",
  [NotificationEventType.ClassRescheduled]: "info",
  [NotificationEventType.ClassCancelled]: "info",
  [NotificationEventType.ClassReset]: "info",
  [NotificationEventType.StudentTeacherReassigned]: "info",
  [NotificationEventType.StudentStatusChanged]: "info",
  [NotificationEventType.StudentQuotaOverridden]: "info",
  [NotificationEventType.LessonReportSubmitted]: "info",
  [NotificationEventType.LessonReportReviewed]: "info",
  [NotificationEventType.QuotaExpiringSoon]: "reminder",
  [NotificationEventType.QuotaExpired]: "info",
  [NotificationEventType.QuotaLowBalance]: "reminder",
  [NotificationEventType.OnDemandInstancePendingCredit]: "urgent",
  [NotificationEventType.OnDemandInstanceReminderT3]: "reminder",
  [NotificationEventType.OnDemandInstanceReminderT1]: "urgent",
  [NotificationEventType.OnDemandTeacherDailyDigest]: "digest",
  [NotificationEventType.PasswordResetByAdmin]: "info",
  [NotificationEventType.UserStatusChanged]: "info",
  [NotificationEventType.AccountingLowHours]: "reminder",
  [NotificationEventType.AccountingPaymentRecorded]: "info",
};

export const NOTIFICATION_CHANNELS = [
  NotificationChannel.Email,
  NotificationChannel.Sms,
  NotificationChannel.Push,
  NotificationChannel.OnApp,
  NotificationChannel.Whatsapp,
] as const;

/** Full event catalog — staff/parent/teacher/admin matrices use this when allowlist is ALL. */
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
  // Student/supervisor notification integration
  NotificationEventType.LessonReportSubmitted,
  NotificationEventType.LessonReportReviewed,
  // Quota & on-demand notification events
  NotificationEventType.QuotaExpiringSoon,
  NotificationEventType.QuotaExpired,
  NotificationEventType.QuotaLowBalance,
  NotificationEventType.OnDemandInstancePendingCredit,
  NotificationEventType.OnDemandInstanceReminderT3,
  NotificationEventType.OnDemandInstanceReminderT1,
  NotificationEventType.OnDemandTeacherDailyDigest,
  // Admin notification events
  NotificationEventType.PasswordResetByAdmin,
  NotificationEventType.UserStatusChanged,
] as const;

export const NOTIFICATION_EVENT_TYPES_BY_CATEGORY: Record<NotificationEventCategory, readonly NotificationEventType[]> =
  {
    urgent: NOTIFICATION_EVENT_TYPES.filter(et => NOTIFICATION_EVENT_CATEGORY[et] === "urgent"),
    reminder: NOTIFICATION_EVENT_TYPES.filter(et => NOTIFICATION_EVENT_CATEGORY[et] === "reminder"),
    info: NOTIFICATION_EVENT_TYPES.filter(et => NOTIFICATION_EVENT_CATEGORY[et] === "info"),
    digest: NOTIFICATION_EVENT_TYPES.filter(et => NOTIFICATION_EVENT_CATEGORY[et] === "digest"),
  };

export type NotificationPrefRow = NonNullable<NotificationPreferencesQuery["notificationPreferences"]>[number];

/** A category row for the prefs UI — one per category with a master toggle. */
export interface CategoryRow {
  readonly id: string;
  readonly category: NotificationEventCategory;
  readonly anyEnabled: boolean;
  readonly allEnabled: boolean;
  readonly eventTypes: readonly NotificationEventType[];
}

/**
 * Groups event types by category and computes per-category toggle state from
 * actual preference data. Categories are ordered: urgent → reminder → info → digest.
 *
 * `anyEnabled` — true if at least one event type in the category has any channel enabled.
 * `allEnabled` — true if every event type in the category has all channels enabled.
 */
export function buildCategoryRows(
  eventTypes: readonly NotificationEventType[],
  preferenceMap: ReadonlyMap<string, NotificationPrefRow>
): CategoryRow[] {
  const categoryOrder: NotificationEventCategory[] = ["urgent", "reminder", "info", "digest"];
  const groups = new Map<NotificationEventCategory, NotificationEventType[]>();

  for (const et of eventTypes) {
    const cat = NOTIFICATION_EVENT_CATEGORY[et];
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)?.push(et);
  }

  return categoryOrder
    .filter(cat => groups.has(cat))
    .map(cat => {
      const ets = groups.get(cat) ?? [];
      let anyEnabled = false;
      let allEnabled = true;
      for (const et of ets) {
        let eventTypeAnyEnabled = false;
        let eventTypeAllEnabled = true;
        for (const channel of NOTIFICATION_CHANNELS) {
          const pref = preferenceMap.get(preferenceKey(channel, et));
          const enabled = pref?.enabled ?? true;
          if (enabled) eventTypeAnyEnabled = true;
          else eventTypeAllEnabled = false;
        }
        if (eventTypeAnyEnabled) anyEnabled = true;
        if (!eventTypeAllEnabled) allEnabled = false;
      }
      return { id: `cat-${cat}`, category: cat, anyEnabled, allEnabled, eventTypes: ets };
    });
}

// NEW FOR PLAN v5: PreferenceMatrixRow — the desktop grid's row shape. Lifted
// out of the desktop tier so data-shaping lives in the ViewModel; the tier
// view stays render-only.
export interface PreferenceMatrixRow {
  readonly id: string;
  readonly eventType: NotificationEventType;
  readonly enabledMap: Record<string, boolean>;
}

export interface NotificationPreferencesTabVariantProps {
  readonly labels: ProfileNotificationsLabels;
  readonly preferences: readonly NotificationPrefRow[];
  readonly onToggle: (channel: NotificationChannel, eventType: NotificationEventType, enabled: boolean) => void;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly snackbarOpen: boolean;
  readonly snackbarMessage: string;
  readonly snackbarSeverity: SnackbarSeverity;
  readonly onSnackbarClose: () => void;
  readonly errorLoading: boolean;
  readonly activeChannel?: NotificationChannel;
  readonly slideDirection?: "left" | "right";
  readonly onChannelChange?: (channel: NotificationChannel, slideDirection: "left" | "right") => void;
  readonly preferenceMap?: ReadonlyMap<string, NotificationPrefRow>;
  readonly matrixRows?: readonly PreferenceMatrixRow[];
  readonly eventTypes?: readonly NotificationEventType[];
  /** Category grouping rows — one per category for master mute toggles. */
  readonly categoryRows?: readonly CategoryRow[];
  /** Toggle all events in a category — called from category-level switch. */
  readonly onCategoryToggle?: (category: NotificationEventCategory, enabled: boolean) => void;
}

// Re-exported from notificationPreferenceUtils for backward compatibility.
// The canonical implementations live in notificationPreferenceUtils.ts.
export {
  buildDefaultPreferences,
  buildPreferenceMap,
  buildPreferenceMatrixRows,
  getNotificationEventTypesForRole,
  preferenceKey,
  resolveNotificationPreferenceRole,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceUtils";
