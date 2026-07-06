export interface ParentStudentsLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly noStudents: string;
  readonly statusLabel: string;
  readonly teacherLabel: string;
  readonly quotaLabel: string;
  readonly hoursLabel: string;
  readonly errors: {
    readonly failedToLoad: string;
  };
}
