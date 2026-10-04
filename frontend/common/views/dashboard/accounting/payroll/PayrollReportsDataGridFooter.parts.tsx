"use client";

import { Stack, Typography } from "@mui/material";
import { SectionPanel, StatusBadge } from "@/frontend/common/components/ui";
import { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatAccountingMoney } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PayrollReportAggregates } from "@/frontend/common/views/dashboard/accounting/payroll/usePayrollReportsViewModel";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

interface AggregateFooterProps {
  readonly aggregates: PayrollReportAggregates;
  readonly labels: PayrollLabels;
  readonly statusLabels: Record<CalculationStatus, string>;
}

/** Aggregate summary card under the grid: total paid amount plus per-status row counts. */
export function AggregateFooter({ aggregates, labels, statusLabels }: Readonly<AggregateFooterProps>) {
  return (
    <SectionPanel>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{
          flexWrap: "wrap",
          gap: 3,
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
        }}
      >
        <Stack sx={{ gap: 0.5 }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.aggregate.totalPaid}
          </Typography>
          <Stack direction="row" sx={{ alignItems: "baseline", gap: 1 }}>
            <Typography variant="titleLg">{formatAccountingMoney(aggregates.totalPaidAmount)}</Typography>
            {aggregates.totalPaidCurrency !== null ? (
              <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                {aggregates.totalPaidCurrency}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
        <Stack sx={{ gap: 0.5 }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.aggregate.rowCount}
          </Typography>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5 }}>
            {Object.values(CalculationStatus).map(status => (
              <Stack key={status} direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
                <StatusBadge category="payrollCalculation" status={status} label={statusLabels[status]} />
                <Typography variant="bodyMd">{aggregates.rowCountByStatus[status]}</Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </SectionPanel>
  );
}
