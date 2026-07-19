export interface TeacherDashboardLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly overviewTitle: string;
  readonly todayChip: string;
  readonly updatedJustNow?: string;
  readonly updatedMinutesAgo?: (minutes: number) => string;
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
    readonly title: (name: string) => string;
    readonly subtitle: (date: string, count: number) => string;
    readonly overviewLabel: string;
    readonly mobileSummary: (date: string, count: number) => string;
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
    readonly showing: (shown: number, total: number) => string;
    readonly noEntries: string;
    readonly sessionEnded: string;
    readonly frozen: string;
    readonly contactAdmin: string;
    readonly duration: string;
    readonly durationValue: (minutes: number) => string;
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
    readonly disabledTooltips: {
      readonly activateBeforeWindow: string;
      readonly activateAfterWindow: string;
      readonly activateConnecting: string;
      readonly joinVideoUnavailable: string;
      readonly markAbsentWaitingPeriod: string;
    };
  };
  readonly activeControls: {
    readonly liveNow: string;
    readonly sessionControls: string;
    readonly startSession: string;
    readonly markAbsent: string;
    readonly requestLeave: string;
    readonly markAbsentDialogTitle: string;
    readonly markAbsentConfirmation: string;
    readonly markAbsentConfirm: string;
    readonly cancel: string;
  };
  readonly progressFeed: {
    readonly title: string;
    readonly autoMissedTooltip: string;
    readonly events: {
      readonly auto_missed: string;
      readonly marked_absent: string;
      readonly activated: string;
      readonly started: string;
      readonly completed: string;
      readonly leave: string;
      readonly other: string;
    };
  };
  readonly alert: {
    readonly title: string;
    readonly description: (time: string) => string;
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
  readonly manualClassEntry: {
    readonly titleCreate: string;
    readonly titleCreateActive: string;
    readonly cancel: string;
    readonly create: string;
    readonly creating: string;
    readonly studentLabel: string;
    readonly studentLoading: string;
    readonly noStudentsAssigned: string;
    readonly subjectLabel: string;
    readonly subjectPlaceholder: string;
    readonly scheduledDate: string;
    readonly startTime: string;
    readonly durationMinutes: string;
    readonly classType: string;
    readonly classTypeRegular: string;
    readonly classTypeTrial: string;
    readonly classTypePromotion: string;
    readonly selectStudent: string;
    readonly selectSubject: string;
    readonly selectDate: string;
    readonly selectTime: string;
    readonly createFailed: string;
    readonly teacherIdNotFound: string;
  };
  readonly supportRequestSubmitted: (type: string) => string;
  readonly rules: {
    readonly pageTitle: string;
    readonly pageSubtitle: string;
  };
}
