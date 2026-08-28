"use client";

import { Box } from "@mui/material";
import type { TeacherDailyScheduleSectionProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { DesktopSectionPanel, desktopSectionContentInsetSx } from "@/frontend/desktop/components/ui/container";
import { DateNavigatorDesktop } from "@/frontend/desktop/components/ui/filter";
import { TeacherScheduleDataGridDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleDataGrid.desktop";

/**
 * Desktop variant of the daily schedule section.
 * A single `DesktopSectionPanel` owns the section chrome: the desktop date
 * navigator sits in an inset row above the flush schedule data grid.
 *
 * Plan v5: per specs.md §4.1, the inline `TeacherDailyScheduleSectionDesktopProps`
 * interface was lifted to `frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps.ts`
 * (renamed without the `Desktop` suffix since the component is single-tier
 * desktop-only and the contract lives once in common).
 */
export function TeacherDailyScheduleSectionDesktop({
  title,
  dateValue,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  dateLabel,
  onDateChange,
  rows,
  labels,
  instanceStatusLabels,
  canActivate,
  loading,
  emptyMessage,
  onActivate,
  onStartSession,
  onMarkAbsent,
  onRequestLeave,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Readonly<TeacherDailyScheduleSectionProps>) {
  return (
    <DesktopSectionPanel contentPadding={false} title={title}>
      <Box sx={desktopSectionContentInsetSx}>
        <DateNavigatorDesktop
          dateValue={dateValue}
          todayLabel={todayLabel}
          previousDayLabel={previousDayLabel}
          nextDayLabel={nextDayLabel}
          dateLabel={dateLabel}
          onDateChange={onDateChange}
        />
      </Box>

      <TeacherScheduleDataGridDesktop
        rows={rows}
        labels={labels}
        instanceStatusLabels={instanceStatusLabels}
        canActivate={canActivate}
        emptyMessage={emptyMessage}
        onActivate={onActivate}
        onStartSession={onStartSession}
        onMarkAbsent={onMarkAbsent}
        onRequestLeave={onRequestLeave}
        loading={loading}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={onPageChange}
      />
    </DesktopSectionPanel>
  );
}
