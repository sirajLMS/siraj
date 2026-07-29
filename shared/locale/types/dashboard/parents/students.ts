export interface ParentStudentsLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly noStudents: string;
  readonly card: {
    readonly classesLeft: string;
    readonly weeklyHours: string;
  };
  readonly status: {
    readonly deactivated: string;
    readonly regular: string;
    readonly onLeave: string;
    readonly suspended: string;
    readonly onTrial: string;
  };
  readonly errors: {
    readonly failedToLoad: string;
  };
}
