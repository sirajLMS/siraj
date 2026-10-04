"use client";

import { ClearOutlined } from "@mui/icons-material";
import { Box, IconButton, type SelectChangeEvent, Tooltip } from "@mui/material";
import { AppDateRangePicker } from "@/frontend/common/components/ui/form/date";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";
import { StudentAutocomplete, TeacherAutocomplete } from "@/frontend/common/components/ui/input/userSelect";
import { FilterBarShellShared } from "@/frontend/common/views/dashboard/accounting/components/__shared__/filterBarShellShared";
import {
  isCalculationStatus,
  rowStudentId,
  rowStudentName,
  rowTeacherId,
  rowTeacherName,
  SEARCH_INPUT_MAX_LENGTH,
} from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsFilterBar.helpers";
import { usePersonFilterSelection } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsFilterBar.hooks";
import { PayrollStatusFilterSelect } from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsFilterBar.parts";
import type { PayrollReportsViewModel } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";

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
    <FilterBarShellShared
      content={
        <>
          <SearchBarField
            value={search}
            onChange={setSearch}
            placeholder={labels.filters.search}
            maxLength={SEARCH_INPUT_MAX_LENGTH}
            clearLabel={labels.filters.clear}
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
          <PayrollStatusFilterSelect
            filters={labels.filters}
            statusLabels={statusLabels}
            value={calculationStatuses}
            onChange={handleStatusesChange}
          />
        </>
      }
      actions={
        hasActiveFilters ? (
          <Tooltip title={labels.filters.clear}>
            <IconButton size="small" onClick={clearFilters} aria-label={labels.filters.clear}>
              <ClearOutlined fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null
      }
    />
  );
}
