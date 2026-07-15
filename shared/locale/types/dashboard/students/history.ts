export interface StudentHistoryLabels {
  readonly breadcrumbs: {
    readonly archive: string;
    readonly history: string;
  };
  readonly common: {
    readonly student: string;
  };
  readonly pageTitle: (name: string) => string;
  readonly pageSubtitle: (month: string) => string;
  readonly exportPdf: string;
  readonly changeMonth: string;
  readonly metrics: {
    readonly totalClasses: (count: number) => string;
    readonly attendanceRate: (rate: number) => string;
    readonly hoursStudied: (hours: number) => string;
    readonly performance: (score: number) => string;
  };
  readonly calendar: {
    readonly weeklyAttendance: string;
    readonly week: (number: number) => string;
    readonly days: {
      readonly sun: string;
      readonly mon: string;
      readonly tue: string;
      readonly wed: string;
      readonly thu: string;
      readonly fri: string;
      readonly sat: string;
    };
  };
  readonly classDetails: {
    readonly title: string;
    readonly classDetails: (date: string) => string;
    readonly instructor: (name: string) => string;
    readonly timeSlot: string;
    readonly roomNo: string;
    readonly contentNotes: string;
    readonly viewAssignments: string;
    readonly downloadLogs: string;
    readonly joinSession: string;
    readonly status: {
      readonly present: string;
      readonly absent: string;
      readonly late: string;
      readonly PENDING: string;
      readonly TAKEN: string;
      readonly ABSENT: string;
      readonly LEAVE: string;
      readonly NOT_ACTIVATED: string;
      readonly ACTIVATED: string;
      readonly RUNNING: string;
      readonly COMPLETED: string;
    };
    readonly noSessions: string;
    readonly dayOfMonth: (day: number, month: string) => string;
  };
  readonly performanceStreak: {
    readonly title: string;
    readonly description: (count: number) => string;
  };
  readonly errors: {
    readonly loadFailed: string;
  };
}
