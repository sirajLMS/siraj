export interface TeacherDashboardLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly overviewTitle: string;
  readonly todayChip: string;
  readonly metrics: {
    readonly totalClasses: string;
    readonly missedSlots: string;
    readonly completed: string;
    readonly studentsToday: string;
  };
  readonly activeMetrics: {
    readonly totalClasses: string;
    readonly activeSessions: string;
    readonly missedSlots: string;
    readonly completed: string;
  };
  readonly activeWelcome: {
    readonly title: string;
    readonly subtitle: string;
    readonly overviewLabel: string;
    readonly mobileSummary: string;
  };
  readonly schedule: {
    readonly title: string;
    readonly titleToday: string;
    readonly rowNumber: string;
    readonly classId: string;
    readonly student: string;
    readonly time: string;
    readonly status: string;
    readonly contact: string;
    readonly actions: string;
    readonly showing: string;
    readonly noEntries: string;
    readonly sessionEnded: string;
    readonly duration: string;
    readonly durationValue: string;
    readonly current: string;
    readonly viewAll: string;
  };
  readonly status: {
    readonly missed: string;
    readonly pending: string;
    readonly upcoming: string;
    readonly completed: string;
    readonly active: string;
    readonly connecting: string;
    readonly activated: string;
  };
  readonly actions: {
    readonly activate: string;
    readonly activateSession: string;
    readonly connecting: string;
    readonly printSchedule: string;
    readonly manualEntry: string;
    readonly newSession: string;
    readonly joinVideo: string;
    readonly downloadHandbook: string;
    readonly contactCoordinator: string;
  };
  readonly activeControls: {
    readonly liveNow: string;
    readonly sessionControls: string;
    readonly startSession: string;
    readonly markAbsent: string;
    readonly requestLeave: string;
  };
  readonly progressFeed: {
    readonly title: string;
  };
  readonly alert: {
    readonly title: string;
    readonly description: string;
  };
  readonly policy: {
    readonly title: string;
    readonly description: string;
    readonly descriptionMobile: string;
  };
  readonly dateFilter: {
    readonly today: string;
    readonly previousDay: string;
    readonly nextDay: string;
    readonly dateLabel: string;
  };
  readonly support: {
    readonly liveSupport: string;
  };
  readonly errors: {
    readonly meetingUrlNotAvailable: string;
    readonly handbookUrlNotFound: string;
    readonly missedClassTime: string;
    readonly activationFailed: string;
  };
  readonly supportRequestSubmitted: string;
}
