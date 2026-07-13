"use client";

import { CalendarTodayOutlined, ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { alpha, Box, IconButton, Stack, type SxProps, type Theme, Typography, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard } from "@/frontend/common/components/ui/card/BaseCard";
import type { JumpToDateHeaderProps } from "@/frontend/views/dashboard/teachers/futureSchedule/types";

function shiftDate(selectedDate: string, delta: number): string {
  const d = new Date(selectedDate + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().split("T")[0];
}

function formatDate(selectedDate: string): string {
  return new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function DateNavigator({
  selectedDate,
  onDateChange,
}: Readonly<Pick<JumpToDateHeaderProps, "selectedDate" | "onDateChange">>) {
  const theme = useTheme();
  const formattedDate = formatDate(selectedDate);

  const navButtonSx: SxProps<Theme> = {
    border: `1px solid ${theme.palette.outlineVariant}`,
    borderRadius: "50%",
    width: 40,
    height: 40,
  };

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <IconButton size="small" onClick={() => onDateChange(shiftDate(selectedDate, -1))} sx={navButtonSx}>
        <ChevronLeftOutlined />
      </IconButton>
      <Box
        sx={theme => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1,
          backgroundColor: theme.palette.surfaceContainerLow,
          border: `1px solid ${theme.palette.outlineVariant}`,
          borderRadius: 2,
          cursor: "pointer",
        })}
      >
        <CalendarTodayOutlined sx={theme => ({ color: theme.palette.primary.main })} fontSize="small" />
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {formattedDate}
        </Typography>
      </Box>
      <IconButton size="small" onClick={() => onDateChange(shiftDate(selectedDate, 1))} sx={navButtonSx}>
        <ChevronRightOutlined />
      </IconButton>
    </Stack>
  );
}

function LeaveQuotaStat({
  leaveQuotaUsed,
  leaveQuotaTotal,
}: Readonly<Pick<JumpToDateHeaderProps, "leaveQuotaUsed" | "leaveQuotaTotal">>) {
  const t = useTranslations("dashboard.teacherFutureSchedule");
  return (
    <Box
      sx={theme => ({
        p: 2,
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        borderLeft: `4px solid ${theme.palette.primary.main}`,
        borderRadius: 2,
        flex: 1,
        minWidth: 140,
      })}
    >
      <Typography
        variant="labelUppercase"
        sx={theme => ({ color: theme.palette.onSurfaceVariant, fontWeight: 700, fontSize: 10 })}
      >
        {t("leaveQuotaDesc")}
      </Typography>
      <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
        {t("remaining", { count: leaveQuotaTotal - leaveQuotaUsed, total: leaveQuotaTotal })}
      </Typography>
    </Box>
  );
}

function TotalClassesStat({ totalClasses }: Readonly<Pick<JumpToDateHeaderProps, "totalClasses">>) {
  const t = useTranslations("dashboard.teacherFutureSchedule");
  return (
    <Box
      sx={theme => ({
        p: 2,
        backgroundColor: alpha(theme.palette.header, 0.08),
        borderLeft: `4px solid ${theme.palette.header}`,
        borderRadius: 2,
        flex: 1,
        minWidth: 140,
      })}
    >
      <Typography
        variant="labelUppercase"
        sx={theme => ({ color: theme.palette.onSurfaceVariant, fontWeight: 700, fontSize: 10 })}
      >
        {t("totalClassesDesc")}
      </Typography>
      <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.header, fontWeight: 700 })}>
        {totalClasses} {t("totalClasses")}
      </Typography>
    </Box>
  );
}

export function JumpToDateHeaderMobile({
  leaveQuotaUsed,
  leaveQuotaTotal,
  totalClasses,
  selectedDate,
  onDateChange,
}: Readonly<JumpToDateHeaderProps>) {
  const t = useTranslations("dashboard.teacherFutureSchedule");

  return (
    <BaseCard sx={{ p: 2 }}>
      <Stack direction="column" spacing={3} sx={{ justifyContent: "space-between" }}>
        <Stack spacing={2}>
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
            {t("jumpToDate")}
          </Typography>
          <DateNavigator selectedDate={selectedDate} onDateChange={onDateChange} />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
          <LeaveQuotaStat leaveQuotaUsed={leaveQuotaUsed} leaveQuotaTotal={leaveQuotaTotal} />
          <TotalClassesStat totalClasses={totalClasses} />
        </Stack>
      </Stack>
    </BaseCard>
  );
}
