export interface TeacherReassignmentLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly breadcrumbs: {
    readonly dashboard: string;
    readonly parentManagement: string;
    readonly teacherReassignment: string;
  };
  readonly studentContext: {
    readonly grade: (grade: string) => string;
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
    readonly currentStatus: (status: string) => string;
    readonly statusOptions: {
      readonly REGULAR: string;
      readonly SUSPENDED: string;
      readonly ON_LEAVE: string;
      readonly ON_TRIAL: string;
      readonly DEACTIVATED: string;
    };
  };
  readonly historyAndContact: {
    readonly changeHistory: string;
    readonly lastUpdated: (date: string) => string;
    readonly parentContact: string;
    readonly pendingNotifications: (count: number) => string;
  };
  readonly actions: {
    readonly info: string;
    readonly cancel: string;
    readonly submit: string;
    readonly processing: string;
    readonly saved: string;
    readonly reassignSuccess: string;
    readonly statusChangeSuccess: string;
  };
  readonly errors: {
    readonly invalidId: string;
  };
}
