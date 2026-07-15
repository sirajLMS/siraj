export interface SupervisorDashboardLabels {
  readonly pageTitle: string;
  readonly welcomeMessage: (name: string) => string;
  readonly pendingReviewsHero: (count: number) => string;
  readonly pendingReviewsSubtitle: string;
  readonly goToReviews: string;
  readonly teacherDuesSummary: string;
  readonly totalPendingDues: string;
  readonly goToDues: string;
  readonly monthlyReportsShortcut: string;
  readonly goToMonthlyReports: string;
  readonly recentApprovals: string;
  readonly noRecentApprovals: string;
  readonly loadingMessage: string;
}
