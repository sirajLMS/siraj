import type { ScheduledClass } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";
import type { MeetingConfigJoinLabels } from "@/shared/locale/types/ui";

export const weeklyScheduleLocale: AppLocale = "en";

/** Override-style label fixtures: asserted text is exactly what the component receives via props. */
export const weeklyScheduleLabels: TeacherWeeklyScheduleLabels = {
  pageTitle: name => `Fixture Weekly Schedule - ${name}`,
  breadcrumbs: {
    teachers: "Fixture Teachers",
    schedule: "Fixture Schedule",
  },
  metrics: {
    weeklyHoursWorkedTitle: "Fixture Weekly Hours Worked",
    weeklyHoursWorked: hours => `Fixture Weekly Hours Worked: ${hours}`,
  },
  actions: {
    addSlot: "Fixture Add Slot",
    delete: "Fixture Delete",
    clearSchedule: "Fixture Clear Schedule",
    deleteClass: "Fixture Delete Class",
  },
  grid: {
    teacherTime: "Fixture Teacher Time",
    available: "Fixture Available",
    lunchBreak: "Fixture Lunch",
    bookedClass: "Fixture Booked",
    availableSlot: "Fixture Available Slot",
    lastUpdated: date => `Fixture Last Updated: ${date}`,
    unknownSubject: "Fixture Unknown Subject",
    minutesShort: minutes => `Fixture ${minutes}m`,
    status: {
      ended: "Fixture Ended",
      absent: "Fixture Absent",
      leave: "Fixture Leave",
      pending: "Fixture Pending",
      activated: "Fixture Activated",
      running: "Fixture Running",
      frozen: "Fixture Frozen",
    },
  },
  days: {
    monday: "Fixture Monday",
    tuesday: "Fixture Tuesday",
    wednesday: "Fixture Wednesday",
    thursday: "Fixture Thursday",
    friday: "Fixture Friday",
    saturday: "Fixture Saturday",
    sunday: "Fixture Sunday",
    mon: "Fixture Mon",
    tue: "Fixture Tue",
    wed: "Fixture Wed",
    thu: "Fixture Thu",
    fri: "Fixture Fri",
    sat: "Fixture Sat",
    sun: "Fixture Sun",
  },
  dialogs: {
    deleteConfirm: "Fixture Delete Confirm",
    deleteConfirmClass: "Fixture Delete Confirm Class",
    deleteClassTitle: "Fixture Delete Class Title",
    deleteClassMessage: "Fixture Delete Class Message",
    clearScheduleTitle: "Fixture Clear Schedule Title",
    clearScheduleMessage: "Fixture Clear Schedule Message",
    confirmYes: "Fixture Confirm Yes",
    cancel: "Fixture Cancel",
  },
  notifications: {
    classDeleted: "Fixture Class Deleted",
    classDeleteFailed: "Fixture Class Delete Failed",
    scheduleCleared: "Fixture Schedule Cleared",
    scheduleClearFailed: "Fixture Schedule Clear Failed",
  },
};

export const meetingJoinLabels: MeetingConfigJoinLabels = {
  joinMeeting: "Fixture Join Meeting",
  joinUnavailable: "Fixture Join Unavailable",
  openInNewTab: "Fixture Open In New Tab",
  emptyTeacher: "Fixture Empty Teacher",
  emptyParent: "Fixture Empty Parent",
  emptyClass: "Fixture Empty Class",
  setupLink: "Fixture Setup Link",
  providerTooltip: (provider, source) => `Fixture ${provider} via ${source}`,
};

/** A non-terminal, non-frozen slot — shows the delete affordance, no join URL. */
export function makeDeletableScheduledClass(overrides: Partial<ScheduledClass> = {}): ScheduledClass {
  return {
    id: "class-delete-1",
    studentName: "Fixture Student",
    studentId: "student-1",
    duration: 60,
    startTime: "08:00 AM",
    day: "monday",
    executionState: null,
    outcome: null,
    isFrozen: false,
    subjectName: "Fixture Subject",
    classType: null,
    meetingJoinUrl: null,
    effectiveMeeting: null,
    ...overrides,
  };
}
