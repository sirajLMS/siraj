"use client";

import { ClearOutlined } from "@mui/icons-material";
import { Box, Button, FormControlLabel, Stack, Switch } from "@mui/material";
import { AppDateRangePicker } from "@/frontend/common/components/ui/form/date";

interface PaymentDateRangeProps {
  readonly label: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly paymentDateFrom: string | null;
  readonly paymentDateTo: string | null;
  readonly onDateFromChange: (paymentDateFrom: string | null) => void;
  readonly onDateToChange: (paymentDateTo: string | null) => void;
}

export function PaymentDateRangeFilter({
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

export function FilterActions({
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
