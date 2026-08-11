"use client";

import { TeacherAvailabilityMonthDrawerShared } from "@/frontend/common/views/dashboard/search-schedule/components/teacherAvailabilityMonthDrawerShared";
import type { TeacherAvailabilityMonthDrawerProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { TeacherAvailabilityCalendarGridMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/teacherAvailabilityCalendarGrid.mobile";

const MOBILE_DRAWER_PAPER_SX = {
  width: "100%",
  maxWidth: "100vw",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
} as const;

export function TeacherAvailabilityMonthDrawerMobile(props: Readonly<TeacherAvailabilityMonthDrawerProps>) {
  return (
    <TeacherAvailabilityMonthDrawerShared
      {...props}
      CalendarGridComponent={TeacherAvailabilityCalendarGridMobile}
      drawerAnchor="bottom"
      drawerPaperSx={MOBILE_DRAWER_PAPER_SX}
    />
  );
}
