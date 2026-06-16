export interface TeacherWeeklyScheduleLabels {
  readonly pageTitle: string;
  readonly breadcrumbs: {
    readonly teachers: string;
    readonly schedule: string;
  };
  readonly metrics: {
    readonly weeklyHoursWorked: string;
  };
  readonly actions: {
    readonly addSlot: string;
    readonly delete: string;
  };
  readonly grid: {
    readonly teacherTime: string;
    readonly available: string;
    readonly lunchBreak: string;
    readonly bookedClass: string;
    readonly availableSlot: string;
    readonly lastUpdated: string;
  };
  readonly days: {
    readonly monday: string;
    readonly tuesday: string;
    readonly wednesday: string;
    readonly thursday: string;
    readonly friday: string;
    readonly saturday: string;
    readonly sunday: string;
    readonly mon: string;
    readonly tue: string;
    readonly wed: string;
    readonly thu: string;
    readonly fri: string;
    readonly sat: string;
    readonly sun: string;
  };
  readonly dialogs: {
    readonly deleteConfirm: string;
    readonly deleteConfirmClass: string;
  };
}
