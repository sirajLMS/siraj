export interface TeacherClassListLabels {
  readonly pageTitle: string;
  readonly pageSubtitle: string;
  readonly noClasses: string;
  readonly viewDetails: string;
  readonly viewClassAudit: string;
  readonly durationMinutes: string;
  readonly errors: {
    readonly failedToLoad: string;
  };
}
