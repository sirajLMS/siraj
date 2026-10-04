"use client";

import { Box, Chip, FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import { DayOfWeek } from "@/frontend/common/graphql/generated/gql/graphql";
import { getDayLabel } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterDrawerShared.helpers";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule";

export function DaysOfWeekSelect({
  labels,
  daysLabelId,
  value,
  onChange,
}: {
  readonly labels: SearchScheduleLabels;
  readonly daysLabelId: string;
  readonly value: DayOfWeek[];
  readonly onChange: (event: SelectChangeEvent<string[]>) => void;
}) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel id={daysLabelId} shrink>
        {labels.daysOfWeek}
      </InputLabel>
      <Select
        labelId={daysLabelId}
        label={labels.daysOfWeek}
        multiple
        value={value}
        onChange={onChange}
        renderValue={selected => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.slice(0, 2).map(day => (
              <Chip key={day} label={getDayLabel(day, labels)} size="small" />
            ))}
            {selected.length > 2 ? <Chip label={`+${selected.length - 2}`} size="small" /> : null}
          </Box>
        )}
      >
        {Object.values(DayOfWeek).map(day => (
          <MenuItem key={day} value={day}>
            {getDayLabel(day, labels)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
