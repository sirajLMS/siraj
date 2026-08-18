/** Schedule tracking tab identifiers — literal union for type-safe tab routing. */
export type ScheduleTrackingTabId = "reschedule" | "status" | "alerts";

/** I18n label keys (map to `dashboard.scheduleTrackingParent.tabs.*`). */
export type ScheduleTrackingTabLabelKey = "reschedule" | "status" | "alerts";

export type ScheduleTrackingTabsLabels = Record<ScheduleTrackingTabLabelKey, string>;

export interface ScheduleTrackingViewLabels {
  readonly title: string;
  readonly subtitle: string;
  readonly tabs: ScheduleTrackingTabsLabels;
  readonly tabNavAriaLabel: string;
}

export type ScheduleTrackingTabsViewModel = {
  readonly labels: ScheduleTrackingViewLabels;
  readonly activeTab: ScheduleTrackingTabId;
  readonly tabNavItems: readonly {
    readonly id: ScheduleTrackingTabId;
    readonly label: string;
    readonly href: string;
  }[];
};

export const SCHEDULE_TRACKING_TAB_IDS: readonly ScheduleTrackingTabId[] = ["reschedule", "status", "alerts"] as const;
