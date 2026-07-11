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
    readonly clearSchedule: string;
    readonly deleteClass: string;
  };
  readonly grid: {
    readonly teacherTime: string;
    readonly available: string;
    readonly lunchBreak: string;
    readonly bookedClass: string;
    readonly availableSlot: string;
    readonly lastUpdated: string;
    readonly sessionEnded: string;
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
    readonly deleteClassTitle: string;
    readonly deleteClassMessage: string;
    readonly clearScheduleTitle: string;
    readonly clearScheduleMessage: string;
    readonly confirmYes: string;
    readonly cancel: string;
  };
  readonly notifications: {
    readonly classDeleted: string;
    readonly classDeleteFailed: string;
    readonly scheduleCleared: string;
    readonly scheduleClearFailed: string;
  };
}
