import { addDays, format, isValid, parse, subDays } from "date-fns";

const SCHEDULE_DATE_FILTER_FORMAT = "yyyy-MM-dd";

export function parseScheduleFilterDate(date: string): Date | null {
  if (date.length === 0) {
    return null;
  }

  const parsedDate = parse(date, SCHEDULE_DATE_FILTER_FORMAT, new Date());
  return isValid(parsedDate) ? parsedDate : null;
}

export function formatScheduleFilterDate(date: Date): string {
  return format(date, SCHEDULE_DATE_FILTER_FORMAT);
}

export function getTodayScheduleFilterDate(): string {
  return formatScheduleFilterDate(new Date());
}

export function isScheduleFilterDateToday(dateValue: string): boolean {
  return dateValue === getTodayScheduleFilterDate();
}

export function shiftScheduleFilterDate(dateValue: string, dayOffset: number): string {
  const parsedDate = parseScheduleFilterDate(dateValue);
  if (!parsedDate) {
    return dateValue;
  }

  const shiftedDate = dayOffset >= 0 ? addDays(parsedDate, dayOffset) : subDays(parsedDate, Math.abs(dayOffset));
  return formatScheduleFilterDate(shiftedDate);
}
