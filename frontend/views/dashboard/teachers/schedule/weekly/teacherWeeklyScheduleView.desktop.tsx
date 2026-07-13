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
} from "@mui/material";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { MetricCard } from "@/frontend/components/ui/card/MetricCard";
import { PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui/container";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useWeeklyScheduleStore } from "@/frontend/common/stores/weeklyScheduleStore";
import { ScheduleFooterLegend } from "@/frontend/views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleView";
import type { TeacherWeeklyScheduleViewProps } from "@/frontend/views/dashboard/teachers/schedule/weekly/types";
import WeeklyScheduleGrid from "@/frontend/views/dashboard/teachers/schedule/weekly/WeeklyScheduleGrid";

export function TeacherWeeklyScheduleViewDesktop({
  schedule,
  onRemoveClass,
  onClearSchedule,
  onAddClass,
}: Readonly<TeacherWeeklyScheduleViewProps>) {
  const t = useTranslations("dashboard.teacherWeeklySchedule");
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

  const breadcrumbs = [{ label: t("breadcrumbs.teachers"), href: "/teachers" }, { label: t("breadcrumbs.schedule") }];

  return (
    <PageContainer>
      <PageHeader
        title={t("pageTitle", { name: schedule.teacherName })}
        breadcrumbs={breadcrumbs}
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <RequirePermission permissions={[AppPermission.ScheduleCreateClass]}>
              <PrimaryPageAction startIcon={<AddOutlined />} onClick={onAddClass}>
                {t("actions.addSlot")}
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
            label={t("metrics.weeklyHoursWorked")}
            value={schedule.weeklyHoursWorked}
            variant="default"
          />
        </Box>
      </RequirePermission>

      <SectionPanel>
        <WeeklyScheduleGrid classes={schedule.classes} onRemoveClass={onRemoveClass} />
      </SectionPanel>

      <ScheduleFooterLegend
        bookedClassLabel={t("grid.bookedClass")}
        availableSlotLabel={t("grid.availableSlot")}
        lastUpdatedText={t("grid.lastUpdated", { time: schedule.lastUpdated })}
      />

      <Dialog open={clearDialogOpen} onClose={handleCancelClear}>
        <DialogTitle>{t("dialogs.clearScheduleTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("dialogs.clearScheduleMessage")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClear}>{t("dialogs.cancel")}</Button>
          <Button onClick={handleConfirmClear} color="error" variant="contained" autoFocus>
            {t("actions.clear")}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
