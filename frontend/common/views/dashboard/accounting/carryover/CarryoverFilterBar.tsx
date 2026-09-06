"use client";

import { ClearOutlined, SearchOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { AppDateRangePicker } from "@/frontend/common/components/ui/form/date";
import { TeacherAutocomplete } from "@/frontend/common/components/ui/input/userSelect";
import { type CarryoverPaidStatusFilter, useCarryoverFilterStore } from "@/frontend/common/stores/carryoverFilterStore";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover } from "@/shared/locale/namespaces";

/** Delay before settled search text is pushed into the carryover filter store. */
const SEARCH_DEBOUNCE_MS = 300;

/** Search length accepted by both the carryover query and the CSV export route. */
const SEARCH_INPUT_MAX_LENGTH = 200;

/** Paid-status radio choices rendered start-to-end (RTL aware). */
const PAID_STATUS_FILTERS: readonly CarryoverPaidStatusFilter[] = ["Paid", "Unpaid", "Both"];

function isPaidStatusFilter(value: string): value is CarryoverPaidStatusFilter {
  return PAID_STATUS_FILTERS.some(option => option === value);
}

interface SearchInputState {
  readonly inputValue: string;
  readonly setInputValue: (value: string) => void;
}

/**
 * Local search text mirroring the store: keystrokes update the input instantly
 * and the store (which drives the query) only receives the settled text after
 * the debounce window. External store resets (e.g. Clear) re-echo into the
 * input through the render-time adjustment (React's recommended alternative to
 * resetting state inside an effect), which then makes the debounce a no-op.
 */
function useDebouncedSearchInput(search: string, setSearch: (value: string) => void): SearchInputState {
  const [inputValue, setInputValue] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (syncedSearch !== search) {
    setSyncedSearch(search);
    setInputValue(search);
  }
  useEffect(() => {
    if (inputValue === search) return undefined;
    const timeout = setTimeout(() => setSearch(inputValue), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [inputValue, search, setSearch]);
  return { inputValue, setInputValue };
}

interface SearchTextFieldProps {
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

function SearchTextField({ placeholder, value, onChange }: Readonly<SearchTextFieldProps>) {
  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={event => onChange(event.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlined fontSize="small" />
            </InputAdornment>
          ),
        },
        htmlInput: {
          "aria-label": placeholder,
          autoComplete: "off",
          maxLength: SEARCH_INPUT_MAX_LENGTH,
        },
      }}
      sx={{ flexGrow: 1, minWidth: { xs: "100%", sm: 240 } }}
    />
  );
}

interface PaidStatusRadioGroupProps {
  readonly groupLabel: string;
  readonly labels: Record<CarryoverPaidStatusFilter, string>;
  readonly value: CarryoverPaidStatusFilter;
  readonly onChange: (status: CarryoverPaidStatusFilter) => void;
}

function PaidStatusRadioGroup({ groupLabel, labels, value, onChange }: Readonly<PaidStatusRadioGroupProps>) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isPaidStatusFilter(event.target.value)) onChange(event.target.value);
  };
  return (
    <FormControl component="fieldset" variant="standard">
      <FormLabel id="carryover-paid-status-label" sx={{ typography: "bodyMd" }}>
        {groupLabel}
      </FormLabel>
      <RadioGroup row aria-labelledby="carryover-paid-status-label" value={value} onChange={handleChange}>
        {PAID_STATUS_FILTERS.map(status => (
          <FormControlLabel key={status} value={status} control={<Radio size="small" />} label={labels[status]} />
        ))}
      </RadioGroup>
    </FormControl>
  );
}

interface DateRangeFilterProps {
  readonly label: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly onDateFromChange: (dateFrom: string | null) => void;
  readonly onDateToChange: (dateTo: string | null) => void;
}

function DateRangeFilter({
  label,
  fromLabel,
  toLabel,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
}: Readonly<DateRangeFilterProps>) {
  const handleChange = (nextDateFrom: string, nextDateTo: string) => {
    onDateFromChange(nextDateFrom === "" ? null : nextDateFrom);
    onDateToChange(nextDateTo === "" ? null : nextDateTo);
  };
  return (
    <Box sx={{ flex: { xs: "1 1 100%", md: "0 1 auto" }, minWidth: { md: 300 } }}>
      <AppDateRangePicker
        label={label}
        fromLabel={fromLabel}
        toLabel={toLabel}
        fromDate={dateFrom ?? ""}
        toDate={dateTo ?? ""}
        onChange={handleChange}
        size="small"
      />
    </Box>
  );
}

interface FilterActionsProps {
  readonly toggleLabel: string;
  readonly includeDisabledTeachers: boolean;
  readonly onToggle: (include: boolean) => void;
  readonly clearLabel: string;
  readonly clearDisabled: boolean;
  readonly onClear: () => void;
}

function FilterActions({
  toggleLabel,
  includeDisabledTeachers,
  onToggle,
  clearLabel,
  clearDisabled,
  onClear,
}: Readonly<FilterActionsProps>) {
  return (
    <Stack direction="row" sx={{ gap: 2, alignItems: "center", marginInlineStart: "auto" }}>
      <FormControlLabel
        control={
          <Switch size="small" checked={includeDisabledTeachers} onChange={event => onToggle(event.target.checked)} />
        }
        label={toggleLabel}
      />
      <Button
        size="small"
        variant="text"
        startIcon={<ClearOutlined fontSize="small" />}
        disabled={clearDisabled}
        onClick={onClear}
      >
        {clearLabel}
      </Button>
    </Stack>
  );
}

export function CarryoverFilterBar() {
  const t = useAppTranslation(DashboardAccountingCarryover);

  const teacherId = useCarryoverFilterStore(state => state.teacherId);
  const teacherOption = useCarryoverFilterStore(state => state.teacherOption);
  const paidStatus = useCarryoverFilterStore(state => state.paidStatus);
  const dateFrom = useCarryoverFilterStore(state => state.dateFrom);
  const dateTo = useCarryoverFilterStore(state => state.dateTo);
  const includeDisabledTeachers = useCarryoverFilterStore(state => state.includeDisabledTeachers);
  const search = useCarryoverFilterStore(state => state.search);
  const setTeacher = useCarryoverFilterStore(state => state.setTeacher);
  const setPaidStatus = useCarryoverFilterStore(state => state.setPaidStatus);
  const setDateFrom = useCarryoverFilterStore(state => state.setDateFrom);
  const setDateTo = useCarryoverFilterStore(state => state.setDateTo);
  const setIncludeDisabledTeachers = useCarryoverFilterStore(state => state.setIncludeDisabledTeachers);
  const setSearch = useCarryoverFilterStore(state => state.setSearch);
  const clearFilters = useCarryoverFilterStore(state => state.clearFilters);

  const { inputValue, setInputValue } = useDebouncedSearchInput(search, setSearch);
  // teacherOption/teacherId are written together, but an external clear keeps
  // the option authoritative only while the id filter is live.
  const teacherSelection = teacherId !== null && teacherOption?.id === teacherId ? teacherOption : null;

  const paidStatusLabels: Record<CarryoverPaidStatusFilter, string> = {
    Paid: t.filters.paid,
    Unpaid: t.filters.unpaid,
    Both: t.filters.both,
  };

  const hasActiveFilters =
    teacherId !== null ||
    paidStatus !== "Both" ||
    dateFrom !== null ||
    dateTo !== null ||
    includeDisabledTeachers ||
    search !== "";

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ flexWrap: "wrap", gap: 2, alignItems: { xs: "stretch", md: "center" } }}
      >
        <SearchTextField placeholder={t.filters.searchPlaceholder} value={inputValue} onChange={setInputValue} />
        <TeacherAutocomplete
          size="small"
          label={t.filters.teacher}
          placeholder={t.filters.teacherPlaceholder}
          value={teacherSelection}
          onChange={setTeacher}
          sx={{ width: { xs: "100%", sm: 230 }, flexShrink: 0 }}
        />
        <PaidStatusRadioGroup
          groupLabel={t.filters.paidStatus}
          labels={paidStatusLabels}
          value={paidStatus}
          onChange={setPaidStatus}
        />
      </Stack>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ flexWrap: "wrap", gap: 2, mt: 2, alignItems: { xs: "stretch", md: "center" } }}
      >
        <DateRangeFilter
          label={t.filters.dateRange}
          fromLabel={t.filters.fromDate}
          toLabel={t.filters.toDate}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
        />
        <FilterActions
          toggleLabel={t.filters.includeDisabledTeachers}
          includeDisabledTeachers={includeDisabledTeachers}
          onToggle={setIncludeDisabledTeachers}
          clearLabel={t.filters.clear}
          clearDisabled={!hasActiveFilters}
          onClear={clearFilters}
        />
      </Stack>
    </Paper>
  );
}
