/**
 * ParentDashboardLabels — type schema for the dashboard.core.parentDashboard namespace.
 *
 * Keys that previously contained ICU {param} placeholders are now typed as
 * functions with explicit, named parameters — checked at compile time.
 */
export interface ParentDashboardLabels {
  // ─── Static strings & interpolated functions ───────────────────────
  readonly pageTitle: string;
  readonly welcome: (name: string) => string;
  readonly welcomeBack: string;
  readonly pendingMessages: (count: number) => string;

  // ─── Metrics ────────────────────────────────────────────────────────
  readonly metrics: {
    readonly totalStudents: string;
    readonly todaysClasses: string;
    readonly pendingInvoices: string;
    readonly performanceAvg: string;
  };

  // ─── Schedule ──────────────────────────────────────────────────────
  readonly schedule: {
    readonly title: string;
    readonly titleMobile: string;
    readonly filter: string;
    readonly viewFullWeek: string;
    readonly viewAll: string;
    readonly rowNumber: string;
    readonly classTime: string;
    readonly studentName: string;
    readonly teacherName: string;
    readonly history: string;
    readonly status: string;
    readonly contact: string;
    readonly classStatus: string;
    readonly duration: (minutes: number) => string;
    readonly teacherLabel: (name: string) => string;
    readonly joinVideo: string;
    readonly frozen: string;
    readonly contactAdmin: string;
    readonly noEntries: string;
  };

  // ─── Booking status ─────────────────────────────────────────────────
  readonly bookingStatus: {
    readonly confirmed: string;
    readonly rescheduled: string;
  };

  // ─── Live class status ──────────────────────────────────────────────
  readonly liveClassStatus: {
    readonly startingSoon: string;
    readonly pending: string;
    readonly scheduled: string;
  };

  // ─── Progress ───────────────────────────────────────────────────────
  readonly progress: {
    readonly title: string;
    readonly subtitle: string;
    readonly completion: (percent: number) => string;
    readonly downloadReport: string;
  };

  // ─── Workshop ───────────────────────────────────────────────────────
  readonly workshop: {
    readonly badge: string;
    readonly learnMore: string;
  };

  // ─── Support ────────────────────────────────────────────────────────
  readonly support: {
    readonly liveSupport: string;
  };
}
