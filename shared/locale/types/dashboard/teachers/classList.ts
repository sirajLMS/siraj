export interface TeacherClassListLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly noClasses: string;
  readonly viewDetails: string;
  readonly viewClassAudit: string;
  readonly durationMinutes: (minutes: number) => string;
  readonly errors: {
    readonly failedToLoad: string;
  };
}
