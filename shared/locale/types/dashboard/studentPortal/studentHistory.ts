export type StudentPortalHistoryStatusLabels = {
  readonly ended: string;
  readonly present: string;
  readonly absent: string;
  readonly late: string;
  readonly scheduled: string;
  readonly pending: string;
  readonly cancelled: string;
};

export type StudentPortalHistoryCalendarWeekdayLabels = {
  readonly sun: string;
  readonly mon: string;
  readonly tue: string;
  readonly wed: string;
  readonly thu: string;
  readonly fri: string;
  readonly sat: string;
};

export interface StudentPortalHistoryLabels {
  readonly pageTitle: string;
  readonly lessonHistory: string;
  readonly sessionDate: string;
  readonly subject: string;
  readonly instructor: string;
  readonly duration: string;
  readonly status: string;
  readonly outcome: string;
  readonly notes: string;
  readonly joinUrl: string;
  readonly noHistory: string;
  readonly loadingMessage: string;
  readonly filterBySubject: string;
  readonly filterByDate: string;
  readonly filterByStatus: string;
  readonly allSubjects: string;
  readonly allStatuses: string;
  readonly viewReport: string;
  readonly addReflection: string;
  readonly previousMonth: string;
  readonly nextMonth: string;
  readonly totalClasses: string;
  readonly attendanceRate: string;
  readonly hoursStudied: string;
  readonly performance: string;
  readonly backToDashboard: string;
  readonly weeklyAttendance: string;
  readonly week: (number: number) => string;
  readonly statusLabels: StudentPortalHistoryStatusLabels;
  readonly minutesShort: (minutes: number) => string;
  readonly viewClass: string;
  readonly joinSession: string;
  readonly sessionsList: string;
  readonly calendarWeekdays: StudentPortalHistoryCalendarWeekdayLabels;
  readonly scheduleFor: (weekday: string, month: string, day: number) => string;
}
