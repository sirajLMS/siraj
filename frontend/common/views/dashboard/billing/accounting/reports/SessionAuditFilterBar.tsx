"use client";

import { ClearOutlined } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";
import { StudentAutocomplete, TeacherAutocomplete } from "@/frontend/common/components/ui/input/userSelect";
import {
  isDateRangeInverted,
  rowStudentId,
  rowStudentName,
  rowTeacherId,
  rowTeacherName,
  SEARCH_INPUT_MAX_LENGTH,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditFilterBar.helpers";
import { usePersonFilterSelection } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditFilterBar.hooks";
import {
  DateRangeFilter,
  StatusFilterSelect,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditFilterBar.parts";
import type { SessionAuditReportsViewModel } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";

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
        flex: { lg: 1 },
        flexWrap: "wrap",
        gap: { xs: 2, lg: 1.5 },
        alignItems: "center",
      }}
    >
      <SearchBarField
        value={search}
        onChange={setSearch}
        placeholder={labels.filters.search}
        maxLength={SEARCH_INPUT_MAX_LENGTH}
        clearLabel={labels.filters.clearSearch}
        sx={{ width: { xs: "100%", lg: "auto" }, flex: { lg: "1 1 0" }, minWidth: { lg: 210 } }}
      />
      <TeacherAutocomplete
        size="small"
        label={labels.filters.teacher}
        value={teacherFilter.option}
        onChange={teacherFilter.handleChange}
        sx={{ width: { xs: "100%", lg: "auto" }, flex: { lg: "1 1 0" }, minWidth: { lg: 180 } }}
      />
      <StudentAutocomplete
        size="small"
        label={labels.filters.student}
        value={studentFilter.option}
        onChange={studentFilter.handleChange}
        sx={{ width: { xs: "100%", lg: "auto" }, flex: { lg: "1 1 0" }, minWidth: { lg: 180 } }}
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
        <Button
          size="small"
          startIcon={<ClearOutlined fontSize="small" />}
          onClick={clearFilters}
          sx={{ justifySelf: "start" }}
        >
          {labels.filters.clear}
        </Button>
      ) : null}
    </Box>
  );
}
