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
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { MetricCard } from "@/frontend/common/components/ui/card/MetricCard";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/common/components/ui/container";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import type { TeacherWeeklyScheduleViewProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import WeeklyScheduleGrid from "@/frontend/desktop/views/dashboard/teachers/schedule/weekly/components/weeklyScheduleGrid.desktop";
import { useAppTranslation } from "@/shared/locale";

export function TeacherWeeklyScheduleViewDesktop({
  schedule,
  onRemoveClass,
  onClearSchedule,
  onAddClass,
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
    <PageContainer>
      <PageHeader
        title={t.pageTitle(schedule.teacherName)}
        breadcrumbs={breadcrumbs}
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <RequirePermission permissions={[AppPermission.ScheduleCreateClass]}>
              <PrimaryPageAction startIcon={<AddOutlined />} onClick={onAddClass}>
                {t.actions.addSlot}
              </PrimaryPageAction>
            </RequirePermission>
            <RequirePermission permissions={[AppPermission.ScheduleClearWeekly]}>
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
            </RequirePermission>
          </Stack>
        }
      />

      <RequirePermission permissions={[AppPermission.ScheduleViewWorkload]}>
        <Box sx={{ display: "grid", gridTemplateColumns: { md: "repeat(4, 1fr)" }, gap: 2 }}>
          <MetricCard
            icon={TimerOutlined}
            label={t.metrics.weeklyHoursWorked(schedule.weeklyHoursWorked)}
            value={schedule.weeklyHoursWorked}
            variant="default"
          />
        </Box>
      </RequirePermission>

      <SectionPanel>
        <WeeklyScheduleGrid classes={schedule.classes} onRemoveClass={onRemoveClass} />
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
    </PageContainer>
  );
}
