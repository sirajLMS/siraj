export interface StudentStatusLabels {
  readonly pageTitle: string;
  readonly studentId: string;
  readonly breadcrumbs: {
    readonly students: string;
    readonly statusHold: string;
  };
  readonly sections: {
    readonly adminHold: string;
    readonly policyOverview: string;
    readonly upcomingClasses: string;
  };
  readonly fields: {
    readonly accountStatus: string;
    readonly statusReason: string;
    readonly statusReasonPlaceholder: string;
    readonly quickReasons: string;
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
    readonly subjectInstructor: string;
    readonly dateTime: string;
    readonly roomLink: string;
    readonly status: string;
    readonly pendingHolds: string;
    readonly footerInfo: string;
    readonly noUpcomingClasses: string;
    readonly frozen: string;
    readonly active: string;
    readonly minutesShort: string;
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
}
