"use client";

import { AddOutlined, DeleteOutlined, TimerOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useTranslations } from "next-intl";
import { MetricCard, PageContainer, PageHeader, PrimaryPageAction, SectionPanel } from "@/frontend/components/ui";
import type { TeacherWeeklySchedule } from "@/frontend/stores/mockTeacherScheduleStore";
import MobileScheduleList from "./MobileScheduleList";
import WeeklyScheduleGrid from "./WeeklyScheduleGrid";

interface TeacherWeeklyScheduleViewProps {
  readonly schedule: TeacherWeeklySchedule | null;
  readonly onRemoveClass: (id: string) => void;
}

export default function TeacherWeeklyScheduleView({
  schedule,
  onRemoveClass,
}: Readonly<TeacherWeeklyScheduleViewProps>) {
  const t = useTranslations("dashboard.teacherWeeklySchedule");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (!schedule) return null;

  const breadcrumbs = [{ label: t("breadcrumbs.teachers"), href: "/teachers" }, { label: t("breadcrumbs.schedule") }];

  return (
    <PageContainer>
      <PageHeader
        title={t("pageTitle", { name: schedule.teacherName })}
        breadcrumbs={breadcrumbs}
        actions={
          !isMobile && (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <PrimaryPageAction startIcon={<AddOutlined />} onClick={() => {}}>
                {t("actions.addSlot")}
              </PrimaryPageAction>
              <IconButton
                sx={theme => ({
                  bgcolor: theme.palette.error.main,
                  color: theme.palette.onError,
                  borderRadius: 2,
                  "&:hover": { bgcolor: theme.palette.error.dark },
                })}
              >
                <DeleteOutlined />
              </IconButton>
            </Stack>
          )
        }
      />

      {/* Metrics */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <MetricCard
          icon={TimerOutlined}
          label={t("metrics.weeklyHoursWorked")}
          value={schedule.weeklyHoursWorked}
          variant="default"
        />
      </Box>

      {/* Mobile Actions */}
      {isMobile && (
        <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: "center" }}>
          <PrimaryPageAction startIcon={<AddOutlined />} onClick={() => {}} sx={{ flex: 1, py: 1.5 }}>
            {t("actions.addSlot")}
          </PrimaryPageAction>
          <IconButton
            sx={theme => ({
              bgcolor: theme.palette.error.main,
              color: theme.palette.onError,
              borderRadius: 2,
              px: 4,
              "&:hover": { bgcolor: theme.palette.error.dark },
            })}
          >
            <DeleteOutlined />
          </IconButton>
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
                bgcolor: theme.palette.primary.main,
                borderRadius: 0.5,
              })}
            />
            <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.text.secondary })}>
              {t("grid.bookedClass")}
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
              {t("grid.availableSlot")}
            </Typography>
          </Stack>
        </Stack>
        <Typography variant="caption" sx={theme => ({ color: theme.palette.text.disabled })}>
          {t("grid.lastUpdated", { time: schedule.lastUpdated })}
        </Typography>
      </Box>
    </PageContainer>
  );
}
