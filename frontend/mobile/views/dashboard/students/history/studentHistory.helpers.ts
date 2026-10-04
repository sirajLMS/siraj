import type { ClassSession } from "@/frontend/common/views/dashboard/students/history/types";
import { AttendanceStatus } from "@/shared/constants/attendance-status.enum";

export function deriveStreakDays(
  classes: Readonly<Partial<Record<number, ClassSession>>>,
  currentMonth: Date,
  selectedWeek: number
): number[] {
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const weekStartDay = (selectedWeek - 1) * 7 + 1 - firstDayOfMonth;

  const result: number[] = [];
  for (let i = 0; i < 7; i++) {
    const day = weekStartDay + i;
    if (day < 1 || day > daysInMonth) {
      result.push(0);
      continue;
    }
    const session = classes[day];
    if (!session) {
      result.push(0);
    } else if (session.status === AttendanceStatus.ABSENT) {
      result.push(0);
    } else if (session.status === AttendanceStatus.LATE) {
      result.push(24);
    } else {
      result.push(48);
    }
  }
  return result;
}
