export interface ScheduleAlertsLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly alerts: {
    readonly leaveQuotaExceeded: string;
    readonly missedClassTime: string;
  };
  readonly metrics: {
    readonly totalStudents: string;
    readonly totalStudentsTrend: string;
    readonly activeCourses: string;
    readonly activeCoursesSub: string;
  };
  readonly report: {
    readonly title: string;
    readonly description: string;
    readonly descriptionMobile: string;
    readonly downloadPdf: string;
  };
  readonly section: {
    readonly title: string;
    readonly subtitle: string;
  };
  readonly table: {
    readonly className: string;
    readonly instructor: string;
    readonly time: string;
    readonly room: string;
    readonly status: string;
  };
  readonly actions: {
    readonly filter: string;
    readonly export: string;
    readonly joinSession: string;
    readonly leaveClass: string;
    readonly viewRecording: string;
  };
  readonly sessionStatus: {
    readonly active: string;
    readonly upcoming: string;
    readonly missed: string;
  };
  readonly showingOf: string;
  readonly noEntries: string;
  readonly endOfSchedule: string;
  readonly loading: string;
}
