"use client";

import { Box, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import type { LeaveRequestStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { TrackingFilterSelectProps } from "@/frontend/common/views/dashboard/reschedule/tracking/__shared__/rescheduleTrackingShared";
import { getTrackingStatusLabel } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.helpers";
import { STATUS_FILTER_OPTIONS } from "@/frontend/common/views/dashboard/reschedule/tracking/tracking.types";

export function TrackingFilterSelect({ statusFilter, onFilterChange, labels }: Readonly<TrackingFilterSelectProps>) {
  const handleStatusFilterChange = (e: SelectChangeEvent<LeaveRequestStatus | "">) => {
    const value = e.target.value;
    onFilterChange(value === "" ? null : value);
  };

  return (
    <Select<LeaveRequestStatus | "">
      value={statusFilter ?? ""}
      onChange={handleStatusFilterChange}
      size="small"
      displayEmpty
      sx={theme => ({
        minWidth: 140,
        typography: "bodyMd",
        backgroundColor: theme.palette.surfaceContainerLow,
        "& .MuiSelect-select": { py: 0.5 },
      })}
    >
      {STATUS_FILTER_OPTIONS.map(status => (
        <MenuItem key={status} value={status}>
          {getTrackingStatusLabel(status, labels)}
        </MenuItem>
      ))}
    </Select>
  );
}

export function TrackingFilterActionsContainer({ children }: Readonly<{ children: React.ReactNode }>) {
  return <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>{children}</Box>;
}
