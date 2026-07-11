export interface ParentDashboardLabels {
  readonly pageTitle: string;
  readonly welcome: string;
  readonly welcomeBack: string;
  readonly pendingMessages: string;
  readonly metrics: {
    readonly totalStudents: string;
    readonly todaysClasses: string;
    readonly pendingInvoices: string;
    readonly performanceAvg: string;
  };
  readonly schedule: {
    readonly title: string;
    readonly titleMobile: string;
    readonly filter: string;
    readonly viewFullWeek: string;
    readonly viewAll: string;
    readonly rowNumber: string;
    readonly classTime: string;
    readonly studentName: string;
    readonly teacherName: string;
    readonly history: string;
    readonly status: string;
    readonly contact: string;
    readonly classStatus: string;
    readonly duration: string;
    readonly teacherLabel: string;
    readonly joinVideo: string;
    readonly frozen: string;
    readonly contactAdmin: string;
    readonly noEntries: string;
  };
  readonly bookingStatus: {
    readonly confirmed: string;
    readonly rescheduled: string;
  };
  readonly liveClassStatus: {
    readonly startingSoon: string;
    readonly pending: string;
    readonly scheduled: string;
  };
  readonly progress: {
    readonly title: string;
    readonly subtitle: string;
    readonly completion: string;
    readonly downloadReport: string;
  };
  readonly workshop: {
    readonly badge: string;
    readonly learnMore: string;
  };
  readonly support: {
    readonly liveSupport: string;
  };
}
