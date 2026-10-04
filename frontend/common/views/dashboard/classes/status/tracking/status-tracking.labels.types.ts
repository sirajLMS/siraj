export interface StatusTrackingLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly filters: string;
  readonly newReport: string;
  readonly todaysClassSchedule: string;
  readonly totalSessions: (total: number) => string;
  readonly class: string;
  readonly student: string;
  readonly teacher: string;
  readonly schedule: string;
  readonly duration: string;
  readonly status: string;
  readonly actions: string;
  readonly showingOf: (shown: number, total: number) => string;
  readonly previous: string;
  readonly next: string;
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly sessionLocked: string;
  readonly sessionEnded: string;
  readonly administrativeHold: string;
  readonly holdDescription: string;
  readonly seeAll: string;
  readonly todaysSchedule: string;
  readonly regular: string;
  readonly suspendedPending: string;
  readonly onLeave: string;
  readonly pendingVerification: string;
  readonly regularSubLabel: string;
  readonly pendingSubLabel: string;
  readonly suspendedSubLabel: string;
  readonly onLeaveSubLabel: string;
  readonly suspensionAnalytics: string;
  readonly analyticsNote: string;
  readonly urgentTask: string;
  readonly accountsLocked: (count: number) => string;
  readonly auditDescription: string;
  readonly openAuditLogs: string;
  readonly noEntries: string;
  readonly errorNoStudentId: string;
  readonly errorAuditLogsComingSoon: string;
  readonly errorFailedToLoad: string;
  readonly days: readonly string[];
  readonly dateFilter: {
    readonly today: string;
    readonly previousDay: string;
    readonly nextDay: string;
    readonly dateLabel: string;
  };
}

export interface StatusTrackingDataGridLabels {
  readonly class: string;
  readonly student: string;
  readonly teacher: string;
  readonly schedule: string;
  readonly duration: string;
  readonly status: string;
  readonly actions: string;
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly administrativeHold: string;
  readonly holdDescription: string;
  readonly regular: string;
  readonly suspendedPending: string;
  readonly onLeave: string;
  readonly pendingVerification: string;
  readonly sessionEnded: string;
  readonly noEntries: string;
  readonly showingOf: (shown: number, total: number) => string;
  readonly previous: string;
  readonly next: string;
}

export interface CardListLabels {
  readonly class: string;
  readonly student: string;
  readonly teacher: string;
  readonly schedule: string;
  readonly duration: string;
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly sessionLocked: string;
  readonly sessionEnded: string;
  readonly todaysSchedule: string;
  readonly regular: string;
  readonly suspendedPending: string;
  readonly onLeave: string;
  readonly pendingVerification: string;
  readonly noEntries: string;
}

export interface SuspensionAnalyticsLabels {
  readonly suspensionAnalytics: string;
  readonly analyticsNote: string;
  readonly urgentTask: string;
  readonly accountsLocked: (count: number) => string;
  readonly auditDescription: string;
  readonly openAuditLogs: string;
  readonly suspended: string;
  readonly days: readonly string[];
}

export interface StatusActionLabels {
  readonly joinSession: string;
  readonly activate: string;
  readonly reschedule: string;
  readonly verifyDocuments: string;
  readonly administrativeHold: string;
  readonly holdDescription: string;
}
