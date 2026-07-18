export interface StudentPortalDashboardLabels {
  readonly pageTitle: string;
  readonly welcomeMessage: (name: string) => string;
  readonly nextClass: string;
  readonly joinNow: string;
  readonly noUpcomingClasses: string;
  readonly creditBalance: string;
  readonly classesRemaining: string;
  readonly classesTotal: string;
  readonly recentLessonReports: string;
  readonly viewAllHistory: string;
  readonly viewCredits: string;
  readonly addReflection: string;
  readonly reflectionDialogTitle: string;
  readonly reflectionNotesLabel: string;
  readonly reflectionNotesPlaceholder: string;
  readonly reflectionSaveError: string;
  readonly upcomingToday: string;
  readonly upcomingThisWeek: string;
  readonly noLessonReports: string;
  readonly loadingMessage: string;
}
