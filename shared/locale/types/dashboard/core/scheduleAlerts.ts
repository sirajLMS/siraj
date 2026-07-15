/**
 * ScheduleAlertsLabels — type schema for the dashboard.core.scheduleAlerts namespace.
 *
 * Keys that previously contained ICU {param} placeholders are now typed as
 * functions with explicit, named parameters — checked at compile time.
 */
export interface ScheduleAlertsLabels {
  // ─── Page header ────────────────────────────────────────────────────
  readonly pageTitle: string;
  readonly pageSubtitle: string;

  // ─── Alerts ─────────────────────────────────────────────────────────
  readonly alerts: {
    readonly leaveQuotaExceeded: string;
    readonly missedClassTime: string;
  };

  // ─── Metrics ────────────────────────────────────────────────────────
  readonly metrics: {
    readonly totalStudents: string;
    readonly totalStudentsTrend: string;
    readonly activeCourses: string;
    readonly activeCoursesSub: string;
  };

  // ─── Report ─────────────────────────────────────────────────────────
  readonly report: {
    readonly title: string;
    readonly description: string;
    readonly descriptionMobile: string;
    readonly downloadPdf: string;
  };

  // ─── Section ────────────────────────────────────────────────────────
  readonly section: {
    readonly title: string;
    readonly subtitle: string;
  };

  // ─── Table headers ──────────────────────────────────────────────────
  readonly table: {
    readonly className: string;
    readonly instructor: string;
    readonly time: string;
    readonly room: string;
    readonly status: string;
  };

  // ─── Actions ────────────────────────────────────────────────────────
  readonly actions: {
    readonly filter: string;
    readonly export: string;
    readonly joinSession: string;
    readonly leaveClass: string;
    readonly leaveDisabledReason: string;
    readonly viewClassAudit: string;
    readonly contactAdmin: string;
  };

  // ─── Session status ─────────────────────────────────────────────────
  readonly sessionStatus: {
    readonly active: string;
    readonly upcoming: string;
    readonly missed: string;
    readonly hold: string;
  };

  // ─── Interpolated → typed functions ────────────────────────────────
  readonly showingOf: (shown: number, total: number) => string;

  // ─── Static strings ────────────────────────────────────────────────
  readonly noEntries: string;
  readonly endOfSchedule: string;
  readonly loading: string;
}
