"use client";

import { CreditCardOutlined } from "@mui/icons-material";
import { Alert, Chip, Stack, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { type ReactNode, useMemo } from "react";
import type { PaymentsLedgerRow } from "@/frontend/common/views/dashboard/billing/types/paymentsLedger.types";
import type { PaymentsLedgerViewModel } from "@/frontend/common/views/dashboard/billing/usePaymentsLedgerViewModel";
import {
  DesktopAppDataGrid,
  DesktopMetricCardGrid,
  DesktopPageContainer,
  DesktopPageHeader,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import type { PaymentsLedgerLabels } from "@/shared/locale";

const MISSING_VALUE = "—";

function buildPaymentColumns(labels: PaymentsLedgerLabels["columns"]): GridColDef<PaymentsLedgerRow>[] {
  return [
    {
      field: "student",
      headerName: labels.student,
      flex: 1.2,
      minWidth: 160,
      renderCell: ({ row }) => (
        <Typography variant="labelMd" sx={{ fontWeight: 600 }}>
          {row.studentName ?? MISSING_VALUE}
        </Typography>
      ),
    },
    {
      field: "credits",
      headerName: labels.credits,
      flex: 0.8,
      minWidth: 110,
      align: "center",
      headerAlign: "center",
      renderCell: ({ row }) =>
        row.creditHours != null || row.creditsPurchased > 0 ? (
          <Chip size="small" variant="outlined" color="primary" label={row.creditsLabel} sx={{ borderRadius: 2 }} />
        ) : (
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {MISSING_VALUE}
          </Typography>
        ),
    },
    {
      field: "amount",
      headerName: labels.amount,
      flex: 0.9,
      minWidth: 120,
      align: "left",
      headerAlign: "left",
      renderCell: ({ row }) => (
        <Typography
          variant="labelMd"
          sx={theme => ({ fontWeight: 700, fontVariantNumeric: "tabular-nums", color: theme.palette.text.primary })}
        >
          {row.amountLabel}
        </Typography>
      ),
    },
    {
      field: "packageName",
      headerName: labels.packageName,
      flex: 0.9,
      minWidth: 130,
      renderCell: ({ row }) =>
        row.packageName ? (
          <Chip size="small" variant="outlined" label={row.packageName} sx={{ borderRadius: 2 }} />
        ) : (
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {MISSING_VALUE}
          </Typography>
        ),
    },
    {
      field: "method",
      headerName: labels.method,
      flex: 0.9,
      minWidth: 130,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <CreditCardOutlined sx={theme => ({ fontSize: 16, color: theme.palette.text.secondary })} />
          <Typography variant="labelMd">{row.methodLabel}</Typography>
        </Stack>
      ),
    },
    {
      field: "date",
      headerName: labels.date,
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ row }) => (
        <Typography
          variant="labelMd"
          sx={theme => ({ color: theme.palette.text.secondary, fontVariantNumeric: "tabular-nums" })}
        >
          {row.dateLabel}
        </Typography>
      ),
    },
  ];
}

export function PaymentsLedgerDesktopView({
  rows,
  loading,
  showError,
  metrics,
  paginationOptions,
  labels,
  onMetricClick,
}: Readonly<PaymentsLedgerViewModel>): ReactNode {
  const columns = useMemo(() => buildPaymentColumns(labels.columns), [labels.columns]);

  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={labels.pageTitle} subtitle={labels.pageSubtitle} />
      {showError ? <Alert severity="error">{labels.loadError}</Alert> : null}
      {metrics.length > 0 ? <DesktopMetricCardGrid metrics={metrics} onMetricClick={onMetricClick} /> : null}
      <DesktopSectionPanel title={labels.historySectionTitle} contentPadding={false}>
        <DesktopAppDataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={row => row.id}
          emptyMessage={`${labels.emptyTitle}. ${labels.emptySubtitle}`}
          ariaLabel={labels.historySectionTitle}
          paginationOptions={paginationOptions}
          slotProps={{ pagination: { hideRangeLabel: true } }}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
