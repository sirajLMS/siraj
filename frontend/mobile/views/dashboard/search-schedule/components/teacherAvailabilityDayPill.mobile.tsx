"use client";

import { TeacherAvailabilityDayPillShared } from "@/frontend/common/views/dashboard/search-schedule/components/teacherAvailabilityDayPillShared";
import type { TeacherAvailabilityDayPillProps } from "@/frontend/common/views/dashboard/search-schedule/types";

export function TeacherAvailabilityDayPillMobile(props: Readonly<TeacherAvailabilityDayPillProps>) {
  return <TeacherAvailabilityDayPillShared {...props} />;
}
