"use client";

import { useTeacherScheduleStore } from "@/frontend/stores/mockTeacherScheduleStore";
import { FutureScheduleView } from "./FutureScheduleView";

export function FutureScheduleContainer() {
  const { futureSchedule } = useTeacherScheduleStore();

  if (!futureSchedule) return null;

  return (
    <FutureScheduleView
      classes={futureSchedule.classes}
      leaveQuotaUsed={futureSchedule.leaveQuotaUsed}
      leaveQuotaTotal={futureSchedule.leaveQuotaTotal}
      totalClasses={futureSchedule.totalClasses}
    />
  );
}
