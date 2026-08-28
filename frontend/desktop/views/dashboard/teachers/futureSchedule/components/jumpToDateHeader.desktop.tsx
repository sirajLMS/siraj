"use client";

import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import { JumpToDateHeaderShared } from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/jumpToDateHeaderShared";
import type { JumpToDateHeaderProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui";

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
      renderMetricsGrid={({ metrics }) => <DesktopMetricCardGrid metrics={metrics} size={{ xs: 12, sm: 6 }} />}
    />
  );
}
