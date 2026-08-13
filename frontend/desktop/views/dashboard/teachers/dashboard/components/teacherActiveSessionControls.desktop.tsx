"use client";

import {
  TeacherActiveSessionControlsShared,
  type TeacherActiveSessionControlsSharedOptions,
} from "@/frontend/common/views/dashboard/teachers/dashboard/components/__shared__/teacherActiveSessionControlsShared";
import type { TeacherActiveSessionControlsProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

const DESKTOP_OPTIONS: TeacherActiveSessionControlsSharedOptions = {
  buttonSize: 32,
  iconFontSize: "small",
} as const;

/**
 * Desktop variant of the active-session controls row.
 * 32×32 buttons with small icons — denser desktop layout.
 */
export function TeacherActiveSessionControlsDesktop(props: Readonly<TeacherActiveSessionControlsProps>) {
  return <TeacherActiveSessionControlsShared {...props} options={DESKTOP_OPTIONS} />;
}
