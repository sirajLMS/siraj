"use client";

import { CalendarTodayOutlined, ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { alpha, Box, IconButton, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard } from "@/frontend/components/ui/BaseCard";
import type { JumpToDateHeaderProps } from "../types";

export function JumpToDateHeader({
  leaveQuotaUsed,
  leaveQuotaTotal,
  totalClasses,
  selectedDate,
  onDateChange,
}: Readonly<JumpToDateHeaderProps>) {
  const t = useTranslations("dashboard.teacherFutureSchedule");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const dateObj = new Date(selectedDate + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrevDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split("T")[0]);
  };

  return (
    <BaseCard sx={{ p: isMobile ? 2 : 3 }}>
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={3}
        sx={{
          justifyContent: "space-between",
        }}
      >
        <Stack spacing={2}>
          <Typography variant="headlineMd" sx={theme => ({ color: theme.palette.primary.main })}>
            {t("jumpToDate")}
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            sx={{
              alignItems: "center",
            }}
          >
            <IconButton
              size="small"
              onClick={handlePrevDay}
              sx={theme => ({
                border: `1px solid ${theme.palette.outlineVariant}`,
                borderRadius: "50%",
                width: 40,
                height: 40,
              })}
            >
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
            <IconButton
              size="small"
              onClick={handleNextDay}
              sx={theme => ({
                border: `1px solid ${theme.palette.outlineVariant}`,
                borderRadius: "50%",
                width: 40,
                height: 40,
              })}
            >
              <ChevronRightOutlined />
            </IconButton>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ width: isMobile ? "100%" : "auto" }}>
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
        </Stack>
      </Stack>
    </BaseCard>
  );
}
