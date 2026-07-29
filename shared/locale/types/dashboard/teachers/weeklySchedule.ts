export interface TeacherWeeklyScheduleLabels {
  readonly pageTitle: (name: string) => string;
  readonly breadcrumbs: {
    readonly teachers: string;
    readonly schedule: string;
  };
  readonly metrics: {
    readonly weeklyHoursWorkedTitle: string;
    readonly weeklyHoursWorked: (hours: string) => string;
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
    readonly lastUpdated: (date: string) => string;
    readonly unknownSubject: string;
    readonly status: {
      readonly ended: string;
      readonly absent: string;
      readonly leave: string;
      readonly pending: string;
      readonly activated: string;
      readonly running: string;
      readonly frozen: string;
    };
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
