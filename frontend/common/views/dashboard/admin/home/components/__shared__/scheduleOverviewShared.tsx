import type * as React from "react";
import type { ScheduleOverviewFilterSectionProps } from "@/frontend/common/views/dashboard/admin/home/components/__shared__/scheduleOverviewShared.options";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";

export function ScheduleOverviewFilterSection({
  filters,
  dateValue,
  onDateChange,
  teacherSelect,
}: Readonly<ScheduleOverviewFilterSectionProps>): React.JSX.Element {
  return (
    <ScheduleFilters
      dateLabel={filters.dateLabel}
      dateValue={dateValue}
      todayLabel={filters.todayLabel}
      previousDayLabel={filters.previousDayLabel}
      nextDayLabel={filters.nextDayLabel}
      onDateChange={onDateChange}
      teacherSelect={teacherSelect}
    />
  );
}
