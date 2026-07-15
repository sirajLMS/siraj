export interface TeacherFutureScheduleLabels {
  readonly pageTitle: string;
  readonly jumpToDate: string;
  readonly leaveQuota: string;
  readonly totalClasses: string;
  readonly futureClasses: string;
  readonly available: string;
  readonly regular: string;
  readonly reScheduled: string;
  readonly requestLeave: string;
  readonly viewMaterials: string;
  readonly quotaReached: string;
  readonly remaining: (count: number, total: number) => string;
  readonly importantNotes: string;
  readonly supportContact: string;
  readonly contactAdmin: string;
  readonly monthDisplay: (month: string, year: string) => string;
  readonly leaveQuotaDesc: (count: number) => string;
  readonly totalClassesDesc: (count: number) => string;
  readonly loading: string;
  readonly defaultLeaveReason: string;
  readonly supportRequestReason: string;
  readonly students: string;
  readonly errors: {
    readonly quotaExceeded: string;
    readonly leaveRequestFailed: string;
    readonly failedToLoad: string;
    readonly supportRequestFailed: string;
  };
  readonly notifications: {
    readonly noSubjectAssigned: string;
    readonly supportRequestSent: string;
    readonly leaveRequested: string;
  };
  readonly actions: {
    readonly joinVideo: string;
  };
}
