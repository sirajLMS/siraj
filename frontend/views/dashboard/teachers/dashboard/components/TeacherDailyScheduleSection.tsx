"use client";

import { Box, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import { DateNavigator, SectionPanel } from "@/frontend/components/ui";
import type { ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import type { TeacherScheduleRow } from "@/frontend/stores/teacherDashboardTypes";
import type { TeacherDashboardLabels } from "../types/teacherDashboardLabels";
import { TeacherScheduleDataGrid } from "./TeacherScheduleDataGrid";

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

interface TeacherDailyScheduleSectionProps {
  readonly title: string;
  readonly dateValue: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly dateLabel: string;
  readonly onDateChange: (date: string) => void;
  readonly rows: readonly TeacherScheduleRow[];
  readonly labels: TeacherDashboardLabels;
  readonly instanceStatusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly canActivate: boolean;
  readonly loading?: boolean;
  readonly emptyMessage: string;
  readonly onJoinVideo: (id: string) => void;
  readonly onActivate?: (id: string) => void;
  readonly onStartSession?: (id: string) => void;
  readonly onMarkAbsent?: (id: string) => void;
  readonly onRequestLeave?: (id: string) => void;
  readonly page?: number;
  readonly pageSize?: number;
  readonly totalCount?: number;
  readonly onPageChange?: (page: number) => void;
}

export function TeacherDailyScheduleSection({
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
  onJoinVideo,
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
      <SectionPanel title={title}>
        <StyledFilterContainer>
          <DateNavigator
            dateValue={dateValue}
            todayLabel={todayLabel}
            previousDayLabel={previousDayLabel}
            nextDayLabel={nextDayLabel}
            dateLabel={dateLabel}
            onDateChange={onDateChange}
          />
        </StyledFilterContainer>

        <TeacherScheduleDataGrid
          rows={rows}
          labels={labels}
          instanceStatusLabels={instanceStatusLabels}
          canActivate={canActivate}
          emptyMessage={emptyMessage}
          onJoinVideo={onJoinVideo}
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
      </SectionPanel>
    </StyledDesktopPanel>
  );
}
