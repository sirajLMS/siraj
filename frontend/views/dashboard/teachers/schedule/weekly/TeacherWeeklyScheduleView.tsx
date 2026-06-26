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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { MetricCard, PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import MobileScheduleList from "./MobileScheduleList";
import WeeklyScheduleGrid, { type ScheduledClass } from "./WeeklyScheduleGrid";

export interface TeacherWeeklySchedule {
  readonly teacherId: string;
  readonly teacherName: string;
  readonly weeklyHoursWorked: string;
  readonly classes: readonly ScheduledClass[];
  readonly lastUpdated: string;
}

interface TeacherWeeklyScheduleViewProps {
  readonly schedule: TeacherWeeklySchedule | null;
  readonly onRemoveClass: (id: string) => void;
  readonly onClearSchedule?: () => void;
  readonly onAddClass?: () => void;
}

interface ScheduleFooterLegendProps {
  readonly bookedClassLabel: string;
  readonly availableSlotLabel: string;
  readonly lastUpdatedText: string;
}

export function ScheduleFooterLegend({
  bookedClassLabel,
  availableSlotLabel,
  lastUpdatedText,
}: Readonly<ScheduleFooterLegendProps>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "center" },
        gap: 2,
        mt: 2,
      }}
    >
      <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Box
            sx={theme => ({
              width: 12,
              height: 12,
              backgroundColor: theme.palette.primary.main,
              borderRadius: 0.5,
            })}
          />
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
            {bookedClassLabel}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Box
            sx={theme => ({
              width: 12,
              height: 12,
              border: `1px solid ${theme.palette.border.light}`,
              borderRadius: 0.5,
            })}
          />
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
            {availableSlotLabel}
          </Typography>
        </Stack>
      </Stack>
      <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled })}>
        {lastUpdatedText}
      </Typography>
    </Box>
  );
}

export default function TeacherWeeklyScheduleView({
  schedule,
  onRemoveClass,
  onClearSchedule,
  onAddClass,
}: Readonly<TeacherWeeklyScheduleViewProps>) {
  const t = useTranslations("dashboard.teacherWeeklySchedule");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  if (!schedule) return null;

  const handleClearClick = () => {
    setClearDialogOpen(true);
  };

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
          !isMobile && (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <RequirePermission permissions={[AppPermission.ScheduleCreateClass]}>
                <PrimaryPageAction startIcon={<AddOutlined />} onClick={onAddClass}>
                  {t("actions.addSlot")}
                </PrimaryPageAction>
              </RequirePermission>
              <RequirePermission permissions={[AppPermission.ScheduleClearWeekly]}>
                <IconButton
                  onClick={handleClearClick}
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
          )
        }
      />

      {/* Metrics */}
      <RequirePermission permissions={[AppPermission.ScheduleViewWorkload]}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
          <MetricCard
            icon={TimerOutlined}
            label={t("metrics.weeklyHoursWorked")}
            value={schedule.weeklyHoursWorked}
            variant="default"
          />
        </Box>
      </RequirePermission>

      {/* Mobile Actions */}
      {isMobile && (
        <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
          <Box sx={{ flex: 1 }}>
            <RequirePermission permissions={[AppPermission.ScheduleCreateClass]}>
              <PrimaryPageAction startIcon={<AddOutlined />} onClick={onAddClass} sx={{ width: "100%", py: 1.5 }}>
                {t("actions.addSlot")}
              </PrimaryPageAction>
            </RequirePermission>
          </Box>
          <RequirePermission permissions={[AppPermission.ScheduleClearWeekly]}>
            <IconButton
              onClick={handleClearClick}
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
          </RequirePermission>
        </Stack>
      )}

      {/* Schedule Content */}
      <SectionPanel>
        {isMobile ? (
          <MobileScheduleList classes={schedule.classes} onRemoveClass={onRemoveClass} />
        ) : (
          <WeeklyScheduleGrid classes={schedule.classes} onRemoveClass={onRemoveClass} />
        )}
      </SectionPanel>

      {/* Footer Legend */}
      <ScheduleFooterLegend
        bookedClassLabel={t("grid.bookedClass")}
        availableSlotLabel={t("grid.availableSlot")}
        lastUpdatedText={t("grid.lastUpdated", { time: schedule.lastUpdated })}
      />

      {/* Clear Schedule Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onClose={handleCancelClear}>
        <DialogTitle>{t("dialogs.clearScheduleTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("dialogs.clearScheduleMessage")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelClear}>{t("dialogs.cancel")}</Button>
          <Button onClick={handleConfirmClear} color="error" variant="contained" autoFocus>
            {t("dialogs.confirmYes")}
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
}
