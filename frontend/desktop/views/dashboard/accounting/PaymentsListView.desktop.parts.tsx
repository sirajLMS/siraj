"use client";

import { ClearOutlined } from "@mui/icons-material";
import { Box, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Tooltip } from "@mui/material";
import { usePaymentsPersonFilterSelection } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentsPersonFiltersShared";
import type { PaymentsListViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel";
import { DesktopAppDateRangePicker } from "@/frontend/desktop/components/ui/form/date";
import {
  ParentAutocompleteDesktop,
  StudentAutocompleteDesktop,
} from "@/frontend/desktop/components/ui/input/userSelect";

/** One-line truncating text block that never overflows its grid cell. */
export function PaymentsCellLine(props: Readonly<{ children: React.ReactNode; secondary?: boolean; mono?: boolean }>) {
  const { children, secondary, mono } = props;
  return (
    <Box
      component="div"
      sx={theme => ({
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        lineHeight: 1.4,
        color: secondary ? theme.palette.onSurfaceVariant : undefined,
        fontSize: secondary ? 12 : 13,
        fontFamily: mono ? "monospace" : undefined,
      })}
    >
      {children}
    </Box>
  );
}

/** Filter bar for the payments list: student, parent, date range and paid-status controls. */
export function PaymentsFiltersBar(props: Readonly<PaymentsListViewModel>) {
  const { t, fromDate, toDate, unpaidOnly, setFromDate, setToDate, setUnpaidOnly, resetFilters, hasActiveFilters } =
    props;

  const { studentValue, parentValue, handleStudentChange, handleParentChange } =
    usePaymentsPersonFilterSelection(props);

  return (
    <Stack direction="row" spacing={2} sx={{ flex: 1, flexWrap: "wrap", alignItems: "center" }}>
      <StudentAutocompleteDesktop
        size="small"
        label={t.filters.student}
        value={studentValue}
        onChange={handleStudentChange}
        sx={{ width: 220, flexShrink: 0 }}
      />
      <ParentAutocompleteDesktop
        size="small"
        label={t.filters.parent}
        value={parentValue}
        onChange={handleParentChange}
        sx={{ width: 220, flexShrink: 0 }}
      />
      <DesktopAppDateRangePicker
        label={t.filters.title}
        fromLabel={t.filters.fromDate}
        toLabel={t.filters.toDate}
        fromDate={fromDate ?? ""}
        toDate={toDate ?? ""}
        onChange={(from, to) => {
          setFromDate(from || null);
          setToDate(to || null);
        }}
        size="small"
      />
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="accounting-payments-paid-filter-label">{t.columns.status}</InputLabel>
        <Select
          labelId="accounting-payments-paid-filter-label"
          value={unpaidOnly ? "unpaid" : "all"}
          label={t.columns.status}
          onChange={e => setUnpaidOnly(e.target.value === "unpaid")}
        >
          <MenuItem value="all">{`${t.status.paid} + ${t.status.unpaid}`}</MenuItem>
          <MenuItem value="unpaid">{t.filters.unpaidOnly}</MenuItem>
        </Select>
      </FormControl>
      {hasActiveFilters ? (
        <Tooltip title={t.filters.clear}>
          <IconButton size="small" onClick={resetFilters} aria-label={t.filters.clear}>
            <ClearOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
    </Stack>
  );
}
