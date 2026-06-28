// StatusTracking
export interface StatusTrackingMetricLabels {
  readonly regular: string;
  readonly pending: string;
  readonly suspended: string;
  readonly onLeave: string;
}

export interface StatusTrackingSubLabels {
  readonly regular: string;
  readonly pending: string;
  readonly suspended: string;
  readonly onLeave: string;
}

export interface StatusTrackingTableLabels {
  readonly studentClass: string;
  readonly teacher: string;
  readonly schedule: string;
  readonly status: string;
  readonly actions: string;
}

export interface StatusTrackingStatusLabels {
  readonly regular: string;
  readonly suspendedPending: string;
  readonly onLeave: string;
  readonly pendingVerification: string;
}

export interface StatusTrackingActionsLabels {
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly sessionLocked: string;
}

export interface StatusTrackingAnalyticsLabels {
  readonly title: string;
  readonly note: string;
  readonly urgentTask: string;
  readonly accountsLocked: string;
  readonly auditDescription: string;
  readonly openAuditLogs: string;
}

export interface StatusTrackingDaysLabels {
  readonly mon: string;
  readonly tue: string;
  readonly wed: string;
  readonly thu: string;
  readonly fri: string;
  readonly sat: string;
  readonly sun: string;
}

export interface StatusTrackingErrorsLabels {
  readonly noStudentId: string;
  readonly auditLogsComingSoon: string;
  readonly failedToLoad: string;
}

export interface StatusTrackingLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly filters: string;
  readonly newReport: string;
  readonly todaysClassSchedule: string;
  readonly totalSessions: string;
  readonly previous: string;
  readonly next: string;
  readonly showingOf: string;
  readonly seeAll: string;
  readonly todaysSchedule: string;
  readonly administrativeHold: string;
  readonly holdDescription: string;
  readonly noEntries: string;
  readonly metrics: StatusTrackingMetricLabels;
  readonly subLabels: StatusTrackingSubLabels;
  readonly table: StatusTrackingTableLabels;
  readonly status: StatusTrackingStatusLabels;
  readonly actions: StatusTrackingActionsLabels;
  readonly analytics: StatusTrackingAnalyticsLabels;
  readonly errors: StatusTrackingErrorsLabels;
  readonly days: StatusTrackingDaysLabels;
}
