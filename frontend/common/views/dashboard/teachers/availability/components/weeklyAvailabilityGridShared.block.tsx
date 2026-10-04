"use client";

import { alpha, Box, Typography } from "@mui/material";
import type {
  AvailabilityEntry,
  WeeklyAvailabilityGridLabels,
} from "@/frontend/common/views/dashboard/teachers/availability/types";

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

export { AvailabilityBlock };
