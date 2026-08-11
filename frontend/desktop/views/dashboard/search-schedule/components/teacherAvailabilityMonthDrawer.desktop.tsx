"use client";

import { TeacherAvailabilityMonthDrawerShared } from "@/frontend/common/views/dashboard/search-schedule/components/teacherAvailabilityMonthDrawerShared";
import type { TeacherAvailabilityMonthDrawerProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { TeacherAvailabilityCalendarGridDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/teacherAvailabilityCalendarGrid.desktop";

const DESKTOP_DRAWER_PAPER_SX = {
  width: 480,
  maxWidth: "100vw",
} as const;

export function TeacherAvailabilityMonthDrawerDesktop(props: Readonly<TeacherAvailabilityMonthDrawerProps>) {
  return (
    <TeacherAvailabilityMonthDrawerShared
      {...props}
      CalendarGridComponent={TeacherAvailabilityCalendarGridDesktop}
      drawerAnchor="right"
      drawerPaperSx={DESKTOP_DRAWER_PAPER_SX}
    />
  );
}
