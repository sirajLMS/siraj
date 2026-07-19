export interface ClassDetailsPerformanceLabels {
  readonly livePerformanceOverview: string;
  readonly last30Mins: string;
  readonly engagementScore: string;
  readonly assessmentProgress: string;
  readonly focusLevel: string;
  readonly sessionHealth: string;
  readonly noData: string;
}

export interface AdminViewLabels {
  readonly admin: {
    readonly pageTitle: string;
    readonly roleLabel: string;
  };
  readonly timezone: {
    readonly title: string;
    readonly message: (studentTimezone: string, teacherTimezone: string) => string;
  };
  readonly adminActions: {
    readonly administrativeActions: string;
    readonly generateLog: string;
    readonly reschedule: string;
    readonly forceActivate: string;
    readonly stopPause: string;
    readonly deleteInstance: string;
    readonly disabledTooltips: {
      readonly forceActivate: {
        readonly activated: string;
        readonly running: string;
        readonly completed: string;
      };
      readonly stop: {
        readonly notActivated: string;
        readonly activated: string;
        readonly completed: string;
      };
    };
  };
  readonly classInfo: {
    readonly liveInstance: string;
    readonly activeConnection: string;
    readonly student: string;
    readonly moduleInstructor: string;
    readonly viewSubject: string;
  };
  readonly metadata: {
    readonly metadata: string;
    readonly scheduledDate: string;
    readonly duration: string;
    readonly latency: string;
    readonly authorization: string;
    readonly minutes: string;
    readonly optimal: string;
    readonly unavailable: string;
  };
  readonly performance: ClassDetailsPerformanceLabels;
  readonly heatmap: {
    readonly activityHeatmap: string;
    readonly studentInput: string;
    readonly teacherResponse: string;
    readonly noData: string;
  };
}
