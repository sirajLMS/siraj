import type {
  CardListLabels,
  StatusTrackingDataGridLabels,
  StatusTrackingLabels,
  SuspensionAnalyticsLabels,
} from "@/frontend/common/views/dashboard/classes/status/tracking/status-tracking.types";

export type StatusTrackingShellLabels = Pick<
  StatusTrackingLabels,
  | "pageTitle"
  | "pageSubtitle"
  | "filters"
  | "newReport"
  | "todaysClassSchedule"
  | "totalSessions"
  | "seeAll"
  | "todaysSchedule"
>;

export type StatusTrackingFilterLabels = Pick<StatusTrackingLabels, "dateFilter">;

export type StatusTrackingColumnLabels = StatusTrackingDataGridLabels;

export type StatusTrackingCardListSectionLabels = CardListLabels;

export type StatusTrackingAnalyticsSectionLabels = SuspensionAnalyticsLabels;

export type StatusTrackingNotificationLabels = Pick<
  StatusTrackingLabels,
  "errorNoStudentId" | "errorAuditLogsComingSoon" | "errorFailedToLoad"
>;

export type StatusTrackingMetricSubLabels = Pick<
  StatusTrackingLabels,
  "regularSubLabel" | "pendingSubLabel" | "suspendedSubLabel" | "onLeaveSubLabel"
>;

export interface StatusTrackingLabelsBySection {
  readonly shell: StatusTrackingShellLabels;
  readonly filters: StatusTrackingFilterLabels;
  readonly columns: StatusTrackingColumnLabels;
  readonly cardList: StatusTrackingCardListSectionLabels;
  readonly analytics: StatusTrackingAnalyticsSectionLabels;
  readonly notifications: StatusTrackingNotificationLabels;
  readonly metrics: StatusTrackingMetricSubLabels;
}
