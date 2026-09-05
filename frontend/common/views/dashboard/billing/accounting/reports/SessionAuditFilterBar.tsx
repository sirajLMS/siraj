"use client";

import { ClearOutlined, SearchOutlined } from "@mui/icons-material";
import {
  Box,
  Chip,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
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
import { SessionAuditStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  SessionAuditReportRow,
  SessionAuditReportsViewModel,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

/**
 * View-model slice consumed by the session audit filter bar. The raw search
 * text is stored un-debounced (the view model settles it before querying), so
 * the input never lags behind keystrokes.
 */
export type SessionAuditFilterBarProps = Pick<
  SessionAuditReportsViewModel,
  | "labels"
  | "rows"
  | "teacherId"
  | "studentId"
  | "dateFrom"
  | "dateTo"
  | "currentStatuses"
  | "search"
  | "setTeacherId"
  | "setStudentId"
  | "setDateFrom"
  | "setDateTo"
  | "setCurrentStatuses"
  | "setSearch"
  | "clearFilters"
  | "hasActiveFilters"
>;

/** Search length accepted by both the report query and the CSV export route. */
const SEARCH_INPUT_MAX_LENGTH = 200;

/** Status chips previewed inside the collapsed multi-select before the overflow chip. */
const STATUS_CHIP_PREVIEW_LIMIT = 2;

const SESSION_AUDIT_STATUS_VALUES: readonly string[] = Object.values(SessionAuditStatus);

function isSessionAuditStatus(value: string): value is SessionAuditStatus {
  return SESSION_AUDIT_STATUS_VALUES.includes(value);
}

const rowTeacherId = (row: SessionAuditReportRow): string | null => row.teacherId;
const rowTeacherName = (row: SessionAuditReportRow): string | null => row.teacherName;
const rowStudentId = (row: SessionAuditReportRow): string | null => row.studentId;
const rowStudentName = (row: SessionAuditReportRow): string | null => row.studentName;

function findRowPersonOption(
  rows: readonly SessionAuditReportRow[],
  personId: string,
  idOf: (row: SessionAuditReportRow) => string | null,
  nameOf: (row: SessionAuditReportRow) => string | null
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
 * (initial mount after URL hydration, or an external filter reset).
 */
function usePersonFilterSelection(
  personId: string | null,
  rows: readonly SessionAuditReportRow[],
  idOf: (row: SessionAuditReportRow) => string | null,
  nameOf: (row: SessionAuditReportRow) => string | null,
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
  statusLabels: SessionAuditLabels["status"],
  allLabel: string
): React.ReactNode {
  const statuses = selected.filter(isSessionAuditStatus);
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

/** True when both range bounds are set and the from date follows the to date. */
function isDateRangeInverted(dateFrom: string | null, dateTo: string | null): boolean {
  if (dateFrom === null || dateFrom === "" || dateTo === null || dateTo === "") return false;
  return dateFrom > dateTo;
}

interface StatusFilterSelectProps {
  readonly labels: Pick<SessionAuditLabels, "filters" | "status">;
  readonly currentStatuses: readonly SessionAuditStatus[];
  readonly setCurrentStatuses: (statuses: SessionAuditStatus[]) => void;
}

/** Multi-select of audit statuses; chips preview the selection, "all" copy marks an empty one. */
function StatusFilterSelect({ labels, currentStatuses, setCurrentStatuses }: Readonly<StatusFilterSelectProps>) {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selected = typeof value === "string" ? value.split(",") : value;
    setCurrentStatuses(selected.filter(isSessionAuditStatus));
  };
  return (
    <FormControl size="small" sx={{ width: { xs: "100%", lg: "auto" }, minWidth: { lg: 230 } }}>
      <InputLabel id="session-audit-status-filter-label" shrink>
        {labels.filters.status}
      </InputLabel>
      <Select
        labelId="session-audit-status-filter-label"
        label={labels.filters.status}
        multiple
        value={[...currentStatuses]}
        onChange={handleChange}
        renderValue={selected => renderStatusValue(selected, labels.status, labels.filters.all)}
      >
        {Object.values(SessionAuditStatus).map(status => (
          <MenuItem key={status} value={status}>
            {labels.status[status]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

interface DateRangeFilterProps {
  readonly labels: SessionAuditLabels["filters"];
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  /** Validation copy shown when the range is inverted; null hides the helper text. */
  readonly invalidRangeMessage: string | null;
  readonly onRangeChange: (dateFrom: string, dateTo: string) => void;
}

/** Date-range picker cell: spans both tablet grid columns and surfaces inverted-range copy inline. */
function DateRangeFilter({
  labels,
  dateFrom,
  dateTo,
  invalidRangeMessage,
  onRangeChange,
}: Readonly<DateRangeFilterProps>) {
  return (
    <Box
      sx={{
        gridColumn: { sm: "span 2" },
        width: { xs: "100%", lg: "auto" },
        flex: { lg: "1 1 300px" },
        minWidth: { lg: 300 },
        // The read-only range trigger carries no start adornment, so MUI keeps
        // its label inside the field until a range is picked while the labeled
        // sibling controls float from the start. Pin the label in the shrunk
        // position and open the outline notch so the control reads like its
        // siblings; the RTL Emotion cache flips the translate X exactly as it
        // does for MUI's own label styles, keeping RTL placement identical.
        "& .MuiInputLabel-root": {
          userSelect: "none",
          pointerEvents: "auto",
          maxWidth: "calc(133% - 32px)",
          transform: "translate(14px, -9px) scale(0.75)",
        },
        "& .MuiOutlinedInput-notchedOutline legend": {
          maxWidth: "100%",
        },
      }}
    >
      <AppDateRangePicker
        label={labels.dateRange}
        fromLabel={labels.dateFrom}
        toLabel={labels.dateTo}
        fromDate={dateFrom ?? ""}
        toDate={dateTo ?? ""}
        onChange={onRangeChange}
        size="small"
      />
      {invalidRangeMessage === null ? null : <FormHelperText error>{invalidRangeMessage}</FormHelperText>}
    </Box>
  );
}

export function SessionAuditFilterBar({
  labels,
  rows,
  teacherId,
  studentId,
  dateFrom,
  dateTo,
  currentStatuses,
  search,
  setTeacherId,
  setStudentId,
  setDateFrom,
  setDateTo,
  setCurrentStatuses,
  setSearch,
  clearFilters,
  hasActiveFilters,
}: Readonly<SessionAuditFilterBarProps>) {
  const teacherFilter = usePersonFilterSelection(teacherId, rows, rowTeacherId, rowTeacherName, setTeacherId);
  const studentFilter = usePersonFilterSelection(studentId, rows, rowStudentId, rowStudentName, setStudentId);

  const handleDateRangeChange = (nextDateFrom: string, nextDateTo: string) => {
    setDateFrom(nextDateFrom === "" ? null : nextDateFrom);
    setDateTo(nextDateTo === "" ? null : nextDateTo);
  };

  const invalidRangeMessage = isDateRangeInverted(dateFrom, dateTo) ? labels.error.dateRangeInvalid : null;

  return (
    <Box
      sx={{
        display: { xs: "grid", lg: "flex" },
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
        },
        flexWrap: "wrap",
        gap: 2,
        alignItems: "center",
      }}
    >
      <TextField
        size="small"
        label={labels.filters.search}
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
        sx={{ width: { xs: "100%", lg: "auto" }, minWidth: { lg: 260 } }}
      />
      <TeacherAutocomplete
        size="small"
        label={labels.filters.teacher}
        value={teacherFilter.option}
        onChange={teacherFilter.handleChange}
        sx={{ width: { xs: "100%", lg: 230 }, flexShrink: 0 }}
      />
      <StudentAutocomplete
        size="small"
        label={labels.filters.student}
        value={studentFilter.option}
        onChange={studentFilter.handleChange}
        sx={{ width: { xs: "100%", lg: 230 }, flexShrink: 0 }}
      />
      <StatusFilterSelect labels={labels} currentStatuses={currentStatuses} setCurrentStatuses={setCurrentStatuses} />
      <DateRangeFilter
        labels={labels.filters}
        dateFrom={dateFrom}
        dateTo={dateTo}
        invalidRangeMessage={invalidRangeMessage}
        onRangeChange={handleDateRangeChange}
      />
      {hasActiveFilters ? (
        <Tooltip title={labels.filters.clear}>
          <IconButton
            size="small"
            onClick={clearFilters}
            aria-label={labels.filters.clear}
            sx={{ justifySelf: "start" }}
          >
            <ClearOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}
