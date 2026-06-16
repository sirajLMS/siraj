export interface TeacherReassignmentLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly breadcrumbs: {
    readonly dashboard: string;
    readonly parentManagement: string;
    readonly teacherReassignment: string;
  };
  readonly studentContext: {
    readonly studentId: string;
    readonly grade: string;
    readonly enrollment: string;
    readonly active: string;
  };
  readonly currentTeacher: {
    readonly title: string;
    readonly unset: string;
    readonly notice: string;
  };
  readonly warning: string;
  readonly controls: {
    readonly title: string;
    readonly subtitle: string;
    readonly assignTeacher: string;
    readonly assignTeacherPlaceholder: string;
    readonly teacherAvailabilityNotice: string;
    readonly statusUpdate: string;
    readonly currentStatus: string;
  };
  readonly historyAndContact: {
    readonly changeHistory: string;
    readonly lastUpdated: string;
    readonly parentContact: string;
    readonly pendingNotifications: string;
  };
  readonly actions: {
    readonly info: string;
    readonly cancel: string;
    readonly submit: string;
    readonly processing: string;
    readonly saved: string;
  };
}
