export interface ParentStudentsLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly noStudents: string;
  readonly statusLabel: (status: string) => string;
  readonly teacherLabel: (teacher: string) => string;
  readonly quotaLabel: (remaining: number, total: number) => string;
  readonly hoursLabel: (hours: number) => string;
  readonly errors: {
    readonly failedToLoad: string;
  };
}
