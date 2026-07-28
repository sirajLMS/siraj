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
  readonly approvedTime: string;
  readonly lessonDate: string;
  readonly duration: string;
  readonly completion: string;
  readonly teacher: string;
  readonly student: string;
  readonly viewReport: string;
  readonly viewClass: string;
  readonly history: string;
  readonly approvedStatus: string;
}
