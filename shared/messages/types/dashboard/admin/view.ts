export interface ClassDetailsPerformanceLabels {
  readonly livePerformanceOverview: string;
  readonly last30Mins: string;
  readonly engagementScore: string;
  readonly assessmentProgress: string;
  readonly focusLevel: string;
  readonly sessionHealth: string;
}

export interface AdminViewLabels {
  readonly timezone: {
    readonly title: string;
    readonly description: string;
  };
  readonly adminActions: {
    readonly administrativeActions: string;
    readonly generateLog: string;
    readonly reschedule: string;
  };
  readonly classInfo: {
    readonly liveInstance: string;
    readonly activeConnection: string;
    readonly student: string;
    readonly moduleInstructor: string;
  };
  readonly metadata: {
    readonly metadata: string;
    readonly scheduledDate: string;
    readonly duration: string;
    readonly latency: string;
    readonly authorization: string;
    readonly minutes: string;
    readonly optimal: string;
  };
  readonly performance: ClassDetailsPerformanceLabels;
  readonly heatmap: {
    readonly activityHeatmap: string;
    readonly studentInput: string;
    readonly teacherResponse: string;
  };
}
