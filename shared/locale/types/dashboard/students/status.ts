export interface StudentStatusLabels {
  readonly pageTitle: string;
  readonly studentId: (id: string) => string;
  readonly breadcrumbs: {
    readonly students: string;
    readonly statusHold: string;
  };
  readonly sections: {
    readonly adminHold: string;
    readonly policyOverview: string;
    readonly upcomingClasses: string;
    readonly upcomingClassesMobile: string;
  };
  readonly fields: {
    readonly accountStatus: string;
    readonly statusReason: string;
    readonly statusReasonPlaceholder: string;
    readonly quickReasons: string;
  };
  readonly validation: {
    readonly reasonMinLength: string;
  };
  readonly statusOptions: {
    readonly REGULAR: string;
    readonly SUSPENDED: string;
    readonly ON_LEAVE: string;
    readonly ON_TRIAL: string;
    readonly DEACTIVATED: string;
  };
  readonly reasons: {
    readonly unpaidInvoice: string;
    readonly misconduct: string;
    readonly vacation: string;
  };
  readonly actions: {
    readonly applyChange: string;
    readonly viewHistory: string;
    readonly contactParent: string;
    readonly viewAll: string;
  };
  readonly table: {
    readonly subject: string;
    readonly instructor: string;
    readonly subjectInstructor: string;
    readonly dateTime: string;
    readonly duration: string;
    readonly holdStatus: string;
    readonly status: string;
    readonly join: string;
    readonly pendingHolds: (count: number) => string;
    readonly footerInfo: (id: string) => string;
    readonly noUpcomingClasses: string;
    readonly frozen: string;
    readonly active: string;
    readonly minutesShort: (minutes: number) => string;
    readonly sessionEnded: string;
    readonly joinSession: string;
  };
  readonly policies: {
    readonly suspensionTitle: string;
    readonly suspensionDesc: string;
    readonly onLeaveTitle: string;
    readonly onLeaveDesc: string;
  };
  readonly warning: {
    readonly title: string;
    readonly description: string;
  };
  readonly successMessage: string;
  readonly errors: {
    readonly invalidId: string;
  };
}
