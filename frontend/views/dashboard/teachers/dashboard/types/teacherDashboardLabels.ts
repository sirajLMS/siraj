import type { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";

export interface TeacherDashboardLabels {
  readonly pageTitle: string;
  readonly dateFilter: {
    readonly today: string;
    readonly previousDay: string;
    readonly nextDay: string;
    readonly dateLabel: string;
  };
  readonly schedule: {
    readonly title: string;
    readonly titleToday: string;
    readonly rowNumber: string;
    readonly student: string;
    readonly time: string;
    readonly duration: string;
    readonly durationValue: string;
    readonly status: string;
    readonly actions: string;
    readonly noEntries: string;
    readonly current: string;
    readonly classId: string;
    readonly sessionEnded: string;
  };
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
  readonly progressFeed: {
    readonly title: string;
  } & Record<string, string>;
  readonly alert: {
    readonly title: string;
    readonly description: string;
  };
  readonly policy: {
    readonly title: string;
    readonly description: string;
    readonly descriptionMobile: string;
  };
  readonly actions: {
    readonly downloadHandbook: string;
    readonly contactCoordinator: string;
    readonly activate: string;
    readonly activateSession: string;
    readonly connecting: string;
    readonly joinVideo: string;
  };
  readonly status: Record<string, string>;
  readonly instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly activeControls: {
    readonly sessionControls: string;
    readonly startSession: string;
    readonly markAbsent: string;
    readonly requestLeave: string;
    readonly markAbsentDialogTitle: string;
    readonly markAbsentConfirmation: string;
    readonly markAbsentConfirm: string;
    readonly cancel: string;
    readonly liveNow: string;
  };
  readonly activeWelcome: {
    readonly title: string;
    readonly mobileSummary: string;
  };
  readonly support: {
    readonly liveSupport: string;
  };
}

export interface TeacherDashboardViewLabels extends TeacherDashboardLabels {
  readonly instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
}
