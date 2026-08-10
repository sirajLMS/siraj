"use client";

import {
  Box,
  Button,
  Chip,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import { DayOfWeek, Gender } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SearchScheduleDraftFilters } from "@/frontend/common/stores/searchScheduleStore";
import type { SearchScheduleFilterDrawerProps } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterDrawer.types";
import { getClearDrawerFiltersPatch } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule";

const DAY_OF_WEEK_LABEL_KEY: Record<DayOfWeek, keyof SearchScheduleLabels["day"]> = {
  [DayOfWeek.Friday]: "friday",
  [DayOfWeek.Monday]: "monday",
  [DayOfWeek.Saturday]: "saturday",
  [DayOfWeek.Sunday]: "sunday",
  [DayOfWeek.Thursday]: "thursday",
  [DayOfWeek.Tuesday]: "tuesday",
  [DayOfWeek.Wednesday]: "wednesday",
};

const DAY_OF_WEEK_VALUES = new Set<string>(Object.values(DayOfWeek));

const isDayOfWeek = (day: string): day is DayOfWeek => DAY_OF_WEEK_VALUES.has(day);

const GENDER_VALUES = new Set<string>(Object.values(Gender));

const isGender = (val: string): val is Gender => GENDER_VALUES.has(val);

function DaysOfWeekSelect({
  labels,
  value,
  onChange,
}: {
  readonly labels: SearchScheduleLabels;
  readonly value: DayOfWeek[];
  readonly onChange: (event: SelectChangeEvent<string[]>) => void;
}) {
  return (
    <FormControl size="small" fullWidth>
      <InputLabel id="search-schedule-days-label" shrink>
        {labels.daysOfWeek}
      </InputLabel>
      <Select
        labelId="search-schedule-days-label"
        label={labels.daysOfWeek}
        multiple
        value={value}
        onChange={onChange}
        renderValue={selected => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.slice(0, 2).map(day => (
              <Chip key={day} label={labels.day[DAY_OF_WEEK_LABEL_KEY[day]]} size="small" />
            ))}
            {selected.length > 2 ? <Chip label={`+${selected.length - 2}`} size="small" /> : null}
          </Box>
        )}
      >
        {Object.values(DayOfWeek).map(day => (
          <MenuItem key={day} value={day}>
            {labels.day[DAY_OF_WEEK_LABEL_KEY[day]]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

interface FilterFieldsProps {
  readonly labels: SearchScheduleLabels;
  readonly draft: SearchScheduleDraftFilters;
  readonly onDraftChange: (draft: Partial<SearchScheduleDraftFilters>) => void;
}

function FilterFields({ labels, draft, onDraftChange }: Readonly<FilterFieldsProps>) {
  const handleDaysOfWeekChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selectedDays = (typeof value === "string" ? value.split(",") : value).filter(isDayOfWeek);
    onDraftChange({
      daysOfWeek: selectedDays.length > 0 ? selectedDays : null,
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
          const matchedGender = isGender(value) ? value : null;
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

      <DaysOfWeekSelect labels={labels} value={draft.daysOfWeek ?? []} onChange={handleDaysOfWeekChange} />
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
      sx={{
        display: "flex",
        gap: 1,
        p: 2,
        borderTop: 1,
        borderColor: "divider",
      }}
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

export function SearchScheduleFilterDrawerMobile({
  labels,
  open,
  draft,
  onClose,
  onDraftChange,
  onApply,
}: Readonly<SearchScheduleFilterDrawerProps>) {
  const handleClear = () => {
    onDraftChange(getClearDrawerFiltersPatch());
  };

  const handleApply = () => {
    onApply();
    onClose();
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: "100%",
            maxHeight: "85vh",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography variant="titleLg">{labels.filters}</Typography>
        </Box>

        <FilterFields labels={labels} draft={draft} onDraftChange={onDraftChange} />

        <DrawerActions labels={labels} onClear={handleClear} onApply={handleApply} />
      </Box>
    </Drawer>
  );
}
