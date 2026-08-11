"use client";

import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import { JumpToDateHeaderShared } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/jumpToDateHeaderShared";
import type { JumpToDateHeaderProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";

export function JumpToDateHeaderDesktop({
  leaveQuotaUsed,
  leaveQuotaTotal,
  totalClasses,
  selectedDate,
  onDateChange,
  labels,
}: Readonly<JumpToDateHeaderProps>) {
  return (
    <JumpToDateHeaderShared
      leaveQuotaUsed={leaveQuotaUsed}
      leaveQuotaTotal={leaveQuotaTotal}
      totalClasses={totalClasses}
      selectedDate={selectedDate}
      onDateChange={onDateChange}
      labels={labels}
      CardComponent={BaseCard}
    />
  );
}
