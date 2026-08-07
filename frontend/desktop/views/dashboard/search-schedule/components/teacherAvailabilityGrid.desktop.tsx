"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { HorizontalScrollRow } from "@/frontend/common/components/ui/container/HorizontalScrollRow";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import type { TeacherAvailabilityGridProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { TeacherAvailabilityDayPillDesktop } from "@/frontend/desktop/views/dashboard/search-schedule/components/teacherAvailabilityDayPill.desktop";

export function TeacherAvailabilityGridDesktop({
  labels,
  teacher,
  fromDate,
  dateColumns,
  gapsByDate,
  onOpenMonthDrawer,
}: Readonly<TeacherAvailabilityGridProps>) {
  return (
    <Paper
      elevation={0}
      sx={mergeSx(theme => ({
        p: 1.5,
        borderRadius: 2,
        border: `1px solid ${theme.palette.outlineVariant}`,
        backgroundColor: theme.palette.surface,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }))}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.primary.main })}>
          {teacher.name ?? ""}
        </Typography>
        {teacher.gender ? (
          <Chip label={teacher.gender === "MALE" ? labels.male : labels.female} size="small" variant="outlined" />
        ) : null}
        <Chip
          label={labels.availableDaysCount(teacher.availableDaysCount ?? 0)}
          size="small"
          color="primary"
          variant="outlined"
        />
        {teacher.timezone ? <TimezoneDisplay timezone={teacher.timezone} typographyVariant="bodyMd" /> : null}
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={labels.viewMonthSchedule}>
          <IconButton
            aria-label={labels.viewMonthSchedule}
            size="small"
            onClick={() => onOpenMonthDrawer(teacher, fromDate)}
            sx={theme => ({ color: theme.palette.primary.main })}
          >
            <CalendarMonthOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <HorizontalScrollRow
        showScrollbar="desktop"
        sx={{
          flexWrap: "nowrap",
          gap: 1,
          paddingInlineStart: 0,
          paddingInlineEnd: 0,
          paddingBottom: 1,
        }}
      >
        {dateColumns.map(calendarDate => {
          const dayGaps = gapsByDate.get(calendarDate) ?? [];

          return <TeacherAvailabilityDayPillDesktop key={calendarDate} calendarDate={calendarDate} gaps={dayGaps} />;
        })}
      </HorizontalScrollRow>
    </Paper>
  );
}
