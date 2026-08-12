"use client";

import { CalendarMonthOutlined } from "@mui/icons-material";
import type { SxProps, Theme } from "@mui/material";
import { Box, Chip, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { HorizontalScrollRow } from "@/frontend/common/components/ui/container/HorizontalScrollRow";
import { TimezoneDisplay } from "@/frontend/common/components/ui/display/timezoneDisplay/TimezoneDisplay";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import type {
  TeacherAvailabilityDayPillProps,
  TeacherAvailabilityGridProps,
} from "@/frontend/common/views/dashboard/search-schedule/types";

export interface TeacherAvailabilityGridSlotProps {
  /** Tier-specific DayPill component (desktop or mobile). */
  readonly DayPillComponent: React.FC<Readonly<TeacherAvailabilityDayPillProps>>;
  /** Extra Paper sx merged onto card shell (mobile uses edgeToEdgeCardShellSx). */
  readonly cardShellExtraSx?: SxProps<Theme>;
  /** Scroll container variant — "desktop" uses HorizontalScrollRow with showScrollbar; "mobile" uses plain Box. */
  readonly scrollRowVariant: "desktop" | "mobile";
}

type TeacherAvailabilityGridSharedProps = TeacherAvailabilityGridProps & TeacherAvailabilityGridSlotProps;

function GridScrollRow({ variant, children }: Readonly<{ variant: "desktop" | "mobile"; children: React.ReactNode }>) {
  if (variant === "mobile") {
    return (
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
        {children}
      </Box>
    );
  }
  return (
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
      {children}
    </HorizontalScrollRow>
  );
}

export function TeacherAvailabilityGridShared({
  labels,
  teacher,
  fromDate,
  dateColumns,
  gapsByDate,
  onOpenMonthDrawer,
  DayPillComponent,
  cardShellExtraSx,
  scrollRowVariant,
}: Readonly<TeacherAvailabilityGridSharedProps>) {
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
        cardShellExtraSx
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

      <GridScrollRow variant={scrollRowVariant}>
        {dateColumns.map(calendarDate => {
          const dayGaps = gapsByDate.get(calendarDate) ?? [];
          return <DayPillComponent key={calendarDate} calendarDate={calendarDate} gaps={dayGaps} />;
        })}
      </GridScrollRow>
    </Paper>
  );
}
