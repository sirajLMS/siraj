export interface CreateRecurringClassLabels {
  readonly pageTitle: string;
  readonly title: string;
  readonly subtitle: string;
  readonly breadcrumbs: {
    readonly dashboard: string;
    readonly classes: string;
  };
  readonly add: string;
  readonly addClass: string;
  readonly addedSuccessfully: string;
  readonly close: string;
  readonly students: string;
  readonly studentsPlaceholder: string;
  readonly teacher: string;
  readonly teacherPlaceholder: string;
  readonly defaultStartTime: string;
  readonly duration: string;
  readonly durationHours: string;
  readonly durationMinutes: string;
  readonly hours: string;
  readonly minutes: string;
  readonly daysSelection: string;
  readonly classSchedule: string;
  readonly timeOverride: string;
  readonly weekendOff: string;
  readonly timezone: string;
  readonly timezonePlaceholder: string;
  readonly classType: string;
  readonly classTypePlaceholder: string;
  readonly days: {
    readonly monday: string;
    readonly tuesday: string;
    readonly wednesday: string;
    readonly thursday: string;
    readonly friday: string;
    readonly saturday: string;
    readonly sunday: string;
  };
  readonly validation: {
    readonly studentRequired: string;
    readonly teacherRequired: string;
    readonly startTimeRequired: string;
    readonly durationRequired: string;
    readonly daysRequired: string;
    readonly durationHoursMax: string;
    readonly durationMinutesMax: string;
    readonly timezoneRequired: string;
    readonly creationFailed: string;
  };
}
