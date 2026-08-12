"use client";

import { AddOutlined, DeleteOutlined, TimerOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { PrimaryPageAction } from "@/frontend/common/components/ui";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  ClearScheduleDialogShared,
  ScheduleLastUpdatedShared,
  TeacherWeeklyScheduleViewShared,
  type TeacherWeeklyScheduleViewSharedSlots,
} from "@/frontend/common/views/dashboard/teachers/schedule/weekly/__shared__/teacherWeeklyScheduleViewShared";
import type { TeacherWeeklyScheduleViewProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import WeeklyScheduleGrid from "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/weeklyScheduleGrid.desktop";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";

type ScheduleLabels = TeacherWeeklyScheduleLabels;
type Schedule = NonNullable<TeacherWeeklyScheduleViewProps["schedule"]>;

function DesktopHeaderActions({
  labels,
  hasScheduleCreateClass,
  hasScheduleClearWeekly,
  onAddClass,
  onOpenClearDialog,
}: Readonly<{
  labels: ScheduleLabels;
  hasScheduleCreateClass: boolean;
  hasScheduleClearWeekly: boolean;
  onAddClass: TeacherWeeklyScheduleViewProps["onAddClass"];
  onOpenClearDialog: () => void;
}>) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      {hasScheduleCreateClass ? (
        <PrimaryPageAction startIcon={<AddOutlined />} onClick={onAddClass}>
          {labels.actions.addSlot}
        </PrimaryPageAction>
      ) : null}
      {hasScheduleClearWeekly ? (
        <IconButton
          onClick={onOpenClearDialog}
          sx={theme => ({
            backgroundColor: theme.palette.error.main,
            color: theme.palette.onError,
            borderRadius: 2,
            "&:hover": { backgroundColor: theme.palette.error.dark },
          })}
        >
          <DeleteOutlined />
        </IconButton>
      ) : null}
    </Stack>
  );
}

function DesktopWorkloadMetrics({ labels, schedule }: Readonly<{ labels: ScheduleLabels; schedule: Schedule }>) {
  return (
    <DesktopMetricCardGrid
      metrics={
        [
          {
            key: "weekly-hours-worked",
            count: schedule.weeklyHoursWorked,
            labelKey: "weekly-hours-worked",
            label: labels.metrics.weeklyHoursWorkedTitle,
            icon: TimerOutlined,
          },
        ] satisfies MetricItem[]
      }
      size={{ xs: 12, md: 3 }}
    />
  );
}

function LegendSwatch({ variant, labels }: Readonly<{ variant: "booked" | "available"; labels: ScheduleLabels }>) {
  const text = variant === "booked" ? labels.grid.bookedClass : labels.grid.availableSlot;
  return (
    <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center" }}>
      <Box
        sx={theme =>
          variant === "booked"
            ? {
                width: 12,
                height: 12,
                backgroundColor: theme.palette.primary.main,
                borderRadius: 0.5,
              }
            : {
                width: 12,
                height: 12,
                border: `1px solid ${theme.palette.border.light}`,
                borderRadius: 0.5,
              }
        }
      />
      <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
        {text}
      </Typography>
    </Box>
  );
}

function DesktopLegendBar({ labels, schedule }: Readonly<{ labels: ScheduleLabels; schedule: Schedule }>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        mt: 2,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "row", gap: 3, alignItems: "center" }}>
        <LegendSwatch variant="booked" labels={labels} />
        <LegendSwatch variant="available" labels={labels} />
      </Box>
      <ScheduleLastUpdatedShared labels={labels} schedule={schedule} />
    </Box>
  );
}

const DESKTOP_SLOTS: TeacherWeeklyScheduleViewSharedSlots = {
  PageContainer: DesktopPageContainer,
  PageHeader: DesktopPageHeader,
  HeaderActions: DesktopHeaderActions,
  WorkloadMetrics: DesktopWorkloadMetrics,
  ScheduleGrid: ({ schedule, onRemoveClass, hasScheduleDeleteClass, labels, meetingJoinLabels }) => (
    <WeeklyScheduleGrid
      classes={schedule.classes}
      onRemoveClass={onRemoveClass}
      hasScheduleDeleteClass={hasScheduleDeleteClass}
      labels={labels}
      meetingJoinLabels={meetingJoinLabels}
    />
  ),
  LegendBar: DesktopLegendBar,
};

export function TeacherWeeklyScheduleViewDesktop(props: Readonly<TeacherWeeklyScheduleViewProps>) {
  return <TeacherWeeklyScheduleViewShared {...props} slots={DESKTOP_SLOTS} />;
}

export default TeacherWeeklyScheduleViewDesktop;

// Re-export shared component for potential reuse
export { ClearScheduleDialogShared };
