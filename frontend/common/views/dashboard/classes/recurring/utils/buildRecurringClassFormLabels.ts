// NEW FOR PLAN v5: buildFormLabels lifted out of tier CreateRecurringClassView twins
// (was duplicated byte-identically in createRecurringClassView.{mobile,desktop}.tsx).
import type { CreateRecurringClassLabels } from "@/shared/locale";

export type RecurringClassFormLabels = {
  readonly add: string;
  readonly addClass: string;
  readonly addedSuccessfully: string;
  readonly students: string;
  readonly studentsPlaceholder: string;
  readonly teacher: string;
  readonly teacherPlaceholder: string;
  readonly subject: string;
  readonly subjectPlaceholder: string;
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
  readonly days: CreateRecurringClassLabels["days"];
};

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
    days: labels.days,
  };
}
