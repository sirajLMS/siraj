"use client";

import { AddOutlined, DeleteOutlined, TimerOutlined } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
} from "@mui/material";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import type { MetricItem } from "@/frontend/common/views/dashboard/types/dashboard";
import type { TeacherWeeklyScheduleViewProps } from "@/frontend/common/views/dashboard/teachers/schedule/weekly/types";
import { MobilePrimaryPageAction } from "@/frontend/mobile/components/ui/button";
import { MobileMetricCardGrid } from "@/frontend/mobile/components/ui/card";
import { MobileSectionPanel } from "@/frontend/mobile/components/ui/container";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui/container/page";
import MobileScheduleList from "@/frontend/mobile/views/dashboard/teachers/schedule/weekly/mobileScheduleList.mobile";
import { useAppTranslation } from "@/shared/locale";

export function TeacherWeeklyScheduleViewMobile({
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

  const workloadMetrics: readonly MetricItem[] = [
    {
      key: "weeklyHoursWorked",
      label: t.metrics.weeklyHoursWorked(Number(schedule.weeklyHoursWorked)),
      count: schedule.weeklyHoursWorked,
      icon: TimerOutlined,
      labelKey: "weeklyHoursWorked",
      variant: "default",
    },
  ];

  return (
    <MobilePageContainer>
      <MobilePageHeader
        title={t.pageTitle(schedule.teacherName)}
        breadcrumbs={breadcrumbs}
        edgeToEdge={false}
        actions={
          <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
            <Stack sx={{ flex: 1 }}>
              {hasScheduleCreateClass ? (
                <MobilePrimaryPageAction
                  startIcon={<AddOutlined />}
                  onClick={onAddClass}
                  sx={{ width: "100%", py: 1.5 }}
                >
                  {t.actions.addSlot}
                </MobilePrimaryPageAction>
              ) : null}
            </Stack>
            {hasScheduleClearWeekly ? (
              <IconButton
                onClick={() => setClearDialogOpen(true)}
                sx={theme => ({
                  backgroundColor: theme.palette.error.main,
                  color: theme.palette.onError,
                  borderRadius: 2,
                  px: 4,
                  "&:hover": { backgroundColor: theme.palette.error.dark },
                })}
              >
                <DeleteOutlined />
              </IconButton>
            ) : null}
          </Stack>
        }
      />

      {hasScheduleViewWorkload ? <MobileMetricCardGrid metrics={workloadMetrics} /> : null}

      <MobileSectionPanel>
        <MobileScheduleList
          classes={schedule.classes}
          onRemoveClass={onRemoveClass}
          hasScheduleDeleteClass={hasScheduleDeleteClass}
        />
      </MobileSectionPanel>

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
    </MobilePageContainer>
  );
}

export default TeacherWeeklyScheduleViewMobile;
