"use client";

import { AddOutlined, DeleteOutlined, TimerOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui/container";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type { TeacherWeeklyScheduleViewProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import WeeklyScheduleGrid from "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/weeklyScheduleGrid.desktop";
import { useAppTranslation } from "@/shared/locale";

type ScheduleLabels = ReturnType<typeof useAppTranslation>["dashboardTranslations"]["teacherWeeklySchedule"];
type Schedule = NonNullable<TeacherWeeklyScheduleViewProps["schedule"]>;

function ScheduleHeaderActions({
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

function ScheduleWorkloadMetrics({ labels, schedule }: Readonly<{ labels: ScheduleLabels; schedule: Schedule }>) {
  return (
    <DesktopMetricCardGrid
      metrics={
        [
          {
            key: "weekly-hours-worked",
            count: schedule.weeklyHoursWorked,
            labelKey: "weekly-hours-worked",
            label: labels.metrics.weeklyHoursWorked(schedule.weeklyHoursWorked),
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

function ScheduleLegend({ labels, schedule }: Readonly<{ labels: ScheduleLabels; schedule: Schedule }>) {
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
      <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled })}>
        {labels.grid.lastUpdated(schedule.lastUpdated)}
      </Typography>
    </Box>
  );
}

function ClearScheduleDialog({
  labels,
  open,
  onCancel,
  onConfirm,
}: Readonly<{ labels: ScheduleLabels; open: boolean; onCancel: () => void; onConfirm: () => void }>) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{labels.dialogs.clearScheduleTitle}</DialogTitle>
      <DialogContent>
        <DialogContentText>{labels.dialogs.clearScheduleMessage}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{labels.dialogs.cancel}</Button>
        <Button onClick={onConfirm} color="error" variant="contained" autoFocus>
          {labels.actions.clearSchedule}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function TeacherWeeklyScheduleViewDesktop({
  schedule,
  onRemoveClass,
  onClearSchedule,
  onAddClass,
  hasScheduleCreateClass,
  hasScheduleClearWeekly,
  hasScheduleViewWorkload,
  hasScheduleDeleteClass,
}: Readonly<TeacherWeeklyScheduleViewProps>) {
  const t = useAppTranslation().dashboardTranslations.teacherWeeklySchedule;
  const clearDialogOpen = useWeeklyScheduleStore(state => state.clearDialogOpen);
  const setClearDialogOpen = useWeeklyScheduleStore(state => state.setClearDialogOpen);

  if (!schedule) return null;

  const handleConfirmClear = () => {
    setClearDialogOpen(false);
    onClearSchedule?.();
  };

  const handleCancelClear = () => {
    setClearDialogOpen(false);
  };

  const breadcrumbs = [{ label: t.breadcrumbs.teachers, href: "/teachers" }, { label: t.breadcrumbs.schedule }];

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.pageTitle(schedule.teacherName)}
        breadcrumbs={breadcrumbs}
        actions={
          <ScheduleHeaderActions
            labels={t}
            hasScheduleCreateClass={hasScheduleCreateClass}
            hasScheduleClearWeekly={hasScheduleClearWeekly}
            onAddClass={onAddClass}
            onOpenClearDialog={() => setClearDialogOpen(true)}
          />
        }
      />

      {hasScheduleViewWorkload ? <ScheduleWorkloadMetrics labels={t} schedule={schedule} /> : null}

      <SectionPanel>
        <WeeklyScheduleGrid
          classes={schedule.classes}
          onRemoveClass={onRemoveClass}
          hasScheduleDeleteClass={hasScheduleDeleteClass}
        />
      </SectionPanel>

      <ScheduleLegend labels={t} schedule={schedule} />

      <ClearScheduleDialog
        labels={t}
        open={clearDialogOpen}
        onCancel={handleCancelClear}
        onConfirm={handleConfirmClear}
      />
    </DesktopPageContainer>
  );
}

export default TeacherWeeklyScheduleViewDesktop;
