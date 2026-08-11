"use client";

import { edgeToEdgeCardShellSx } from "@/frontend/common/utils/sx/edgeToEdgeSx";
import { TeacherAvailabilityGridShared } from "@/frontend/common/views/dashboard/search-schedule/components/teacherAvailabilityGridShared";
import type { TeacherAvailabilityGridProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { TeacherAvailabilityDayPillMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/teacherAvailabilityDayPill.mobile";

export function TeacherAvailabilityGridMobile(props: Readonly<TeacherAvailabilityGridProps>) {
  return (
    <TeacherAvailabilityGridShared
      {...props}
      DayPillComponent={TeacherAvailabilityDayPillMobile}
      cardShellExtraSx={edgeToEdgeCardShellSx}
      scrollRowVariant="mobile"
    />
  );
}
