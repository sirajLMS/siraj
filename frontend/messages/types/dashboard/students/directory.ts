export interface StudentDirectoryLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly mobileTitle: string;
  readonly searchPlaceholder: string;
  readonly addStudent: string;
  readonly filters: string;
  readonly globalRecord: string;
  readonly previous: string;
  readonly next: string;
  readonly showingOf: string;
  readonly metrics: {
    readonly activated: string;
    readonly deactivated: string;
    readonly regular: string;
    readonly onLeave: string;
    readonly suspended: string;
    readonly onTrial: string;
  };
  readonly table: {
    readonly index: string;
    readonly student: string;
    readonly email: string;
    readonly status: string;
    readonly hoursPerWeek: string;
    readonly classesLeft: string;
    readonly actions: string;
  };
  readonly status: {
    readonly activated: string;
    readonly deactivated: string;
    readonly regular: string;
    readonly onLeave: string;
    readonly suspended: string;
    readonly onTrial: string;
  };
  readonly enrollment: {
    readonly regular: string;
    readonly prospect: string;
    readonly withdrawn: string;
  };
  readonly card: {
    readonly weeklyHours: string;
    readonly enrollmentStatus: string;
  };
  readonly actions: {
    readonly viewProfile: string;
    readonly viewHistory: string;
  };
  readonly noEntries: string;
}
