export interface ClassAuditLabels {
  readonly invalidClassId: string;
  readonly pageTitle: string;
  readonly mobileTitle: string;
  readonly breadcrumbs: {
    readonly dashboard: string;
    readonly schedules: string;
    readonly current: string;
  };
  readonly actions: {
    readonly generateReport: string;
    readonly editClass: string;
  };
  readonly fields: {
    readonly courseCode: string;
    readonly teacher: string;
    readonly originalDate: string;
    readonly rescheduledDate: string;
    readonly timeSlot: string;
    readonly venue: string;
    readonly classDetails: string;
  };
  readonly status: {
    readonly regularRescheduled: string;
  };
  readonly auditTrail: {
    readonly title: string;
  };
  readonly students: {
    readonly title: (count: number) => string;
    readonly exportList: string;
    readonly studentName: string;
    readonly idNumber: string;
    readonly attendanceStatus: string;
    readonly actions: string;
    readonly student: string;
    readonly status: string;
    readonly viewAll: (count: number) => string;
    readonly pending: string;
    readonly present: string;
    readonly absent: string;
    readonly noEntries: string;
    readonly viewStudentAriaLabel: (name: string) => string;
  };
  readonly venue: {
    readonly title: string;
    readonly capacity: (count: number) => string;
    readonly viewMap: string;
    readonly capacityBadge: (count: number) => string;
  };
  readonly meeting: {
    readonly title: string;
    readonly joinMeeting: string;
  };
  readonly communication: {
    readonly title: string;
    readonly resendNotifications: string;
  };
  readonly adminNote: {
    readonly title: string;
    readonly titleMobile: string;
    readonly lastUpdated: (time: string) => string;
    readonly update: string;
    readonly edit: string;
    readonly content: string;
  };
  readonly meetingIdLabel: string;
  readonly online: string;
  readonly meetingIdNA: string;
}
