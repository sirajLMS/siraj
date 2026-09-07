"use client";

import { ClearOutlined, SearchOutlined } from "@mui/icons-material";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  InputAdornment,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Tooltip,
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

/** Paid-status radio choices, All-first, laid out reading-start to reading-end (mirrors under dir=rtl). */
const PAID_STATUS_FILTERS: readonly CarryoverPaidStatusFilter[] = ["Both", "Unpaid", "Paid"];

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
      sx={{ width: "100%", flex: { xs: "1 1 100%", md: "1 1 0" }, minWidth: { md: 232 } }}
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
    <FormControl component="fieldset" variant="standard" sx={{ flex: { md: "1 1 0" }, minWidth: { md: 248 } }}>
      <FormLabel id="carryover-paid-status-label" sx={{ typography: "bodyMd" }}>
        {groupLabel}
      </FormLabel>
      <RadioGroup
        row
        aria-labelledby="carryover-paid-status-label"
        value={value}
        onChange={handleChange}
        sx={{ flexWrap: "nowrap", gap: 1, "& .MuiFormControlLabel-root": { mx: 0 } }}
      >
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
    <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 0" }, minWidth: { md: 200 } }}>
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
  /** Clear only exists while a filter is active, so it always reads as interactive. */
  readonly showClear: boolean;
  readonly onClear: () => void;
}

function FilterActions({
  toggleLabel,
  includeDisabledTeachers,
  onToggle,
  clearLabel,
  showClear,
  onClear,
}: Readonly<FilterActionsProps>) {
  return (
    <Stack
      direction="row"
      sx={{
        gap: 1,
        alignItems: "center",
        flex: { xs: "1 1 100%", md: "0 0 auto" },
        flexShrink: 1,
        minWidth: 0,
        justifyContent: { xs: "space-between", md: "flex-start" },
        whiteSpace: "nowrap",
      }}
    >
      <FormControlLabel
        control={
          <Switch size="small" checked={includeDisabledTeachers} onChange={event => onToggle(event.target.checked)} />
        }
        label={toggleLabel}
        sx={{ m: 0 }}
      />
      {showClear ? (
        <Tooltip title={clearLabel}>
          <IconButton size="small" color="primary" aria-label={clearLabel} onClick={onClear}>
            <ClearOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
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
    <Paper variant="outlined" sx={{ p: 2, px: { md: 1 }, width: "100%" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ flexWrap: "wrap", gap: { xs: 2, md: 0.5 }, alignItems: { xs: "stretch", md: "center" } }}
      >
        <SearchTextField placeholder={t.filters.searchPlaceholder} value={inputValue} onChange={setInputValue} />
        <TeacherAutocomplete
          size="small"
          label={t.filters.teacher}
          placeholder={t.filters.teacherPlaceholder}
          value={teacherSelection}
          onChange={setTeacher}
          sx={{ width: { xs: "100%", md: "auto" }, flex: { md: "1 1 0" }, minWidth: { md: 190 } }}
        />
        <PaidStatusRadioGroup
          groupLabel={t.filters.paidStatus}
          labels={paidStatusLabels}
          value={paidStatus}
          onChange={setPaidStatus}
        />
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
          showClear={hasActiveFilters}
          onClear={clearFilters}
        />
      </Stack>
    </Paper>
  );
}
