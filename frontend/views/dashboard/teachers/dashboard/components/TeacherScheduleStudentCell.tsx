"use client";

import { PersonProfileLinkCell } from "@/frontend/components/ui";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import { studentHref } from "@/frontend/common/utils/profileHref";

export function TeacherScheduleStudentCell({ row }: Readonly<{ row: TeacherScheduleRow }>) {
  return (
    <PersonProfileLinkCell
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
