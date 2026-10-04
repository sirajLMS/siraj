"use client";

import { ClearOutlined } from "@mui/icons-material";
import {
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Tooltip,
} from "@mui/material";
import type { ChangeEvent } from "react";
import { AppDateRangePicker } from "@/frontend/common/components/ui/form/date";
import type { CarryoverPaidStatusFilter } from "@/frontend/common/stores/carryoverFilterStore";
import {
  isPaidStatusFilter,
  PAID_STATUS_FILTERS,
} from "@/frontend/common/views/dashboard/accounting/carryover/CarryoverFilterBar.constants";

interface PaidStatusRadioGroupProps {
  readonly groupLabel: string;
  readonly labels: Record<CarryoverPaidStatusFilter, string>;
  readonly value: CarryoverPaidStatusFilter;
  readonly onChange: (status: CarryoverPaidStatusFilter) => void;
}

export function PaidStatusRadioGroup({ groupLabel, labels, value, onChange }: Readonly<PaidStatusRadioGroupProps>) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
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

export function DateRangeFilter({
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

export function FilterActions({
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
