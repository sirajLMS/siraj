/**
 * StatusTrackingLabels — type schema for the dashboard.core.statusTracking namespace.
 *
 * Keys that previously contained ICU {param} placeholders are now typed as
 * functions with explicit, named parameters — checked at compile time.
 */
export interface StatusTrackingLabels {
  // ─── Page header ────────────────────────────────────────────────────
  readonly pageTitle: string;
  readonly pageSubtitle: string;

  // ─── Toolbar ────────────────────────────────────────────────────────
  readonly filters: string;
  readonly newReport: string;
  readonly todaysClassSchedule: string;
  readonly totalSessions: (total: number) => string;
  readonly previous: string;
  readonly next: string;
  readonly showingOf: (shown: number, total: number) => string;
  readonly seeAll: string;
  readonly todaysSchedule: string;
  readonly administrativeHold: string;
  readonly holdDescription: string;

  // ─── Metrics ────────────────────────────────────────────────────────
  readonly metrics: {
    readonly regular: string;
    readonly pending: string;
    readonly suspended: string;
    readonly onLeave: string;
  };

  // ─── Sub-labels ────────────────────────────────────────────────────
  readonly subLabels: {
    readonly regular: string;
    readonly pending: string;
    readonly suspended: string;
    readonly onLeave: string;
  };

  // ─── Table ──────────────────────────────────────────────────────────
  readonly table: {
    readonly studentClass: string;
    readonly teacher: string;
    readonly schedule: string;
    readonly status: string;
    readonly actions: string;
  };

  // ─── Status ─────────────────────────────────────────────────────────
  readonly status: {
    readonly regular: string;
    readonly suspendedPending: string;
    readonly onLeave: string;
    readonly pendingVerification: string;
  };

  // ─── Actions ────────────────────────────────────────────────────────
  readonly actions: {
    readonly joinSession: string;
    readonly activate: string;
    readonly reschedule: string;
    readonly verifyDocuments: string;
    readonly sessionLocked: string;
    readonly sessionEnded: string;
  };

  // ─── Static string ──────────────────────────────────────────────────
  readonly noEntries: string;

  // ─── Analytics ──────────────────────────────────────────────────────
  readonly analytics: {
    readonly title: string;
    readonly note: string;
    readonly urgentTask: string;
    readonly accountsLocked: (count: number) => string;
    readonly auditDescription: string;
    readonly openAuditLogs: string;
  };

  // ─── Errors ─────────────────────────────────────────────────────────
  readonly errors: {
    readonly noStudentId: string;
    readonly auditLogsComingSoon: string;
    readonly failedToLoad: string;
  };

  // ─── Days (abbreviations) ───────────────────────────────────────────
  readonly days: {
    readonly mon: string;
    readonly tue: string;
    readonly wed: string;
    readonly thu: string;
    readonly fri: string;
    readonly sat: string;
    readonly sun: string;
  };
}
