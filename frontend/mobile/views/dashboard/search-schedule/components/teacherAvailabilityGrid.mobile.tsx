"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import { Box, Chip, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { edgeToEdgeCardShellSx } from "@/frontend/common/utils/sx/edgeToEdgeSx";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import type { TeacherAvailabilityGridProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import { TeacherAvailabilityDayPillMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/teacherAvailabilityDayPill.mobile";

export function TeacherAvailabilityGridMobile({
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
      sx={mergeSx(
        theme => ({
          p: 1.5,
          borderRadius: 2,
          border: `1px solid ${theme.palette.outlineVariant}`,
          backgroundColor: theme.palette.surface,
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }),
        edgeToEdgeCardShellSx
      )}
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

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          gap: 1,
          overflowX: "auto",
          paddingInlineStart: 0,
          paddingInlineEnd: 0,
          paddingBottom: 1,
        }}
      >
        {dateColumns.map(calendarDate => {
          const dayGaps = (gapsByDate.get(calendarDate) ?? []).filter(
            (gap): gap is NonNullable<typeof gap> => gap !== null
          );

          return <TeacherAvailabilityDayPillMobile key={calendarDate} calendarDate={calendarDate} gaps={dayGaps} />;
        })}
      </Box>
    </Paper>
  );
}
