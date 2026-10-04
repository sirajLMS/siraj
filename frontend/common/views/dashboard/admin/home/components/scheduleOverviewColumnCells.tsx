"use client";

import { PersonProfileLinkCell } from "@/frontend/common/components/ui";
import { ClassProfileLinkCell } from "@/frontend/common/components/ui/display/classProfileLink/ClassProfileLinkCell";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";

export function renderClassCell(row: DailyScheduleRow) {
  const classId = row.id ?? "";
  const courseName = row.courseName?.trim() ?? "—";

  return (
    <ClassProfileLinkCell
      href={classId ? classHref(classId) : undefined}
      name={courseName}
      avatarUrl={row.avatarUrl}
      avatarSize={40}
      typographyVariant="bodyMd"
      fontWeight={700}
    />
  );
}

export function renderStudentCell(row: DailyScheduleRow) {
  const studentName = row.student?.name ?? "Unknown Student";
  const studentId = row.student?.id;

  return (
    <PersonProfileLinkCell
      href={studentId ? studentHref(studentId) : undefined}
      name={studentName}
      avatarUrl={row.student?.avatarUrl}
      avatarSize={32}
      typographyVariant="bodyMd"
      fontWeight={600}
    />
  );
}

export function renderTeacherCell(row: DailyScheduleRow) {
  const teacherName = row.teacher?.name ?? "Unknown Teacher";
  const teacherId = row.teacher?.id;

  return (
    <PersonProfileLinkCell
      href={teacherId ? profileHrefForTeacher({ teacherId }) : undefined}
      name={teacherName}
      avatarUrl={row.teacher?.avatarUrl}
      avatarSize={32}
      typographyVariant="bodyMd"
      fontWeight={600}
      emphasizeLink={Boolean(teacherId)}
    />
  );
}
