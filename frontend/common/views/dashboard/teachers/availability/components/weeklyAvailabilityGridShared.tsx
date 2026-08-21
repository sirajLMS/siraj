// cspell:disable
"use client";

import { alpha, Box, Paper, Typography } from "@mui/material";
import { DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  WeeklyAvailabilityGridSharedOptions,
  WeeklyAvailabilityGridSharedProps,
} from "@/frontend/common/views/dashboard/teachers/availability/components/types/weeklyAvailabilityGridShared.types";
import type {
  AvailabilityEntry,
  WeeklyAvailabilityGridLabels,
  WeeklyAvailabilityGridProps,
} from "@/frontend/common/views/dashboard/teachers/availability/types";

const DAYS: DayOfWeek[] = [
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday,
  DayOfWeek.Sunday,
];

const DAY_LABEL_KEYS: Record<
  DayOfWeek,
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
> = {
  [DayOfWeek.Monday]: "monday",
  [DayOfWeek.Tuesday]: "tuesday",
  [DayOfWeek.Wednesday]: "wednesday",
  [DayOfWeek.Thursday]: "thursday",
  [DayOfWeek.Friday]: "friday",
  [DayOfWeek.Saturday]: "saturday",
  [DayOfWeek.Sunday]: "sunday",
};

function GridHeader({
  labels,
  options,
}: Readonly<{ labels: WeeklyAvailabilityGridLabels; options: WeeklyAvailabilityGridSharedOptions }>) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: options.gridTemplateColumns,
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.onPrimary,
      })}
    >
      <Box
        sx={theme => ({
          p: options.headerPadding,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRight: `1px solid ${alpha(theme.palette.onPrimary, 0.1)}`,
        })}
      >
        <Typography variant={options.headerLabelVariant} sx={{ color: "inherit" }}>
          {labels.time}
        </Typography>
      </Box>
      {DAYS.map((day, index) => (
        <Box
          key={day}
          sx={theme => ({
            p: options.headerPadding,
            textAlign: "center",
            borderRight: index < DAYS.length - 1 ? `1px solid ${alpha(theme.palette.onPrimary, 0.1)}` : "none",
          })}
        >
          <Typography variant={options.headerLabelVariant} sx={{ color: "inherit" }}>
            {labels[DAY_LABEL_KEYS[day]]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function AvailabilityBlock({
  entry,
  onClick,
  padding,
  labels,
}: Readonly<{
  entry: AvailabilityEntry;
  onClick?: () => void;
  padding: number;
  labels: WeeklyAvailabilityGridLabels;
}>) {
  const ariaLabel = labels.availableSlot(entry.teacherName, entry.localTime);
  return (
    <Box
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
      aria-label={onClick ? ariaLabel : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      sx={theme => ({
        backgroundColor: theme.palette.primary.main,
        height: "100%",
        width: "100%",
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: padding,
        cursor: onClick ? "pointer" : "default",
        transition: theme.transitions.create("all", { duration: 200 }),
        "&:hover": onClick
          ? {
              backgroundColor: theme.palette.primary.dark,
              transform: "scale(1.02)",
              zIndex: 10,
            }
          : undefined,
      })}
    >
      <Typography
        sx={theme => ({
          typography: "labelSm",
          color: theme.palette.onPrimary,
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.2,
          textTransform: "uppercase",
        })}
      >
        {entry.teacherName}
      </Typography>
      <Typography
        sx={theme => ({
          typography: "labelSm",
          color: alpha(theme.palette.onPrimary, 0.7),
          fontWeight: 500,
        })}
      >
        {entry.localTime}
      </Typography>
    </Box>
  );
}

function GridRow({
  time,
  dayEntries,
  onBlockClick,
  options,
  labels,
}: Readonly<{
  time: string;
  dayEntries: WeeklyAvailabilityGridProps["availability"][string];
  onBlockClick?: (entry: AvailabilityEntry) => void;
  options: WeeklyAvailabilityGridSharedOptions;
  labels: WeeklyAvailabilityGridLabels;
}>) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: options.gridTemplateColumns,
        minHeight: options.rowMinHeight,
        borderBottom: `1px solid ${theme.palette.border.main}`,
        "&:last-child": { borderBottom: "none" },
      })}
    >
      <Box
        sx={theme => ({
          backgroundColor: theme.palette.surfaceContainerLow,
          color: theme.palette.onSurface,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRight: `1px solid ${theme.palette.border.main}`,
        })}
      >
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {time}
        </Typography>
      </Box>
      {DAYS.map((day, index) => {
        const entries = dayEntries?.[day];
        return (
          <Box
            key={`${time}-${day}`}
            sx={theme => ({
              p: options.cellPadding,
              borderRight: index < DAYS.length - 1 ? `1px solid ${theme.palette.border.main}` : "none",
              position: "relative",
            })}
          >
            {entries?.map(entry => (
              <AvailabilityBlock
                key={entry.id}
                entry={entry}
                onClick={onBlockClick ? () => onBlockClick(entry) : undefined}
                padding={options.blockPadding}
                labels={labels}
              />
            ))}
          </Box>
        );
      })}
    </Box>
  );
}

export function WeeklyAvailabilityGridShared({
  availability,
  labels,
  onBlockClick,
  options,
}: Readonly<WeeklyAvailabilityGridSharedProps>) {
  return (
    <Paper
      elevation={0}
      sx={theme => ({
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.border.main}`,
        overflow: "hidden",
      })}
    >
      <Box sx={{ overflowX: "auto", ...(options.momentumScroll ? { WebkitOverflowScrolling: "touch" } : {}) }}>
        <Box sx={{ minWidth: options.gridMinWidth }}>
          <GridHeader labels={labels} options={options} />
          <Box>
            {Object.entries(availability).map(([time, dayEntries]) => (
              <GridRow
                key={time}
                time={time}
                dayEntries={dayEntries}
                onBlockClick={onBlockClick}
                options={options}
                labels={labels}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
