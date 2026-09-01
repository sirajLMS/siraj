import type {
  CardListLabels,
  StatusTrackingDataGridLabels,
  StatusTrackingLabels,
  SuspensionAnalyticsLabels,
} from "@/frontend/common/views/dashboard/classes/status/tracking/status-tracking.types";

type StatusTrackingShellLabels = Pick<
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

type StatusTrackingFilterLabels = Pick<StatusTrackingLabels, "dateFilter">;

type StatusTrackingColumnLabels = StatusTrackingDataGridLabels;

type StatusTrackingCardListSectionLabels = CardListLabels;

type StatusTrackingAnalyticsSectionLabels = SuspensionAnalyticsLabels;

type StatusTrackingNotificationLabels = Pick<
  StatusTrackingLabels,
  "errorNoStudentId" | "errorAuditLogsComingSoon" | "errorFailedToLoad"
>;

type StatusTrackingMetricSubLabels = Pick<
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
