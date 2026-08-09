import {
  NotificationChannel,
  NotificationEventType,
  ProfileAudience,
  UserRole,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
import {
  isEventAllowedForRole,
  type NotificationPreferenceRole,
  resolveNotificationEventAllowlist,
} from "@/shared/constants/notification-event-allowlists";
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
] as const;

/** Reverse lookup: category → event types (for category-level toggles). */
export const NOTIFICATION_EVENT_TYPES_BY_CATEGORY: Record<NotificationEventCategory, readonly NotificationEventType[]> =
  (["urgent", "reminder", "info", "digest"] as NotificationEventCategory[]).reduce(
    (acc, cat) => {
      acc[cat] = NOTIFICATION_EVENT_TYPES.filter(et => NOTIFICATION_EVENT_CATEGORY[et] === cat);
      return acc;
    },
    {} as Record<NotificationEventCategory, readonly NotificationEventType[]>
  );

export type NotificationPrefRow = NonNullable<
  Operations.NotificationPreferencesQuery["notificationPreferences"]
>[number];

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
  readonly snackbarSeverity: "success" | "error";
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
  if (allowlist === "ALL") {
    return NOTIFICATION_EVENT_TYPES;
  }

  return NOTIFICATION_EVENT_TYPES.filter(eventType => isEventAllowedForRole(role, eventType));
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

// NEW FOR PLAN v5: buildPreferenceMatrixRows — pure-data row-shaping for the
// desktop matrix grid. Lifted to common so the desktop tier view no longer
// derives data (specs.md §6.1 — the ViewModel owns data shaping).
export function buildPreferenceMatrixRows(
  preferenceMap: ReadonlyMap<string, NotificationPrefRow>,
  eventTypes: readonly NotificationEventType[] = NOTIFICATION_EVENT_TYPES
): PreferenceMatrixRow[] {
  return eventTypes.map(eventType => {
    const enabledMap: Record<string, boolean> = {};
    for (const channel of NOTIFICATION_CHANNELS) {
      const pref = preferenceMap.get(preferenceKey(channel, eventType));
      enabledMap[channel] = pref?.enabled ?? true;
    }
    return { id: eventType, eventType, enabledMap };
  });
}

export function buildDefaultPreferences(
  eventTypes: readonly NotificationEventType[] = NOTIFICATION_EVENT_TYPES
): NotificationPrefRow[] {
  return NOTIFICATION_CHANNELS.flatMap(channel =>
    eventTypes.map(eventType => ({
      id: preferenceKey(channel, eventType),
      channel,
      eventType,
      enabled: true,
    }))
  );
}
