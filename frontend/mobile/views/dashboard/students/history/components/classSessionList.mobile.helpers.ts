import { formatTime } from "@/frontend/common/components/intl/dateFormat";
import { AttendanceStatus } from "@/shared/constants/attendance-status.enum";
import type { StudentHistoryLabels } from "@/shared/locale/types/dashboard/students/history";

const STATUS_LABEL_KEYS: Readonly<Record<AttendanceStatus, string>> = {
  [AttendanceStatus.ABSENT]: "absent",
  [AttendanceStatus.LATE]: "late",
  [AttendanceStatus.PRESENT]: "present",
};

const ATTENDANCE_BADGE_STATUSES: Readonly<Record<AttendanceStatus, string>> = {
  [AttendanceStatus.ABSENT]: "missed",
  [AttendanceStatus.LATE]: "late",
  [AttendanceStatus.PRESENT]: "active",
};

export const attendanceBadgeStatus = (status: AttendanceStatus): string => ATTENDANCE_BADGE_STATUSES[status] ?? status;

export function getStatusLabel(status: AttendanceStatus, labels: Readonly<Record<string, string>>): string {
  const key = STATUS_LABEL_KEYS[status];
  return labels[key] ?? labels[status] ?? status;
}

export function formatDuration(mins: number, t: StudentHistoryLabels): string {
  if (mins < 60) return t.minutesShort(mins);
  const hrs = mins / 60;
  return t.hoursShort(hrs % 1 === 0 ? hrs : Number(hrs.toFixed(1)));
}

export function splitSessionTimeDisplay(time: string, locale: string): { timeValue: string; timePeriod: string } {
  if (!time.trim()) {
    return { timeValue: "—", timePeriod: "" };
  }

  const formatted = formatTime(time, locale);
  const spaceIndex = formatted.indexOf(" ");
  if (spaceIndex === -1) {
    return { timeValue: formatted, timePeriod: "" };
  }

  return {
    timeValue: formatted.slice(0, spaceIndex),
    timePeriod: formatted.slice(spaceIndex + 1).trim(),
  };
}
