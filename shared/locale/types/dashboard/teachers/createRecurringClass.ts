export interface TeacherCreateRecurringClassLabels {
  readonly dialogTitle: string;
  readonly fields: {
    readonly student: string;
    readonly studentPlaceholder: string;
    readonly teacher: string;
    readonly teacherPlaceholder: string;
    readonly subject: string;
    readonly subjectPlaceholder: string;
    readonly time: string;
    readonly duration: string;
    readonly durationMinutes: (minutes: number) => string;
    readonly days: string;
    readonly timezone: string;
    readonly classType: string;
  };
  readonly classTypes: {
    readonly REGULAR: string;
    readonly TRIAL: string;
    readonly ADVANCE: string;
  };
  readonly days: {
    readonly monday: string;
    readonly tuesday: string;
    readonly wednesday: string;
    readonly thursday: string;
    readonly friday: string;
    readonly saturday: string;
    readonly sunday: string;
  };
  readonly timeOverride: {
    readonly addOverride: string;
    readonly removeOverride: string;
    readonly label: (day: string) => string;
  };
  readonly scheduling: {
    readonly mode: string;
    readonly quotaId: string;
    readonly quotaSelect: string;
    readonly quotaPlaceholder: string;
    readonly noOpenQuotas: string;
    readonly noOpenQuotasCta: string;
    readonly quotaOptionLabel: (name: string, remaining: number, validUntil: string) => string;
    readonly earmarkedClasses: string;
    readonly generationHorizon: string;
    readonly ondemandNoCreditsOutcome: string;
    readonly noMode: string;
    readonly ondemandNoCredits: {
      readonly AutoCancel: string;
      readonly AutoAbsentNoCredits: string;
      readonly RemindOnly: string;
    };
    readonly modes: {
      readonly NumberOfClasses: string;
      readonly OnDemand: string;
      readonly Quota: string;
    };
  };
  readonly actions: {
    readonly create: string;
    readonly cancel: string;
    readonly submitting: string;
  };
  readonly success: {
    readonly title: string;
    readonly description: (count: number) => string;
  };
  readonly errors: {
    readonly noDaysSelected: string;
    readonly noStudentSelected: string;
    readonly noSubjectSelected: string;
    readonly creationFailed: string;
    readonly durationMustBePositive: string;
  };
}
