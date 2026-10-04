import type { AppSnackbarState } from "@/frontend/common/components/ui/state";
import type {
  NotificationChannel,
  NotificationEventType,
  NotificationPreferencesQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_CATEGORY,
  type NotificationEventCategory,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes.constants";
import { preferenceKey } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceUtils";
import type { ProfileNotificationsLabels } from "@/shared/locale/types/profile";

export type { NotificationEventCategory } from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes.constants";
export {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_EVENT_TYPES_BY_CATEGORY,
} from "@/frontend/common/views/dashboard/profile/core/notifications/notificationPreferenceTypes.constants";

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
  readonly snackbarSeverity: AppSnackbarState["severity"];
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
