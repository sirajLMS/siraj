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
import type { SearchScheduleFilterDrawerProps } from "@/frontend/common/views/dashboard/search-schedule/SearchScheduleFilterDrawer";
import { getClearDrawerFiltersPatch } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import { useAppTranslation } from "@/shared/locale/client";

function DaysOfWeekSelect({
  value,
  onChange,
}: {
  readonly value: DayOfWeek[];
  readonly onChange: (event: SelectChangeEvent<string[]>) => void;
}) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;

  return (
    <FormControl size="small" fullWidth>
      <InputLabel id="search-schedule-days-label">{t.daysOfWeek}</InputLabel>
      <Select
        labelId="search-schedule-days-label"
        label={t.daysOfWeek}
        multiple
        value={value}
        onChange={onChange}
        renderValue={selected => (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {selected.slice(0, 2).map(day => (
              <Chip key={day} label={t.day[day.toLowerCase() as keyof typeof t.day]} size="small" />
            ))}
            {selected.length > 2 ? <Chip label={`+${selected.length - 2}`} size="small" /> : null}
          </Box>
        )}
      >
        {Object.values(DayOfWeek).map(day => (
          <MenuItem key={day} value={day}>
            {t.day[day.toLowerCase() as keyof typeof t.day]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

interface FilterFieldsProps {
  readonly draft: SearchScheduleDraftFilters;
  readonly onDraftChange: (draft: Partial<SearchScheduleDraftFilters>) => void;
}

function FilterFields({ draft, onDraftChange }: Readonly<FilterFieldsProps>) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;

  const handleDaysOfWeekChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selectedDays = typeof value === "string" ? value.split(",") : value;
    onDraftChange({
      daysOfWeek: selectedDays.length > 0 ? (selectedDays as DayOfWeek[]) : null,
    });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, px: 2, py: 2, flex: 1, overflowY: "auto" }}>
      <TextField
        select
        label={t.teacherGender}
        value={draft.gender ?? ""}
        size="small"
        fullWidth
        onChange={event => {
          const value = event.target.value;
          let gender: Gender | null = null;
          if (value) {
            for (const option of Object.values(Gender)) {
              if (option === value) {
                gender = option;
                break;
              }
            }
          }
          onDraftChange({ gender });
        }}
      >
        <MenuItem value="">{t.allGenders}</MenuItem>
        <MenuItem value={Gender.Male}>{t.male}</MenuItem>
        <MenuItem value={Gender.Female}>{t.female}</MenuItem>
      </TextField>

      <TextField
        label={t.minAvailableDays}
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
        label={t.minTotalGaps}
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

      <DaysOfWeekSelect value={draft.daysOfWeek ?? []} onChange={handleDaysOfWeekChange} />
    </Box>
  );
}

interface DrawerActionsProps {
  readonly onClear: () => void;
  readonly onApply: () => void;
}

function DrawerActions({ onClear, onApply }: Readonly<DrawerActionsProps>) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;

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
        {t.clearFilters}
      </Button>
      <Button variant="contained" fullWidth onClick={onApply}>
        {t.applyFilters}
      </Button>
    </Box>
  );
}

export function SearchScheduleFilterDrawerMobile({
  open,
  draft,
  onClose,
  onDraftChange,
  onApply,
}: Readonly<SearchScheduleFilterDrawerProps>) {
  const t = useAppTranslation().dashboardTranslations.coreSearchSchedule;

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
          <Typography variant="titleLg">{t.filters}</Typography>
        </Box>

        <FilterFields draft={draft} onDraftChange={onDraftChange} />

        <DrawerActions onClear={handleClear} onApply={handleApply} />
      </Box>
    </Drawer>
  );
}
