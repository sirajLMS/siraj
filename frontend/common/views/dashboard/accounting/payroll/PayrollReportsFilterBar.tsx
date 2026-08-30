"use client";

import { ClearOutlined, SearchOutlined } from "@mui/icons-material";
import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import { useMemo, useState } from "react";
import { AppDateRangePicker } from "@/frontend/common/components/ui/form/date";
import {
  type PersonOption,
  StudentAutocomplete,
  TeacherAutocomplete,
} from "@/frontend/common/components/ui/input/userSelect";
import { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  PayrollReportRow,
  PayrollReportsViewModel,
} from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";

/**
 * View-model slice consumed by the payroll reports filter bar. The raw search
 * text is stored un-debounced (the view model settles it before querying), so
 * the input never lags behind keystrokes.
 */
export type PayrollReportsFilterBarProps = Pick<
  PayrollReportsViewModel,
  | "labels"
  | "statusLabels"
  | "rows"
  | "teacherId"
  | "studentId"
  | "dateFrom"
  | "dateTo"
  | "calculationStatuses"
  | "search"
  | "setTeacherId"
  | "setStudentId"
  | "setDateFrom"
  | "setDateTo"
  | "setCalculationStatuses"
  | "setSearch"
  | "clearFilters"
  | "hasActiveFilters"
>;

/** Search length accepted by both the report query and the CSV export route. */
const SEARCH_INPUT_MAX_LENGTH = 200;

/** Status chips previewed inside the collapsed multi-select before the overflow chip. */
const STATUS_CHIP_PREVIEW_LIMIT = 2;

const CALCULATION_STATUS_VALUES: readonly string[] = Object.values(CalculationStatus);

function isCalculationStatus(value: string): value is CalculationStatus {
  return CALCULATION_STATUS_VALUES.includes(value);
}

const rowTeacherId = (row: PayrollReportRow): string | null => row.teacherId;
const rowTeacherName = (row: PayrollReportRow): string | null => row.teacherName;
const rowStudentId = (row: PayrollReportRow): string | null => row.studentId;
const rowStudentName = (row: PayrollReportRow): string | null => row.studentName;

/**
 * Display option for a person filter whose id is already applied. The loaded
 * report rows supply the name after a remount or an external filter reset;
 * null when the id matches no row on the current page.
 */
function findRowPersonOption(
  rows: readonly PayrollReportRow[],
  personId: string,
  idOf: (row: PayrollReportRow) => string | null,
  nameOf: (row: PayrollReportRow) => string | null
): PersonOption | null {
  const match = rows.find(row => idOf(row) === personId);
  return match ? { id: personId, name: nameOf(match) ?? "" } : null;
}

interface PersonFilterSelection {
  readonly option: PersonOption | null;
  readonly handleChange: (next: PersonOption | null) => void;
}

/**
 * Bridges the id-only store filter with the autocomplete's option shape: the
 * freshly picked option is kept in local state, and the report rows provide a
 * display fallback when the stored id no longer matches the local option
 * (initial mount, page navigation, or cleared filters).
 */
function usePersonFilterSelection(
  personId: string | null,
  rows: readonly PayrollReportRow[],
  idOf: (row: PayrollReportRow) => string | null,
  nameOf: (row: PayrollReportRow) => string | null,
  setPersonId: (personId: string | null) => void
): PersonFilterSelection {
  const [picked, setPicked] = useState<PersonOption | null>(null);
  const option = useMemo<PersonOption | null>(() => {
    if (personId === null || personId === "") return null;
    if (picked?.id === personId) return picked;
    return findRowPersonOption(rows, personId, idOf, nameOf);
  }, [rows, personId, picked, idOf, nameOf]);
  const handleChange = (next: PersonOption | null) => {
    setPicked(next);
    setPersonId(next?.id ?? null);
  };
  return { option, handleChange };
}

/** Collapsed multi-select preview: a few status chips, then a "+N" overflow chip. */
function renderStatusValue(
  selected: readonly string[],
  statusLabels: Record<CalculationStatus, string>,
  allLabel: string
): React.ReactNode {
  const statuses = selected.filter(isCalculationStatus);
  if (statuses.length === 0) {
    return <Box sx={theme => ({ color: theme.palette.onSurfaceVariant })}>{allLabel}</Box>;
  }
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {statuses.slice(0, STATUS_CHIP_PREVIEW_LIMIT).map(status => (
        <Chip key={status} size="small" label={statusLabels[status]} />
      ))}
      {statuses.length > STATUS_CHIP_PREVIEW_LIMIT ? (
        <Chip size="small" label={`+${statuses.length - STATUS_CHIP_PREVIEW_LIMIT}`} />
      ) : null}
    </Box>
  );
}

export function PayrollReportsFilterBar({
  labels,
  statusLabels,
  rows,
  teacherId,
  studentId,
  dateFrom,
  dateTo,
  calculationStatuses,
  search,
  setTeacherId,
  setStudentId,
  setDateFrom,
  setDateTo,
  setCalculationStatuses,
  setSearch,
  clearFilters,
  hasActiveFilters,
}: Readonly<PayrollReportsFilterBarProps>) {
  const teacherFilter = usePersonFilterSelection(teacherId, rows, rowTeacherId, rowTeacherName, setTeacherId);
  const studentFilter = usePersonFilterSelection(studentId, rows, rowStudentId, rowStudentName, setStudentId);

  const handleStatusesChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selected = typeof value === "string" ? value.split(",") : value;
    setCalculationStatuses(selected.filter(isCalculationStatus));
  };

  const handleDateRangeChange = (nextDateFrom: string, nextDateTo: string) => {
    setDateFrom(nextDateFrom === "" ? null : nextDateFrom);
    setDateTo(nextDateTo === "" ? null : nextDateTo);
  };

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      sx={{ flexWrap: "wrap", gap: 2, alignItems: { xs: "stretch", md: "center" } }}
    >
      <TextField
        size="small"
        placeholder={labels.filters.search}
        value={search}
        onChange={event => setSearch(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined fontSize="small" />
              </InputAdornment>
            ),
          },
          htmlInput: {
            "aria-label": labels.filters.search,
            autoComplete: "off",
            maxLength: SEARCH_INPUT_MAX_LENGTH,
          },
        }}
        sx={{ minWidth: { xs: "100%", sm: 260 } }}
      />
      <TeacherAutocomplete
        size="small"
        label={labels.filters.teacher}
        value={teacherFilter.option}
        onChange={teacherFilter.handleChange}
        sx={{ width: { xs: "100%", sm: 230 }, flexShrink: 0 }}
      />
      <StudentAutocomplete
        size="small"
        label={labels.filters.student}
        value={studentFilter.option}
        onChange={studentFilter.handleChange}
        sx={{ width: { xs: "100%", sm: 230 }, flexShrink: 0 }}
      />
      <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 300px" }, minWidth: { md: 300 } }}>
        <AppDateRangePicker
          label={labels.filters.dateRange}
          fromLabel={labels.filters.dateFrom}
          toLabel={labels.filters.dateTo}
          fromDate={dateFrom ?? ""}
          toDate={dateTo ?? ""}
          onChange={handleDateRangeChange}
          size="small"
        />
      </Box>
      <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 230 } }}>
        <InputLabel id="payroll-reports-status-filter-label" shrink>
          {labels.filters.status}
        </InputLabel>
        <Select
          labelId="payroll-reports-status-filter-label"
          label={labels.filters.status}
          multiple
          value={[...calculationStatuses]}
          onChange={handleStatusesChange}
          renderValue={selected => renderStatusValue(selected, statusLabels, labels.filters.all)}
        >
          {Object.values(CalculationStatus).map(status => (
            <MenuItem key={status} value={status}>
              {statusLabels[status]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {hasActiveFilters ? (
        <Tooltip title={labels.filters.clear}>
          <IconButton size="small" onClick={clearFilters} aria-label={labels.filters.clear}>
            <ClearOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Stack>
  );
}
