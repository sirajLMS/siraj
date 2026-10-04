"use client";

import { Box, Chip, FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import { format, isValid } from "date-fns";
import { StatusBadge } from "@/frontend/common/components/ui";
import { AppDatePicker } from "@/frontend/common/components/ui/form/date";
import type { ExpenseType } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  EXPENSE_MONTH_FORMAT,
  EXPENSE_TYPES,
  isExpenseType,
  parseExpenseMonth,
  TYPE_CHIP_PREVIEW_LIMIT,
} from "@/frontend/common/views/dashboard/accounting/expenses/ExpenseFilterBar.helpers";

/** Collapsed multi-select preview: a few type badges, then a "+N" overflow chip. */
function renderTypeValue(
  selected: readonly string[],
  labelsByType: Record<ExpenseType, string>,
  placeholderLabel: string
): React.ReactNode {
  const types = selected.filter(isExpenseType);
  if (types.length === 0) {
    return <Box sx={theme => ({ color: theme.palette.onSurfaceVariant })}>{placeholderLabel}</Box>;
  }
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
      {types.slice(0, TYPE_CHIP_PREVIEW_LIMIT).map(type => (
        <StatusBadge key={type} category="expenseType" status={type} label={labelsByType[type]} />
      ))}
      {types.length > TYPE_CHIP_PREVIEW_LIMIT ? (
        <Chip size="small" sx={{ height: "auto" }} label={`+${types.length - TYPE_CHIP_PREVIEW_LIMIT}`} />
      ) : null}
    </Box>
  );
}

interface TypeFilterSelectProps {
  readonly label: string;
  readonly labelsByType: Record<ExpenseType, string>;
  readonly value: readonly ExpenseType[];
  readonly onChange: (types: readonly ExpenseType[]) => void;
}

/** Multi-select of expense types; badges preview the selection, the label marks an empty one. */
export function TypeFilterSelect({ label, labelsByType, value, onChange }: Readonly<TypeFilterSelectProps>) {
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
        renderValue={selected => renderTypeValue(selected, labelsByType, label)}
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
export function MonthFilter({ label, expenseDate, onChange }: Readonly<MonthFilterProps>) {
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
