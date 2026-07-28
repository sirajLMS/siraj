// NEW FOR PLAN v5: buildFormLabels lifted out of tier CreateRecurringClassView twins
// (was duplicated byte-identically in createRecurringClassView.{mobile,desktop}.tsx).
// Sonar cluster 27: RecurringClassFormLabels is now derived via Pick from CreateRecurringClassLabels
// to eliminate the structural duplication between this type and the locale label interface.
import type { CreateRecurringClassLabels } from "@/shared/locale";

export type RecurringClassFormLabels = Pick<
  CreateRecurringClassLabels,
  | "add"
  | "addClass"
  | "addedSuccessfully"
  | "students"
  | "studentsPlaceholder"
  | "teacher"
  | "teacherPlaceholder"
  | "subject"
  | "subjectPlaceholder"
  | "defaultStartTime"
  | "duration"
  | "durationHours"
  | "durationMinutes"
  | "hours"
  | "minutes"
  | "daysSelection"
  | "classSchedule"
  | "timeOverride"
  | "weekendOff"
  | "timezone"
  | "timezonePlaceholder"
  | "classType"
  | "classTypePlaceholder"
  | "hourlyRateLabel"
  | "currencyLabel"
  | "days"
>;

export function buildRecurringClassFormLabels(labels: CreateRecurringClassLabels): RecurringClassFormLabels {
  return {
    add: labels.add,
    addClass: labels.addClass,
    addedSuccessfully: labels.addedSuccessfully,
    students: labels.students,
    studentsPlaceholder: labels.studentsPlaceholder,
    teacher: labels.teacher,
    teacherPlaceholder: labels.teacherPlaceholder,
    subject: labels.subject,
    subjectPlaceholder: labels.subjectPlaceholder,
    defaultStartTime: labels.defaultStartTime,
    duration: labels.duration,
    durationHours: labels.durationHours,
    durationMinutes: labels.durationMinutes,
    hours: labels.hours,
    minutes: labels.minutes,
    daysSelection: labels.daysSelection,
    classSchedule: labels.classSchedule,
    timeOverride: labels.timeOverride,
    weekendOff: labels.weekendOff,
    timezone: labels.timezone,
    timezonePlaceholder: labels.timezonePlaceholder,
    classType: labels.classType,
    classTypePlaceholder: labels.classTypePlaceholder,
    hourlyRateLabel: labels.hourlyRateLabel,
    currencyLabel: labels.currencyLabel,
    days: labels.days,
  };
}
