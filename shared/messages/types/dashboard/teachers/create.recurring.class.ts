export interface TeacherCreateRecurringClassLabels {
  readonly dialogTitle: string;
  readonly fields: {
    readonly student: string;
    readonly studentPlaceholder: string;
    readonly teacher: string;
    readonly teacherPlaceholder: string;
    readonly time: string;
    readonly duration: string;
    readonly durationMinutes: string;
    readonly days: string;
    readonly timezone: string;
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
    readonly label: string;
  };
  readonly actions: {
    readonly create: string;
    readonly cancel: string;
  };
  readonly success: {
    readonly title: string;
    readonly description: string;
  };
  readonly errors: {
    readonly noDaysSelected: string;
    readonly noStudentSelected: string;
    readonly creationFailed: string;
  };
}
