import type { ClassSession } from "@/frontend/common/views/dashboard/students/history/types";
import { AttendanceStatus } from "@/shared/constants/attendance-status.enum";

type CalendarDayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export interface WeekDayData {
  readonly dayKey: CalendarDayKey;
  readonly dayOfMonth: number;
  readonly displayDate: number;
  readonly hasSession: boolean;
  readonly isInMonth: boolean;
  readonly status: AttendanceStatus | null;
}

export type DotColorResolver = (theme: import("@mui/material/styles").Theme) => string;

export function isCalendarDayKey(value: string): value is CalendarDayKey {
  return (
    value === "sun" ||
    value === "mon" ||
    value === "tue" ||
    value === "wed" ||
    value === "thu" ||
    value === "fri" ||
    value === "sat"
  );
}

const defaultDotColor: DotColorResolver = theme => theme.palette.primary.main;
const selectedDotColor: DotColorResolver = theme => theme.palette.onPrimaryContainer;
const absentDotColor: DotColorResolver = theme => theme.palette.error.main;
const lateDotColor: DotColorResolver = theme => theme.palette.warning.main;

export function resolveDotColor(isSelected: boolean, status: AttendanceStatus | null): DotColorResolver {
  if (isSelected) {
    return selectedDotColor;
  }
  if (status === AttendanceStatus.ABSENT) {
    return absentDotColor;
  }
  if (status === AttendanceStatus.LATE) {
    return lateDotColor;
  }
  return defaultDotColor;
}

export function computeWeekDays(
  currentMonth: Date,
  selectedWeek: number,
  classes: Readonly<Partial<Record<number, ClassSession>>>
): WeekDayData[] {
  const dayKeys: readonly CalendarDayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const weekStartDay = (selectedWeek - 1) * 7 + 1 - firstDayOfMonth;

  const result: WeekDayData[] = [];
  const weekDayIndices = [1, 2, 3, 4, 5, 6, 0];

  for (let i = 0; i < 7; i++) {
    const dayAbs = weekStartDay + i;
    if (dayAbs < 1 || dayAbs > daysInMonth) {
      const displayDate =
        dayAbs < 1
          ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate() + dayAbs
          : dayAbs - daysInMonth;
      result.push({
        dayKey: dayKeys[weekDayIndices[i]],
        dayOfMonth: -1,
        displayDate,
        hasSession: false,
        isInMonth: false,
        status: null,
      });
      continue;
    }

    const session = classes[dayAbs];
    result.push({
      dayKey: dayKeys[weekDayIndices[i]],
      dayOfMonth: dayAbs,
      displayDate: dayAbs,
      hasSession: !!session,
      isInMonth: true,
      status: session?.status ?? null,
    });
  }

  return result;
}
