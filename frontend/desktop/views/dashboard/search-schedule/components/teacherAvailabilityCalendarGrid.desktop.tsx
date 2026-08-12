"use client";

import { TeacherAvailabilityCalendarGridShared } from "@/frontend/common/views/dashboard/search-schedule/components/teacherAvailabilityCalendarGridShared";
import type { TeacherAvailabilityCalendarGridProps } from "@/frontend/common/views/dashboard/search-schedule/types";

export function TeacherAvailabilityCalendarGridDesktop(props: Readonly<TeacherAvailabilityCalendarGridProps>) {
  return <TeacherAvailabilityCalendarGridShared {...props} />;
}
