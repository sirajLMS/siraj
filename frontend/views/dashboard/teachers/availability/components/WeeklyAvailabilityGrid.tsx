// cspell:disable
"use client";

import { alpha, Box, Paper, Typography } from "@mui/material";
import type { AvailabilityEntry, DayOfWeek, WeeklyAvailability } from "../types";

interface WeeklyAvailabilityGridProps {
  readonly availability: WeeklyAvailability;
  readonly labels: {
    readonly time: string;
    readonly monday: string;
    readonly tuesday: string;
    readonly wednesday: string;
    readonly thursday: string;
    readonly friday: string;
    readonly saturday: string;
    readonly sunday: string;
    readonly mon: string;
    readonly tue: string;
    readonly wed: string;
    readonly thu: string;
    readonly fri: string;
    readonly sat: string;
    readonly sun: string;
  };
}

const DAYS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function GridHeader({ labels }: Readonly<{ labels: WeeklyAvailabilityGridProps["labels"] }>) {
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
            {labels[day]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function AvailabilityBlock({ entry }: Readonly<{ entry: AvailabilityEntry }>) {
  return (
    <Box
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
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          backgroundColor: theme.palette.primary.dark,
          transform: "scale(1.02)",
          zIndex: 10,
        },
      })}
    >
      <Typography
        variant="labelMd"
        sx={theme => ({
          color: theme.palette.onPrimary,
          fontWeight: 700,
          textAlign: "center",
          fontSize: "10px",
          lineHeight: 1.2,
          textTransform: "uppercase",
        })}
      >
        {entry.teacherName}
      </Typography>
      <Typography
        variant="labelMd"
        sx={theme => ({
          color: alpha(theme.palette.onPrimary, 0.7),
          fontSize: "9px",
          fontWeight: 500,
        })}
      >
        {entry.localTime}
      </Typography>
    </Box>
  );
}

function GridRow({ time, dayEntries }: Readonly<{ time: string; dayEntries: WeeklyAvailability[string] }>) {
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
        const entry = dayEntries[day];
        return (
          <Box
            key={`${time}-${day}`}
            sx={theme => ({
              p: 0.5,
              borderRight: index < DAYS.length - 1 ? `1px solid ${theme.palette.border.main}` : "none",
              position: "relative",
            })}
          >
            {entry && <AvailabilityBlock entry={entry} />}
          </Box>
        );
      })}
    </Box>
  );
}

export function WeeklyAvailabilityGrid({ availability, labels }: Readonly<WeeklyAvailabilityGridProps>) {
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
              <GridRow key={time} time={time} dayEntries={dayEntries} />
            ))}
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
