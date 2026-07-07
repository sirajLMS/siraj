"use client";

import { SearchOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  TextField,
} from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { useTranslations } from "next-intl";
import type { SyntheticEvent } from "react";
import { AppDatePicker } from "@/frontend/components/ui/form/AppDatePicker";
import { AvailabilitySearchSortBy, DayOfWeek, type Gender } from "@/frontend/graphql/generated/gql/graphql-types";
import type { SearchScheduleDraftFilters } from "@/frontend/stores/searchScheduleStore";
import { SearchScheduleTeacherAutocomplete } from "./SearchScheduleTeacherAutocomplete";

const DATE_FILTER_FORMAT = "yyyy-MM-dd";

function parseFilterDate(date: string): Date | null {
  if (date.length === 0) {
    return null;
  }

  const parsedDate = parse(date, DATE_FILTER_FORMAT, new Date());
  return isValid(parsedDate) ? parsedDate : null;
}

interface SearchScheduleFormProps {
  readonly draft: SearchScheduleDraftFilters;
  readonly isSearching: boolean;
  readonly onDraftChange: (draft: Partial<SearchScheduleDraftFilters>) => void;
  readonly onSearch: () => void;
}

export function SearchScheduleForm({ draft, isSearching, onDraftChange, onSearch }: Readonly<SearchScheduleFormProps>) {
  const t = useTranslations("dashboard.searchSchedule");

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  const handleSortChange = (event: SelectChangeEvent) => {
    onDraftChange({ sortBy: event.target.value as AvailabilitySearchSortBy });
  };

  const handleDaysOfWeekChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selectedDays = typeof value === "string" ? value.split(",") : value;
    onDraftChange({
      daysOfWeek: selectedDays.length > 0 ? (selectedDays as DayOfWeek[]) : null,
    });
  };

  const selectedFromDate = parseFilterDate(draft.fromDate);
  const selectedToDate = parseFilterDate(draft.toDate);

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={theme => ({
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
        gap: 2,
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.surfaceContainerLow,
        mb: 3,
      })}
    >
      <AppDatePicker
        label={t("fromDate")}
        value={selectedFromDate}
        onChange={date => onDraftChange({ fromDate: date ? format(date, DATE_FILTER_FORMAT) : "" })}
      />

      <AppDatePicker
        label={t("toDate")}
        value={selectedToDate}
        onChange={date => onDraftChange({ toDate: date ? format(date, DATE_FILTER_FORMAT) : "" })}
      />

      <TextField
        label={t("fromTime")}
        type="time"
        value={draft.fromTime}
        onChange={event => onDraftChange({ fromTime: event.target.value })}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <TextField
        label={t("toTime")}
        type="time"
        value={draft.toTime}
        onChange={event => onDraftChange({ toTime: event.target.value })}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <TextField
        select
        label={t("gender")}
        value={draft.gender ?? ""}
        onChange={event => {
          const value = event.target.value;
          onDraftChange({ gender: value ? (value as Gender) : null });
        }}
      >
        <MenuItem value="">{t("allGenders")}</MenuItem>
        <MenuItem value="MALE">{t("male")}</MenuItem>
        <MenuItem value="FEMALE">{t("female")}</MenuItem>
      </TextField>

      <SearchScheduleTeacherAutocomplete />

      <TextField
        label={t("minAvailableDays")}
        type="number"
        value={draft.minAvailableDays ?? ""}
        onChange={event =>
          onDraftChange({
            minAvailableDays: event.target.value ? Number(event.target.value) : null,
          })
        }
        slotProps={{ htmlInput: { min: 1 } }}
      />

      <TextField
        label={t("minTotalGaps")}
        type="number"
        value={draft.minTotalGaps ?? ""}
        onChange={event =>
          onDraftChange({
            minTotalGaps: event.target.value ? Number(event.target.value) : null,
          })
        }
        slotProps={{ htmlInput: { min: 1 } }}
      />

      <FormControl>
        <InputLabel id="search-schedule-sort-label">{t("sortBy")}</InputLabel>
        <Select
          labelId="search-schedule-sort-label"
          label={t("sortBy")}
          value={draft.sortBy}
          onChange={handleSortChange}
        >
          <MenuItem value={AvailabilitySearchSortBy.MostAvailableDays}>{t("sort.mostAvailableDays")}</MenuItem>
          <MenuItem value={AvailabilitySearchSortBy.MostGaps}>{t("sort.mostGaps")}</MenuItem>
          <MenuItem value={AvailabilitySearchSortBy.NameAsc}>{t("sort.nameAsc")}</MenuItem>
          <MenuItem value={AvailabilitySearchSortBy.NameDesc}>{t("sort.nameDesc")}</MenuItem>
          <MenuItem value={AvailabilitySearchSortBy.TimezoneAsc}>{t("sort.timezoneAsc")}</MenuItem>
        </Select>
      </FormControl>

      <FormControl>
        <InputLabel id="search-schedule-days-label">{t("daysOfWeek")}</InputLabel>
        <Select
          labelId="search-schedule-days-label"
          label={t("daysOfWeek")}
          multiple
          value={draft.daysOfWeek ?? []}
          onChange={handleDaysOfWeekChange}
          renderValue={selected =>
            selected.map(day => t(`day.${day.toLowerCase() as Lowercase<DayOfWeek>}`)).join(", ")
          }
        >
          {Object.values(DayOfWeek).map(day => (
            <MenuItem key={day} value={day}>
              {t(`day.${day.toLowerCase() as Lowercase<DayOfWeek>}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ display: "flex", alignItems: "flex-end" }}>
        <Button
          type="submit"
          variant="contained"
          disabled={isSearching}
          startIcon={isSearching ? <CircularProgress size={20} color="inherit" /> : <SearchOutlined />}
          sx={{ height: 56, width: { xs: "100%", md: "auto" } }}
        >
          {t("searchBtn")}
        </Button>
      </Box>
    </Box>
  );
}
