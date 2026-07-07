"use client";

import { Box, Chip, Paper, Typography } from "@mui/material";
import { addDays, differenceInCalendarDays, format, parse } from "date-fns";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { SearchScheduleResultItem } from "./SearchScheduleView";

interface TeacherAvailabilityGridProps {
  readonly teacher: SearchScheduleResultItem;
  readonly fromDate: string;
  readonly toDate: string;
}

function buildDateColumns(fromDate: string, toDate: string): string[] {
  const start = parse(fromDate, "yyyy-MM-dd", new Date());
  const end = parse(toDate, "yyyy-MM-dd", new Date());
  const dayCount = differenceInCalendarDays(end, start) + 1;

  return Array.from({ length: dayCount }, (_, index) => format(addDays(start, index), "yyyy-MM-dd"));
}

export function TeacherAvailabilityGrid({ teacher, fromDate, toDate }: Readonly<TeacherAvailabilityGridProps>) {
  const t = useTranslations("dashboard.searchSchedule");

  const dateColumns = useMemo(() => buildDateColumns(fromDate, toDate), [fromDate, toDate]);

  const gapsByDate = useMemo(() => {
    const grouped = new Map<string, NonNullable<SearchScheduleResultItem["gaps"]>>();
    for (const gap of teacher.gaps ?? []) {
      if (!gap?.calendarDate) {
        continue;
      }
      const existing = grouped.get(gap.calendarDate) ?? [];
      grouped.set(gap.calendarDate, [...existing, gap]);
    }
    return grouped;
  }, [teacher.gaps]);

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        p: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surface,
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {teacher.name ?? ""}
        </Typography>
        {teacher.gender && (
          <Chip label={teacher.gender === "MALE" ? t("male") : t("female")} size="small" variant="outlined" />
        )}
        <Chip
          label={t("availableDaysCount", { count: teacher.availableDaysCount ?? 0 })}
          size="small"
          color="primary"
          variant="outlined"
        />
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          ({teacher.timezone ?? ""})
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: `repeat(${Math.min(dateColumns.length, 7)}, minmax(0, 1fr))`,
          },
          gap: 1.5,
          overflowX: { md: dateColumns.length > 7 ? "auto" : "visible" },
        }}
      >
        {dateColumns.map(calendarDate => {
          const dayGaps = gapsByDate.get(calendarDate) ?? [];
          const parsedDate = parse(calendarDate, "yyyy-MM-dd", new Date());
          const dayLabel = format(parsedDate, "EEE d MMM");

          return (
            <Box
              key={calendarDate}
              sx={theme => ({
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor:
                  dayGaps.length > 0 ? theme.palette.primaryContainer : theme.palette.surfaceContainerLow,
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
                {dayLabel}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                {dayGaps.map(gap => {
                  if (!gap) {
                    return null;
                  }
                  return (
                    <Box
                      key={gap.id ?? ""}
                      sx={theme => ({
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.onPrimary,
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        typography: "labelMd",
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
