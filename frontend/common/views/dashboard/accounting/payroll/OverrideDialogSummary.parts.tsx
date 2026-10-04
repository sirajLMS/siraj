"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { SUMMARY_GRID_SX } from "@/frontend/common/views/dashboard/accounting/payroll/OverrideDialog.constants";
import type { OverrideDialogViewModel } from "@/frontend/common/views/dashboard/accounting/payroll/useOverrideDialogViewModel";

interface SummaryItemProps {
  readonly label: string;
  readonly value: ReactNode;
}

function SummaryItem({ label, value }: Readonly<SummaryItemProps>) {
  return (
    <Stack sx={{ gap: 0.5 }}>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
        {label}
      </Typography>
      {/* The value can be a status chip (block-level), so the wrapper stays a div. */}
      <Box sx={theme => ({ ...theme.typography.bodyMd, fontWeight: 600 })}>{value}</Box>
    </Stack>
  );
}

function formatPaidAmount(amount: string | null, currency: CurrencyCode | null): string {
  if (amount === null) return "—";
  return currency === null ? amount : `${amount} ${currency}`;
}

interface OverrideSummaryCardProps {
  readonly viewModel: OverrideDialogViewModel;
}

/** Read-only snapshot of the row's current calculation values, shown above the override controls. */
export function OverrideSummaryCard({ viewModel }: Readonly<OverrideSummaryCardProps>) {
  const { labels, summary, statusLabels } = viewModel;

  return (
    <Box sx={theme => ({ backgroundColor: theme.palette.surfaceContainer, borderRadius: 2, p: 2.5 })}>
      <Box sx={SUMMARY_GRID_SX}>
        <SummaryItem
          label={labels.override.currentStatus}
          value={
            summary.calculationStatus === null ? (
              "—"
            ) : (
              <StatusBadge
                category="payrollCalculation"
                status={summary.calculationStatus}
                label={statusLabels[summary.calculationStatus]}
              />
            )
          }
        />
        <SummaryItem
          label={labels.column.paidAmount}
          value={formatPaidAmount(summary.teacherPaidAmount, summary.teacherPaidCurrency)}
        />
        <SummaryItem label={labels.column.calculatedDuration} value={summary.calculatedDuration ?? "—"} />
        <SummaryItem label={labels.column.partialPercentage} value={summary.isPartialPercentage ?? "—"} />
        <SummaryItem
          label={labels.column.note}
          // Staff-entered notes are free text: a Latin note inside an RTL locale
          // lets the bidi algorithm relocate trailing punctuation (the period
          // detaches from "…teacher."). The isolate span anchors the note in
          // its own direction regardless of the surrounding locale.
          value={
            <Box component="span" dir="auto" sx={{ unicodeBidi: "isolate" }}>
              {summary.payrollNote ?? "—"}
            </Box>
          }
        />
      </Box>
    </Box>
  );
}
