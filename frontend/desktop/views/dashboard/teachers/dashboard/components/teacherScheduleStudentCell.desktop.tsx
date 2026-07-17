"use client";

import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import { studentHref } from "@/frontend/common/utils/profileHref";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display";

/**
 * Desktop variant of the schedule-row student cell.
 * Renders the avatar + linked student name used by the desktop data grid.
 */
export function TeacherScheduleStudentCellDesktop({ row }: Readonly<{ row: TeacherScheduleRow }>) {
  return (
    <DesktopPersonProfileLinkCell
      href={row.studentId ? studentHref(row.studentId) : undefined}
      name={row.studentName}
      showAvatar
      avatarSize={32}
      fallbackInitial={row.studentInitials?.[0] ?? "?"}
      typographyVariant="bodyMd"
      fontWeight={400}
    />
  );
}
