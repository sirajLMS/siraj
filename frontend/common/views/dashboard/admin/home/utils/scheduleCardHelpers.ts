// NEW FOR PLAN v5: schedule card pure-data helpers (getPersonAccentColor, buildScheduleMetaItems) lifted out of the mobile tier view so tier modules contain rendering only.
import type { Theme } from "@mui/material/styles";
import { getNameInitials } from "@/frontend/common/views/dashboard/utils/nameInitials";

export type PersonAccentTone = "teacher" | "student" | "default";

export function getPersonAccentColor(tone: PersonAccentTone, theme: Theme): string {
  switch (tone) {
    case "teacher":
      return theme.palette.text.secondary;
    case "student":
      return theme.palette.onSurface;
    case "default":
      return theme.palette.onSurface;
  }
  throw new Error(`Unhandled case in getPersonAccentColor`);
}

export { getNameInitials };

export interface MetaStatItem {
  readonly label: string;
  readonly value: import("react").ReactNode;
  readonly tone?: PersonAccentTone;
}

export function buildScheduleMetaItems(
  headers: {
    readonly teacherTime: string;
    readonly studentTime: string;
    readonly duration: string;
  },
  teacherTimeCell: import("react").ReactNode,
  studentTimeCell: import("react").ReactNode,
  duration: string,
  showTimezones: boolean
): MetaStatItem[] {
  const timezoneItems: MetaStatItem[] = showTimezones
    ? [
        { label: headers.teacherTime, value: teacherTimeCell, tone: "teacher" },
        { label: headers.studentTime, value: studentTimeCell, tone: "student" },
      ]
    : [];
  return [...timezoneItems, { label: headers.duration, value: duration, tone: "default" }];
}
