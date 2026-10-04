"use client";

import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { TeacherAutocomplete } from "@/frontend/common/components/ui/input/userSelect";
import { type CarryoverPaidStatusFilter, useCarryoverFilterStore } from "@/frontend/common/stores/carryoverFilterStore";
import { SEARCH_INPUT_MAX_LENGTH } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar.constants";
import { useDebouncedSearchInput } from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar.hooks";
import {
  DateRangeFilter,
  FilterActions,
  PaidStatusRadioGroup,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar.parts";
import { FilterBarShellShared } from "@/frontend/common/views/dashboard/accounting/components/__shared__/filterBarShellShared";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingCarryover } from "@/shared/locale/namespaces";

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
    <FilterBarShellShared
      paperSx={{ px: { md: 1 } }}
      stackSx={{ gap: { xs: 2, md: 0.5 } }}
      content={
        <>
          <SearchBarField
            placeholder={t.filters.searchPlaceholder}
            value={inputValue}
            onChange={setInputValue}
            clearLabel={t.filters.clear}
            maxLength={SEARCH_INPUT_MAX_LENGTH}
            sx={{ width: "100%", flex: { xs: "1 1 100%", md: "1 1 0" }, minWidth: { md: 232 } }}
          />
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
        </>
      }
      actions={
        <FilterActions
          toggleLabel={t.filters.includeDisabledTeachers}
          includeDisabledTeachers={includeDisabledTeachers}
          onToggle={setIncludeDisabledTeachers}
          clearLabel={t.filters.clear}
          showClear={hasActiveFilters}
          onClear={clearFilters}
        />
      }
    />
  );
}
