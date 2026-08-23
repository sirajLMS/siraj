/**
 * DashboardCoreLayoutLabels — type schema for the dashboard.core.layout namespace.
 *
 * Keys that previously contained ICU {param} placeholders are now typed as
 * functions with explicit, named parameters — checked at compile time.
 */
export interface DashboardCoreLayoutLabels {
  // ─── Static strings ────────────────────────────────────────────────
  readonly appTitle: string;
  readonly notifications: string;
  readonly comingSoon: string;
  readonly studentTodayClasses: string;
  readonly studentSchedule: string;
  readonly studentCredits: string;
  readonly studentHistory: string;
  readonly studentProfile: string;
  readonly lessonReports: string;
  readonly lessonReportDetail: string;
  readonly supervisorHome: string;
  readonly pendingReviews: string;
  readonly teacherDues: string;
  readonly monthlyReports: string;
  readonly supervisorProfile: string;
  readonly pageNotFoundTitle: string;
  readonly pageNotFoundDescription: string;
  readonly pageNotFoundBackToDashboard: string;
  readonly customizeButton: string;

  // ─── Interpolated → typed functions ────────────────────────────────
  readonly welcomeUser: (name: string) => string;
}
