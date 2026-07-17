import { addDays, format, isValid, parse, subDays } from "date-fns";

export const SCHEDULE_DATE_FILTER_FORMAT_DESKTOP = "yyyy-MM-dd";

export function parseScheduleFilterDateDesktop(date: string): Date | null {
  if (date.length === 0) {
    return null;
  }

  const parsedDate = parse(date, SCHEDULE_DATE_FILTER_FORMAT_DESKTOP, new Date());
  return isValid(parsedDate) ? parsedDate : null;
}

export function formatScheduleFilterDateDesktop(date: Date): string {
  return format(date, SCHEDULE_DATE_FILTER_FORMAT_DESKTOP);
}

export function getTodayScheduleFilterDateDesktop(): string {
  return formatScheduleFilterDateDesktop(new Date());
}

export function isScheduleFilterDateTodayDesktop(dateValue: string): boolean {
  return dateValue === getTodayScheduleFilterDateDesktop();
}

export function shiftScheduleFilterDateDesktop(dateValue: string, dayOffset: number): string {
  const parsedDate = parseScheduleFilterDateDesktop(dateValue);
  if (!parsedDate) {
    return dateValue;
  }

  const shiftedDate = dayOffset >= 0 ? addDays(parsedDate, dayOffset) : subDays(parsedDate, Math.abs(dayOffset));
  return formatScheduleFilterDateDesktop(shiftedDate);
}
