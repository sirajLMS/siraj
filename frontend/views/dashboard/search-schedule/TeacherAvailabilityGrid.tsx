"use client";

import { Box, Chip, Paper, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type { SearchScheduleResultItem } from "./SearchScheduleView";

interface TeacherAvailabilityGridProps {
  readonly teacher: SearchScheduleResultItem;
}

export function TeacherAvailabilityGrid({ teacher }: Readonly<TeacherAvailabilityGridProps>) {
  const t = useTranslations("dashboard.searchSchedule");

  const gaps = teacher.gaps ?? [];
  const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

  // Filter out any null/undefined gaps and map them by day
  const gapsByDay = new Map<string, typeof gaps>();
  for (const gap of gaps) {
    if (!gap?.dayOfWeek) continue;
    const existing = gapsByDay.get(gap.dayOfWeek) ?? [];
    gapsByDay.set(gap.dayOfWeek, [...existing, gap]);
  }

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.outlineVariant}`,
        bgcolor: theme.palette.surface,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {teacher.name ?? ""}
        </Typography>
        {teacher.gender && (
          <Chip label={teacher.gender === "MALE" ? t("male") : t("female")} size="small" variant="outlined" />
        )}
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          ({teacher.timezone ?? ""})
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(7, 1fr)" },
          gap: 1.5,
        }}
      >
        {DAYS_OF_WEEK.map(day => {
          const dayGaps = gapsByDay.get(day) ?? [];
          return (
            <Box
              key={day}
              sx={theme => ({
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: dayGaps.length > 0 ? theme.palette.primaryContainer : theme.palette.surfaceContainerLow,
                border: `1px solid ${dayGaps.length > 0 ? theme.palette.primaryContainer : theme.palette.outlineVariant}`,
                minHeight: 100,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              })}
            >
              <Typography
                variant="labelUppercase"
                sx={theme => ({
                  color: dayGaps.length > 0 ? theme.palette.onPrimaryContainer : theme.palette.text.secondary,
                  fontWeight: 700,
                  display: "block",
                })}
              >
                {t(`day.${day.toLowerCase()}`)}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {dayGaps.map(gap => {
                  if (!gap) return null;
                  return (
                    <Box
                      key={gap.id ?? ""}
                      sx={theme => ({
                        bgcolor: theme.palette.primary.main,
                        color: theme.palette.onPrimary,
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textAlign: "center",
                      })}
                    >
                      {gap.gapStartTime ?? ""} - {gap.gapEndTime ?? ""}
                    </Box>
                  );
                })}
              </Box>
              {dayGaps.length === 0 && (
                <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary, mt: "auto" })}>
                  —
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
