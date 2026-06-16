import type { AdminViewLabels, ClassDetailsPerformanceLabels } from "../admin";

export interface ClassDetailsLabels {
  readonly pageSubtitleAdmin: string;
  readonly pageSubtitleTeacher: string;
  readonly breadcrumbs: {
    readonly dashboard: string;
    readonly classes: string;
  };
  readonly timezone: AdminViewLabels["timezone"];
  readonly adminActions: AdminViewLabels["adminActions"];
  readonly classInfo: AdminViewLabels["classInfo"];
  readonly metadata: AdminViewLabels["metadata"];
  readonly performance: ClassDetailsPerformanceLabels & {
    readonly previousPerformanceOverview: string;
    readonly attendanceRate: string;
    readonly avgGrade: string;
    readonly lastClass: string;
    readonly days: string;
  };
  readonly heatmap: AdminViewLabels["heatmap"];
  readonly instanceDetails: {
    readonly classInstanceDetails: string;
    readonly studentName: string;
    readonly courseModule: string;
    readonly startTime: string;
    readonly endTime: string;
    readonly duration: string;
    readonly status: string;
  };
  readonly remarks: {
    readonly remarksTitle: string;
  };
  readonly actions: {
    readonly actions: string;
    readonly activate: string;
    readonly stopPause: string;
    readonly infoEdit: string;
    readonly delete: string;
    readonly contextualHelp: string;
  };
  readonly studentProfile: {
    readonly studentLevel: string;
    readonly viewFullProfile: string;
  };
  readonly status: {
    readonly active: string;
    readonly scheduled: string;
    readonly pending: string;
    readonly completed: string;
    readonly cancelled: string;
  };
}
