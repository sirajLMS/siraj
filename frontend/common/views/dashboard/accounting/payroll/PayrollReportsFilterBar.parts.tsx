"use client";

import { FormControl, InputLabel, MenuItem, Select, type SelectChangeEvent } from "@mui/material";
import { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { renderStatusValue } from "@/frontend/common/views/dashboard/__shared__";
import {
  isCalculationStatus,
  STATUS_CHIP_PREVIEW_LIMIT,
} from "@/frontend/common/views/dashboard/accounting/payroll/PayrollReportsFilterBar.helpers";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

const STATUS_FILTER_LABEL_ID = "payroll-reports-status-filter-label";

interface PayrollStatusFilterSelectProps {
  readonly filters: PayrollLabels["filters"];
  readonly statusLabels: Record<CalculationStatus, string>;
  readonly value: readonly CalculationStatus[];
  readonly onChange: (event: SelectChangeEvent<string[]>) => void;
}

/** Multi-select of calculation statuses with a collapsed chip preview. */
export function PayrollStatusFilterSelect({
  filters,
  statusLabels,
  value,
  onChange,
}: Readonly<PayrollStatusFilterSelectProps>) {
  return (
    <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 230 } }}>
      <InputLabel id={STATUS_FILTER_LABEL_ID} shrink>
        {filters.status}
      </InputLabel>
      <Select
        labelId={STATUS_FILTER_LABEL_ID}
        label={filters.status}
        multiple
        value={[...value]}
        onChange={onChange}
        renderValue={selected =>
          renderStatusValue(selected, statusLabels, filters.all, isCalculationStatus, STATUS_CHIP_PREVIEW_LIMIT)
        }
      >
        {Object.values(CalculationStatus).map(status => (
          <MenuItem key={status} value={status}>
            {statusLabels[status]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
