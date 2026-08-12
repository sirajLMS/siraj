"use client";

import type { TeacherActiveSessionControlsSharedOptions } from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/teacherActiveSessionControlsShared";
import { TeacherActiveSessionControlsShared } from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/teacherActiveSessionControlsShared";
import type { TeacherActiveSessionControlsProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

const MOBILE_OPTIONS: TeacherActiveSessionControlsSharedOptions = {
  buttonSize: 40,
  iconFontSize: undefined,
} as const;

/**
 * Mobile variant of the active-session controls row.
 * 40×40 touch targets with default-size icons.
 */
export function TeacherActiveSessionControlsMobile(props: Readonly<TeacherActiveSessionControlsProps>) {
  return <TeacherActiveSessionControlsShared {...props} options={MOBILE_OPTIONS} />;
}
