// cspell:disable
"use client";

import { alpha, Box, Paper, Typography } from "@mui/material";
import { DayOfWeek } from "@/frontend/graphql/generated/gql/graphql-types";
import type { AvailabilityEntry, WeeklyAvailabilityGridLabels, WeeklyAvailabilityGridProps } from "../types";

const DAYS: DayOfWeek[] = [
  DayOfWeek.Monday,
  DayOfWeek.Tuesday,
  DayOfWeek.Wednesday,
  DayOfWeek.Thursday,
  DayOfWeek.Friday,
  DayOfWeek.Saturday,
  DayOfWeek.Sunday,
];

const DAY_LABEL_KEYS: Record<DayOfWeek, keyof WeeklyAvailabilityGridLabels> = {
  [DayOfWeek.Monday]: "monday",
  [DayOfWeek.Tuesday]: "tuesday",
  [DayOfWeek.Wednesday]: "wednesday",
  [DayOfWeek.Thursday]: "thursday",
  [DayOfWeek.Friday]: "friday",
  [DayOfWeek.Saturday]: "saturday",
  [DayOfWeek.Sunday]: "sunday",
};

function GridHeader({ labels }: Readonly<{ labels: WeeklyAvailabilityGridLabels }>) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: "100px repeat(7, 1fr)",
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.onPrimary,
      })}
    >
      <Box
        sx={theme => ({
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRight: `1px solid ${alpha(theme.palette.onPrimary, 0.1)}`,
        })}
      >
        <Typography variant="labelUppercase" sx={{ color: "inherit" }}>
          {labels.time}
        </Typography>
      </Box>
      {DAYS.map((day, index) => (
        <Box
          key={day}
          sx={theme => ({
            p: 2,
            textAlign: "center",
            borderRight: index < DAYS.length - 1 ? `1px solid ${alpha(theme.palette.onPrimary, 0.1)}` : "none",
          })}
        >
          <Typography variant="labelUppercase" sx={{ color: "inherit" }}>
            {labels[DAY_LABEL_KEYS[day]]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function AvailabilityBlock({ entry, onClick }: Readonly<{ entry: AvailabilityEntry; onClick?: () => void }>) {
  return (
    <Box
      onClick={onClick}
      sx={theme => ({
        backgroundColor: theme.palette.primary.main,
        height: "100%",
        width: "100%",
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 1,
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
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
        variant="labelSm"
        sx={theme => ({
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
}: Readonly<{
  time: string;
  dayEntries: WeeklyAvailabilityGridProps["availability"][string];
  onBlockClick?: (entry: AvailabilityEntry) => void;
}>) {
  return (
    <Box
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: "100px repeat(7, 1fr)",
        minHeight: 80,
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
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {time}
        </Typography>
      </Box>
      {DAYS.map((day, index) => {
        const entries = dayEntries?.[day];
        return (
          <Box
            key={`${time}-${day}`}
            sx={theme => ({
              p: 0.5,
              borderRight: index < DAYS.length - 1 ? `1px solid ${theme.palette.border.main}` : "none",
              position: "relative",
            })}
          >
            {entries?.map(entry => (
              <AvailabilityBlock
                key={entry.id}
                entry={entry}
                onClick={onBlockClick ? () => onBlockClick(entry) : undefined}
              />
            ))}
          </Box>
        );
      })}
    </Box>
  );
}

export function WeeklyAvailabilityGrid({ availability, labels, onBlockClick }: Readonly<WeeklyAvailabilityGridProps>) {
  return (
    <Paper
      elevation={0}
      sx={theme => ({
        borderRadius: theme.layout.radius.card,
        border: `1px solid ${theme.palette.border.main}`,
        overflow: "hidden",
      })}
    >
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: 1000 }}>
          <GridHeader labels={labels} />
          <Box>
            {Object.entries(availability).map(([time, dayEntries]) => (
              <GridRow key={time} time={time} dayEntries={dayEntries} onBlockClick={onBlockClick} />
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
