"use client";

import { InputAdornment, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type * as React from "react";
import {
  type ScheduleOverviewFilterSectionProps,
  SharedSearchIcon,
} from "@/frontend/common/views/dashboard/admin/home/components/__shared__/scheduleOverviewShared.options";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import type { ScheduleOverviewViewModel } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";

export interface ScheduleOverviewSearchFieldProps
  extends Pick<ScheduleOverviewViewModel, "searchValue" | "onSearchChange"> {
  readonly searchPlaceholder: string;
  readonly fullWidth?: boolean;
  readonly sx?: SxProps<Theme>;
}

export function ScheduleOverviewSearchField({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  fullWidth,
  sx,
}: Readonly<ScheduleOverviewSearchFieldProps>): React.JSX.Element {
  return (
    <TextField
      placeholder={searchPlaceholder}
      value={searchValue}
      onChange={event => {
        onSearchChange(event.target.value);
      }}
      fullWidth={fullWidth}
      size="small"
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SharedSearchIcon />
            </InputAdornment>
          ),
        },
      }}
      sx={sx}
    />
  );
}

export function ScheduleOverviewFilterSection({
  filters,
  dateValue,
  onDateChange,
  teacherSelect,
}: Readonly<ScheduleOverviewFilterSectionProps>): React.JSX.Element {
  return (
    <ScheduleFilters
      dateLabel={filters.dateLabel}
      dateValue={dateValue}
      todayLabel={filters.todayLabel}
      previousDayLabel={filters.previousDayLabel}
      nextDayLabel={filters.nextDayLabel}
      onDateChange={onDateChange}
      teacherSelect={teacherSelect}
    />
  );
}
