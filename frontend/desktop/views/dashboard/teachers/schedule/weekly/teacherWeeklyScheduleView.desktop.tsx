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
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import type { TeacherWeeklyScheduleViewProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import WeeklyScheduleGrid from "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/weeklyScheduleGrid.desktop";
import { useAppTranslation } from "@/shared/locale";

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
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {hasScheduleCreateClass ? (
              <PrimaryPageAction startIcon={<AddOutlined />} onClick={onAddClass}>
                {t.actions.addSlot}
              </PrimaryPageAction>
            ) : null}
            {hasScheduleClearWeekly ? (
              <IconButton
                onClick={() => setClearDialogOpen(true)}
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
        }
      />

      {hasScheduleViewWorkload ? (
        <DesktopMetricCardGrid
          metrics={
            [
              {
                key: "weekly-hours-worked",
                count: schedule.weeklyHoursWorked,
                labelKey: "weekly-hours-worked",
                label: t.metrics.weeklyHoursWorked(schedule.weeklyHoursWorked),
                icon: TimerOutlined,
              },
            ] satisfies MetricItem[]
          }
          size={{ xs: 12, md: 3 }}
        />
      ) : null}

      <SectionPanel>
        <WeeklyScheduleGrid
          classes={schedule.classes}
          onRemoveClass={onRemoveClass}
          hasScheduleDeleteClass={hasScheduleDeleteClass}
        />
      </SectionPanel>

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
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center" }}>
            <Box
              sx={theme => ({
                width: 12,
                height: 12,
                backgroundColor: theme.palette.primary.main,
                borderRadius: 0.5,
              })}
            />
            <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.grid.bookedClass}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", gap: 1, alignItems: "center" }}>
            <Box
              sx={theme => ({
                width: 12,
                height: 12,
                border: `1px solid ${theme.palette.border.light}`,
                borderRadius: 0.5,
              })}
            />
            <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t.grid.availableSlot}
            </Typography>
          </Box>
        </Box>
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled })}>
          {t.grid.lastUpdated(schedule.lastUpdated)}
        </Typography>
      </Box>

      <Dialog open={clearDialogOpen} onClose={handleCancelClear}>
        <DialogTitle>{t.dialogs.clearScheduleTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t.dialogs.clearScheduleMessage}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClear}>{t.dialogs.cancel}</Button>
          <Button onClick={handleConfirmClear} color="error" variant="contained" autoFocus>
            {t.actions.clearSchedule}
          </Button>
        </DialogActions>
      </Dialog>
    </DesktopPageContainer>
  );
}

export default TeacherWeeklyScheduleViewDesktop;
