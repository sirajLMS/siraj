"use client";

import { TeacherAvailabilityGridShared } from "@/frontend/common/views/dashboard/search-schedule/components/teacherAvailabilityGridShared";
import type { TeacherAvailabilityGridProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { TeacherAvailabilityDayPillDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/teacherAvailabilityDayPill.desktop";

export function TeacherAvailabilityGridDesktop(props: Readonly<TeacherAvailabilityGridProps>) {
  return (
    <TeacherAvailabilityGridShared
      {...props}
      DayPillComponent={TeacherAvailabilityDayPillDesktop}
      scrollRowVariant="desktop"
    />
  );
}
