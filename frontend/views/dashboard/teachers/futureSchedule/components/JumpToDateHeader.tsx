"use client";

import { CalendarTodayOutlined, ChevronLeftOutlined, ChevronRightOutlined } from "@mui/icons-material";
import { alpha, Box, IconButton, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { BaseCard } from "@/frontend/components/ui/BaseCard";

interface JumpToDateHeaderProps {
  readonly leaveQuotaUsed: number;
  readonly leaveQuotaTotal: number;
  readonly totalClasses: number;
}

export function JumpToDateHeader({ leaveQuotaUsed, leaveQuotaTotal, totalClasses }: Readonly<JumpToDateHeaderProps>) {
  const t = useTranslations("dashboard.teacherFutureSchedule");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

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
                bgcolor: theme.palette.surfaceContainerLow,
                border: `1px solid ${theme.palette.outlineVariant}`,
                borderRadius: 2,
                cursor: "pointer",
              })}
            >
              <CalendarTodayOutlined sx={theme => ({ color: theme.palette.primary.main })} fontSize="small" />
              <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
                October 24, 2023
              </Typography>
            </Box>
            <IconButton
              size="small"
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
          {/* Leave Quota Stat */}
          <Box
            sx={theme => ({
              p: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
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

          {/* Total Classes Stat */}
          <Box
            sx={theme => ({
              p: 2,
              bgcolor: alpha(theme.palette.header, 0.08),
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
