"use client";

import { ClearOutlined, SearchOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { useEffect, useState } from "react";
import { AppDatePicker, AppDateRangePicker } from "@/frontend/common/components/ui/form/date";
import { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import { useExpenseFilterStore } from "@/frontend/common/stores/expenseFilterStore";
import { ExpenseTypeChip } from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseTypeChip";
import { useAppTranslation } from "@/shared/locale/client";
import { DashboardAccountingExpenses } from "@/shared/locale/namespaces";

/** Delay before settled title text is pushed into the expense filter store. */
const SEARCH_DEBOUNCE_MS = 300;

/** Title length accepted by both the expenses query and the CSV export route. */
const TITLE_INPUT_MAX_LENGTH = 200;

/** Type chips previewed inside the collapsed multi-select before the overflow chip. */
const TYPE_CHIP_PREVIEW_LIMIT = 2;

/** Display + wire format for the expense-month filter (year-month only). */
const EXPENSE_MONTH_FORMAT = "yyyy-MM";

const EXPENSE_TYPES: readonly ExpenseType[] = Object.values(ExpenseType);

/** String view of the enum values so the type guard avoids enum/string comparisons. */
const EXPENSE_TYPE_VALUES: readonly string[] = EXPENSE_TYPES;

function isExpenseType(value: string): value is ExpenseType {
  return EXPENSE_TYPE_VALUES.includes(value);
}

/** Parses the `YYYY-MM` store value into a calendar date for the month picker. */
function parseExpenseMonth(expenseDate: string): Date | null {
  const parsed = parse(expenseDate, EXPENSE_MONTH_FORMAT, new Date());
  if (!isValid(parsed)) return null;
  return parsed;
}

interface TitleInputState {
  readonly inputValue: string;
  readonly setInputValue: (value: string) => void;
}

/**
 * Local title text mirroring the store: keystrokes update the input instantly
 * and the store (which drives the query) only receives the settled text after
 * the debounce window. External store resets (e.g. Clear) re-echo into the
 * input through the render-time adjustment (React's recommended alternative to
 * resetting state inside an effect), which then makes the debounce a no-op.
 */
function useDebouncedTitleInput(title: string, setTitle: (value: string) => void): TitleInputState {
  const [inputValue, setInputValue] = useState(title);
  const [syncedTitle, setSyncedTitle] = useState(title);
  if (syncedTitle !== title) {
    setSyncedTitle(title);
    setInputValue(title);
  }
  useEffect(() => {
    if (inputValue === title) return undefined;
    const timeout = setTimeout(() => setTitle(inputValue), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [inputValue, title, setTitle]);
  return { inputValue, setInputValue };
}

interface TitleSearchFieldProps {
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

function TitleSearchField({ placeholder, value, onChange }: Readonly<TitleSearchFieldProps>) {
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
          maxLength: TITLE_INPUT_MAX_LENGTH,
        },
      }}
      sx={{ width: "100%", flex: { xs: "1 1 100%", md: "1 1 0" }, minWidth: { md: 220 } }}
    />
  );
}

interface TypeFilterSelectProps {
  readonly label: string;
  readonly labelsByType: Record<ExpenseType, string>;
  readonly value: readonly ExpenseType[];
  readonly onChange: (types: readonly ExpenseType[]) => void;
}

/** Collapsed multi-select preview: a few type chips, then a "+N" overflow chip. */
function renderTypeValue(selected: readonly string[], placeholderLabel: string): React.ReactNode {
  const types = selected.filter(isExpenseType);
  if (types.length === 0) {
    return <Box sx={theme => ({ color: theme.palette.onSurfaceVariant })}>{placeholderLabel}</Box>;
  }
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {types.slice(0, TYPE_CHIP_PREVIEW_LIMIT).map(type => (
        <ExpenseTypeChip key={type} type={type} />
      ))}
      {types.length > TYPE_CHIP_PREVIEW_LIMIT ? (
        <Chip size="small" sx={{ height: "auto" }} label={`+${types.length - TYPE_CHIP_PREVIEW_LIMIT}`} />
      ) : null}
    </Box>
  );
}

/** Multi-select of expense types; chips preview the selection, the label marks an empty one. */
function TypeFilterSelect({ label, labelsByType, value, onChange }: Readonly<TypeFilterSelectProps>) {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const next = event.target.value;
    const selected = typeof next === "string" ? next.split(",") : next;
    onChange(selected.filter(isExpenseType));
  };
  return (
    <FormControl size="small" sx={{ width: { xs: "100%", md: "auto" }, flex: { md: "1 1 0" }, minWidth: { md: 220 } }}>
      <InputLabel id="expense-type-filter-label" shrink>
        {label}
      </InputLabel>
      <Select
        labelId="expense-type-filter-label"
        label={label}
        multiple
        displayEmpty
        value={[...value]}
        onChange={handleChange}
        renderValue={selected => renderTypeValue(selected, label)}
      >
        {EXPENSE_TYPES.map(type => (
          <MenuItem key={type} value={type}>
            {labelsByType[type]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

interface MonthFilterProps {
  readonly label: string;
  readonly expenseDate: string | null;
  readonly onChange: (expenseDate: string | null) => void;
}

/** Year-month picker for the accounting month filter; clearing it selects all months. */
function MonthFilter({ label, expenseDate, onChange }: Readonly<MonthFilterProps>) {
  const pickerValue = expenseDate === null ? null : parseExpenseMonth(expenseDate);
  const handleChange = (next: Date | null) => {
    if (next === null || !isValid(next)) {
      onChange(null);
      return;
    }
    onChange(format(next, EXPENSE_MONTH_FORMAT));
  };
  return (
    <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 0" }, minWidth: { md: 180 } }}>
      <AppDatePicker
        label={label}
        value={pickerValue}
        onChange={handleChange}
        views={["year", "month"]}
        openTo="month"
        format={EXPENSE_MONTH_FORMAT}
        slotProps={{
          textField: {
            size: "small",
            fullWidth: true,
            slotProps: {
              htmlInput: { "aria-label": label, autoComplete: "off" },
            },
          },
        }}
      />
    </Box>
  );
}

interface PaymentDateRangeProps {
  readonly label: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly paymentDateFrom: string | null;
  readonly paymentDateTo: string | null;
  readonly onDateFromChange: (paymentDateFrom: string | null) => void;
  readonly onDateToChange: (paymentDateTo: string | null) => void;
}

function PaymentDateRangeFilter({
  label,
  fromLabel,
  toLabel,
  paymentDateFrom,
  paymentDateTo,
  onDateFromChange,
  onDateToChange,
}: Readonly<PaymentDateRangeProps>) {
  const handleChange = (nextDateFrom: string, nextDateTo: string) => {
    onDateFromChange(nextDateFrom === "" ? null : nextDateFrom);
    onDateToChange(nextDateTo === "" ? null : nextDateTo);
  };
  return (
    <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 0" }, minWidth: { md: 280 } }}>
      <AppDateRangePicker
        label={label}
        fromLabel={fromLabel}
        toLabel={toLabel}
        fromDate={paymentDateFrom ?? ""}
        toDate={paymentDateTo ?? ""}
        onChange={handleChange}
        size="small"
      />
    </Box>
  );
}

interface FilterActionsProps {
  readonly toggleLabel: string;
  readonly includeDeleted: boolean;
  readonly onToggle: (includeDeleted: boolean) => void;
  readonly clearLabel: string;
  /** Clear only exists while a filter is active, so it always reads as interactive. */
  readonly showClear: boolean;
  readonly onClear: () => void;
}

function FilterActions({
  toggleLabel,
  includeDeleted,
  onToggle,
  clearLabel,
  showClear,
  onClear,
}: Readonly<FilterActionsProps>) {
  return (
    <Stack
      direction="row"
      sx={{
        gap: 2,
        alignItems: "center",
        flex: { xs: "1 1 100%", md: "0 1 auto" },
        justifyContent: { xs: "space-between", md: "flex-start" },
      }}
    >
      <FormControlLabel
        control={<Switch size="small" checked={includeDeleted} onChange={event => onToggle(event.target.checked)} />}
        label={toggleLabel}
      />
      {showClear ? (
        <Button
          size="small"
          variant="text"
          color="primary"
          startIcon={<ClearOutlined fontSize="small" />}
          onClick={onClear}
        >
          {clearLabel}
        </Button>
      ) : null}
    </Stack>
  );
}

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
    <Paper variant="outlined" sx={{ p: 2, width: "100%" }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ flexWrap: "wrap", gap: 2, alignItems: { xs: "stretch", md: "center" } }}
      >
        <TitleSearchField placeholder={t.filters.searchPlaceholder} value={inputValue} onChange={setInputValue} />
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
        <FilterActions
          toggleLabel={t.filters.includeDeleted}
          includeDeleted={includeDeleted}
          onToggle={setIncludeDeleted}
          clearLabel={t.filters.clear}
          showClear={hasActiveFilters}
          onClear={clearFilters}
        />
      </Stack>
    </Paper>
  );
}
