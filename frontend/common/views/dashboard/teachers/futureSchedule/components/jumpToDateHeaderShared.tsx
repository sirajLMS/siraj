"use client";

import { CalendarTodayOutlined, ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { alpha, Box, IconButton, Stack, type SxProps, type Theme, Typography, useTheme } from "@mui/material";
import type { ComponentType } from "react";
import type { JumpToDateHeaderProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { useAppLocale } from "@/shared/locale";

export type JumpToDateHeaderCardComponent = ComponentType<{
  readonly sx?: object;
  readonly children: React.ReactNode;
}>;

function shiftDate(selectedDate: string, delta: number): string {
  const d = new Date(selectedDate + "T00:00:00");
  d.setDate(d.getDate() + delta);
  return d.toISOString().split("T")[0];
}

function formatDate(selectedDate: string, locale: string): string {
  return new Date(selectedDate + "T00:00:00").toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function DateNavigator({
  selectedDate,
  onDateChange,
  labels,
}: Readonly<Pick<JumpToDateHeaderProps, "selectedDate" | "onDateChange" | "labels">>) {
  const theme = useTheme();
  const locale = useAppLocale();
  const formattedDate = formatDate(selectedDate, locale);

  const navButtonSx: SxProps<Theme> = {
    border: `1px solid ${theme.palette.outlineVariant}`,
    borderRadius: "50%",
    width: 40,
    height: 40,
  };

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <IconButton
        size="small"
        aria-label={labels.ariaLabels.previousDay}
        onClick={() => onDateChange(shiftDate(selectedDate, -1))}
        sx={navButtonSx}
      >
        <ChevronLeftOutlined />
      </IconButton>
      <Box
        sx={muiTheme => ({
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1,
          backgroundColor: muiTheme.palette.surfaceContainerLow,
          border: `1px solid ${muiTheme.palette.outlineVariant}`,
          borderRadius: 2,
          cursor: "pointer",
        })}
      >
        <CalendarTodayOutlined sx={muiTheme => ({ color: muiTheme.palette.primary.main })} fontSize="small" />
        <Typography variant="titleLg" sx={muiTheme => ({ color: muiTheme.palette.primary.main })}>
          {formattedDate}
        </Typography>
      </Box>
      <IconButton
        size="small"
        aria-label={labels.ariaLabels.nextDay}
        onClick={() => onDateChange(shiftDate(selectedDate, 1))}
        sx={navButtonSx}
      >
        <ChevronRightOutlined />
      </IconButton>
    </Stack>
  );
}

function LeaveQuotaStat({
  leaveQuotaUsed,
  leaveQuotaTotal,
  labels,
}: Readonly<Pick<JumpToDateHeaderProps, "leaveQuotaUsed" | "leaveQuotaTotal" | "labels">>) {
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
      <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant, fontWeight: 700 })}>
        {labels.leaveQuotaDesc(leaveQuotaTotal)}
      </Typography>
      <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main, fontWeight: 700 })}>
        {labels.remaining(leaveQuotaTotal - leaveQuotaUsed, leaveQuotaTotal)}
      </Typography>
    </Box>
  );
}

function TotalClassesStat({ totalClasses, labels }: Readonly<Pick<JumpToDateHeaderProps, "totalClasses" | "labels">>) {
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
      <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant, fontWeight: 700 })}>
        {labels.totalClassesDesc(totalClasses)}
      </Typography>
      <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.header, fontWeight: 700 })}>
        {totalClasses} {labels.totalClasses}
      </Typography>
    </Box>
  );
}

export function JumpToDateHeaderShared({
  leaveQuotaUsed,
  leaveQuotaTotal,
  totalClasses,
  selectedDate,
  onDateChange,
  labels,
  CardComponent,
}: Readonly<JumpToDateHeaderProps> & {
  readonly CardComponent: JumpToDateHeaderCardComponent;
}) {
  return (
    <CardComponent sx={{ p: 2 }}>
      <Stack direction="column" spacing={3} sx={{ justifyContent: "space-between" }}>
        <Stack spacing={2}>
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
            {labels.jumpToDate}
          </Typography>
          <DateNavigator selectedDate={selectedDate} onDateChange={onDateChange} labels={labels} />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
          <LeaveQuotaStat leaveQuotaUsed={leaveQuotaUsed} leaveQuotaTotal={leaveQuotaTotal} labels={labels} />
          <TotalClassesStat totalClasses={totalClasses} labels={labels} />
        </Stack>
      </Stack>
    </CardComponent>
  );
}
