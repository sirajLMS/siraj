"use client";

import { Box, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { TeacherScheduleRow } from "@/frontend/common/stores/teacherDashboardTypes";
import type { TeacherDashboardViewLabels } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardLabels";
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

interface TeacherDailyScheduleSectionDesktopProps {
  readonly title: string;
  readonly dateValue: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly dateLabel: string;
  readonly onDateChange: (date: string) => void;
  readonly rows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardViewLabels;
  readonly instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly canActivate: boolean;
  readonly loading?: boolean;
  readonly emptyMessage: string;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

/**
 * Desktop variant of the daily schedule section.
 * Wraps the desktop-only schedule data grid with the desktop filter bar
 * (DateNavigator) and a styled panel chrome.
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
}: Readonly<TeacherDailyScheduleSectionDesktopProps>) {
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
