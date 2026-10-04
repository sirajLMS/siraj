"use client";

import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField/SearchBarField";
import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import { useExpenseFilterStore } from "@/frontend/common/stores/expenseFilterStore";
import { FilterBarShellShared } from "@/frontend/common/views/dashboard/accounting/components/__shared__/filterBarShellShared";
import {
  FilterActions,
  PaymentDateRangeFilter,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar.actions";
import { TITLE_INPUT_MAX_LENGTH } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar.helpers";
import { useDebouncedTitleInput } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar.hooks";
import {
  MonthFilter,
  TypeFilterSelect,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar.parts";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses } from "@/shared/locale/namespaces";

/**
 * Expense ledger filter bar: debounced title search, expense-type multi-select,
 * accounting-month picker, payment-date range, and an include-deleted toggle.
 * Reads and writes the shared expense filter store so the grid, pager, and CSV
 * export all consume the same filter state.
 */
export function ExpenseFilterBar() {
  const t = useAppTranslation(DashboardAccountingExpenses);

  const title = useExpenseFilterStore(state => state.title);
  const types = useExpenseFilterStore(state => state.types);
  const expenseDate = useExpenseFilterStore(state => state.expenseDate);
  const paymentDateFrom = useExpenseFilterStore(state => state.paymentDateFrom);
  const paymentDateTo = useExpenseFilterStore(state => state.paymentDateTo);
  const includeDeleted = useExpenseFilterStore(state => state.includeDeleted);
  const setTitle = useExpenseFilterStore(state => state.setTitle);
  const setTypes = useExpenseFilterStore(state => state.setTypes);
  const setExpenseDate = useExpenseFilterStore(state => state.setExpenseDate);
  const setPaymentDateFrom = useExpenseFilterStore(state => state.setPaymentDateFrom);
  const setPaymentDateTo = useExpenseFilterStore(state => state.setPaymentDateTo);
  const setIncludeDeleted = useExpenseFilterStore(state => state.setIncludeDeleted);
  const clearFilters = useExpenseFilterStore(state => state.clearFilters);

  const { inputValue, setInputValue } = useDebouncedTitleInput(title, setTitle);

  const labelsByType: Record<ExpenseType, string> = {
    [ExpenseType.Salaries]: t.type.Salaries,
    [ExpenseType.Marketing]: t.type.Marketing,
    [ExpenseType.Logistics]: t.type.Logistics,
    [ExpenseType.Technology]: t.type.Technology,
  };

  const hasActiveFilters =
    title !== "" ||
    types.length > 0 ||
    expenseDate !== null ||
    paymentDateFrom !== null ||
    paymentDateTo !== null ||
    includeDeleted;

  return (
    <FilterBarShellShared
      content={
        <>
          <SearchBarField
            value={inputValue}
            onChange={setInputValue}
            placeholder={t.filters.searchPlaceholder}
            maxLength={TITLE_INPUT_MAX_LENGTH}
            clearLabel={t.filters.clear}
            sx={{ width: "100%", flex: { xs: "1 1 100%", md: "1 1 0" }, minWidth: { md: 220 } }}
          />
          <TypeFilterSelect label={t.filters.type} labelsByType={labelsByType} value={types} onChange={setTypes} />
          <MonthFilter label={t.filters.expenseDate} expenseDate={expenseDate} onChange={setExpenseDate} />
          <PaymentDateRangeFilter
            label={t.filters.paymentDateRange}
            fromLabel={t.filters.paymentDateFrom}
            toLabel={t.filters.paymentDateTo}
            paymentDateFrom={paymentDateFrom}
            paymentDateTo={paymentDateTo}
            onDateFromChange={setPaymentDateFrom}
            onDateToChange={setPaymentDateTo}
          />
        </>
      }
      actions={
        <FilterActions
          toggleLabel={t.filters.includeDeleted}
          includeDeleted={includeDeleted}
          onToggle={setIncludeDeleted}
          clearLabel={t.filters.clear}
          showClear={hasActiveFilters}
          onClear={clearFilters}
        />
      }
    />
  );
}
