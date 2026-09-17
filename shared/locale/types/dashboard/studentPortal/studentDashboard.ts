export interface StudentPortalDashboardLabels {
  readonly pageTitle: string;
  readonly welcomeMessage: (name: string) => string;
  readonly nextClass: string;
  readonly joinNow: string;
  readonly noUpcomingClasses: string;
  readonly frozen: string;
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
  readonly columnDate: string;
  readonly columnDuration: string;
  readonly columnStatus: string;
  readonly columnActions: string;
  readonly minutesShort: (minutes: number) => string;
  readonly hoursShort: (hours: number) => string;
  readonly durationMinutesShort: (minutes: number) => string;

  /** Quick-action strip + open-requests widget above the student dashboard body. */
  readonly widgets: {
    readonly quickAction: {
      readonly complaints: string;
      readonly payments: string;
      readonly calendar: string;
      readonly appraisals: string;
    };
    readonly openRequests: {
      readonly title: string;
      readonly emptyState: string;
      readonly emptyStateDescription: string;
      readonly viewAll: string;
      readonly requestType: {
        readonly delay: string;
        readonly cancel: string;
      };
      readonly status: {
        readonly pending: string;
        readonly approved: string;
        readonly rejected: string;
        readonly rescheduled: string;
        readonly cancelled: string;
      };
    };
  };
}
