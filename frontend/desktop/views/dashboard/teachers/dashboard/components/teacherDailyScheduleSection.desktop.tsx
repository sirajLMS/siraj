"use client";

import { Box, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { TeacherDailyScheduleSectionProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container";
import { DateNavigatorDesktop } from "@/frontend/desktop/components/ui/filter";
import { TeacherScheduleDataGridDesktop } from "@/frontend/desktop/views/dashboard/teachers/dashboard/components/teacherScheduleDataGrid.desktop";

const StyledDesktopPanel = styled(Paper)(({ theme }) => ({
  borderRadius: Number(theme.shape.borderRadius) * 2,
  border: `1px solid ${theme.palette.border.light}`,
  overflow: "hidden",
}));

const StyledFilterContainer = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(2.5),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.border.light}`,
}));

/**
 * Desktop variant of the daily schedule section.
 * Wraps the desktop-only schedule data grid with the desktop filter bar
 * (DateNavigator) and a styled panel chrome.
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
    <StyledDesktopPanel elevation={0}>
      <DesktopSectionPanel title={title}>
        <StyledFilterContainer>
          <DateNavigatorDesktop
            dateValue={dateValue}
            todayLabel={todayLabel}
            previousDayLabel={previousDayLabel}
            nextDayLabel={nextDayLabel}
            dateLabel={dateLabel}
            onDateChange={onDateChange}
          />
        </StyledFilterContainer>

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
    </StyledDesktopPanel>
  );
}
