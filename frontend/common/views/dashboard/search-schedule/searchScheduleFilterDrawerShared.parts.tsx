"use client";

import { Box, Button, MenuItem, type SelectChangeEvent, TextField } from "@mui/material";
import { Gender } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SearchScheduleDraftFilters } from "@/frontend/common/stores/searchScheduleStore";
import { DaysOfWeekSelect } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterDrawerShared.daysOfWeekSelect";
import {
  isDayOfWeek,
  isGender,
} from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterDrawerShared.helpers";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule";

interface FilterFieldsProps {
  readonly labels: SearchScheduleLabels;
  readonly daysLabelId: string;
  readonly draft: SearchScheduleDraftFilters;
  readonly onDraftChange: (draft: Partial<SearchScheduleDraftFilters>) => void;
}

function FilterFields({ labels, daysLabelId, draft, onDraftChange }: Readonly<FilterFieldsProps>) {
  const handleDaysOfWeekChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selectedDays = typeof value === "string" ? value.split(",") : value;
    const dayValues = selectedDays.filter(isDayOfWeek);
    onDraftChange({
      daysOfWeek: dayValues.length > 0 ? dayValues : null,
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: 2, py: 2, flex: 1, overflowY: "auto" }}>
      <TextField
        select
        label={labels.teacherGender}
        value={draft.gender ?? ""}
        size="small"
        fullWidth
        onChange={event => {
          const value = event.target.value;
          const matchedGender = value && isGender(value) ? value : null;
          onDraftChange({ gender: matchedGender });
        }}
      >
        <MenuItem value="">{labels.allGenders}</MenuItem>
        <MenuItem value={Gender.Male}>{labels.male}</MenuItem>
        <MenuItem value={Gender.Female}>{labels.female}</MenuItem>
      </TextField>

      <TextField
        label={labels.minAvailableDays}
        type="number"
        size="small"
        fullWidth
        value={draft.minAvailableDays ?? ""}
        onChange={event =>
          onDraftChange({
            minAvailableDays: event.target.value ? Number(event.target.value) : null,
          })
        }
        slotProps={{ htmlInput: { min: 1 } }}
      />

      <TextField
        label={labels.minTotalGaps}
        type="number"
        size="small"
        fullWidth
        value={draft.minTotalGaps ?? ""}
        onChange={event =>
          onDraftChange({
            minTotalGaps: event.target.value ? Number(event.target.value) : null,
          })
        }
        slotProps={{ htmlInput: { min: 1 } }}
      />

      <DaysOfWeekSelect
        labels={labels}
        daysLabelId={daysLabelId}
        value={draft.daysOfWeek ?? []}
        onChange={handleDaysOfWeekChange}
      />
    </Box>
  );
}

interface DrawerActionsProps {
  readonly labels: SearchScheduleLabels;
  readonly onClear: () => void;
  readonly onApply: () => void;
}

function DrawerActions({ labels, onClear, onApply }: Readonly<DrawerActionsProps>) {
  return (
    <Box
      sx={theme => ({
        display: "flex",
        gap: 1,
        p: 2,
        borderTop: `1px solid ${theme.palette.divider}`,
      })}
    >
      <Button variant="outlined" fullWidth onClick={onClear}>
        {labels.clearFilters}
      </Button>
      <Button variant="contained" fullWidth onClick={onApply}>
        {labels.applyFilters}
      </Button>
    </Box>
  );
}

export { DrawerActions, FilterFields };
