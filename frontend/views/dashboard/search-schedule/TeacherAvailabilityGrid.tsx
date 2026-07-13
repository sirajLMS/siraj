"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { addDays, differenceInCalendarDays, format, parse } from "date-fns";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { HorizontalScrollRow } from "@/frontend/common/components/ui/container/HorizontalScrollRow";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { edgeToEdgeCardShellSx } from "@/frontend/common/utils/sx/edgeToEdgeSx";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import type { SearchScheduleResultItem } from "@/frontend/views/dashboard/search-schedule/SearchScheduleView";
import { TeacherAvailabilityDayPill } from "@/frontend/views/dashboard/search-schedule/TeacherAvailabilityDayPill";
import { TeacherAvailabilityMonthDrawer } from "@/frontend/views/dashboard/search-schedule/TeacherAvailabilityMonthDrawer";

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
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    <>
      <Paper
        elevation={0}
        sx={mergeSx(
          theme => ({
            p: 1.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.outlineVariant}`,
            backgroundColor: theme.palette.surface,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            [theme.breakpoints.down("lg")]: {
              px: 2,
              py: 1.5,
              border: "none",
            },
          }),
          edgeToEdgeCardShellSx
        )}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
            {teacher.name ?? ""}
          </Typography>
          {teacher.gender ? (
            <Chip label={teacher.gender === "MALE" ? t("male") : t("female")} size="small" variant="outlined" />
          ) : null}
          <Chip
            label={t("availableDaysCount", { count: teacher.availableDaysCount ?? 0 })}
            size="small"
            color="primary"
            variant="outlined"
          />
          {teacher.timezone ? <TimezoneDisplay timezone={teacher.timezone} typographyVariant="bodyMd" /> : null}
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={t("viewMonthSchedule")}>
            <IconButton
              aria-label={t("viewMonthSchedule")}
              size="small"
              onClick={() => setDrawerOpen(true)}
              sx={theme => ({ color: theme.palette.primary.main })}
            >
              <CalendarMonthOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ mx: { xs: -2, md: 0 } }}>
          <HorizontalScrollRow
            showScrollbar="desktop"
            sx={{
              flexWrap: "nowrap",
              gap: 1,
              paddingInlineStart: { xs: 2, md: 0 },
              paddingInlineEnd: { xs: 2, md: 0 },
              paddingBottom: { md: 1 },
            }}
          >
            {dateColumns.map(calendarDate => {
              const dayGaps = (gapsByDate.get(calendarDate) ?? []).filter(
                (gap): gap is NonNullable<typeof gap> => gap !== null
              );

              return <TeacherAvailabilityDayPill key={calendarDate} calendarDate={calendarDate} gaps={dayGaps} />;
            })}
          </HorizontalScrollRow>
        </Box>
      </Paper>

      <TeacherAvailabilityMonthDrawer
        open={drawerOpen}
        teacher={teacher}
        anchorFromDate={fromDate}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
