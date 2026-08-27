"use client";

import {
  ClearOutlined,
  CreditScoreOutlined,
  HourglassTopOutlined,
  PaymentsOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import { ErrorState } from "@/frontend/common/components/ui/state/ErrorState";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  formatAccountingDate,
  formatAccountingMoney,
  paymentStatusTone,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PaymentsListViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

function FiltersBar(props: Readonly<PaymentsListViewModel>) {
  const { t, fromDate, toDate, unpaidOnly, setFromDate, setToDate, setUnpaidOnly, resetFilters, hasActiveFilters } =
    props;
  return (
    <Stack direction="row" spacing={2} sx={{ flex: 1, flexWrap: "wrap", alignItems: "center" }}>
      <TextField
        size="small"
        type="date"
        label={t.filters.fromDate}
        value={fromDate ?? ""}
        onChange={e => setFromDate(e.target.value || null)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 165 }}
      />
      <TextField
        size="small"
        type="date"
        label={t.filters.toDate}
        value={toDate ?? ""}
        onChange={e => setToDate(e.target.value || null)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 165 }}
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

export function PaymentsListDesktop(props: Readonly<PaymentsListViewModel>) {
  const { t, rows, loading, error, metrics } = props;
  const router = useRouter();

  const columns = useMemo<GridColDef[]>(() => {
    const cols: GridColDef[] = [
      {
        field: "studentName",
        headerName: t.columns.studentName,
        flex: 1.2,
        minWidth: 165,
        renderCell: params => (
          <Box>
            <Box component="div">{params.row.studentName ?? "—"}</Box>
            {params.row.parentName ? (
              <Box component="div" sx={{ color: "text.secondary", fontSize: 11 }}>
                {params.row.parentName}
              </Box>
            ) : null}
          </Box>
        ),
      },
      {
        field: "creditHours",
        headerName: t.columns.credit,
        width: 105,
        type: "number",
        valueFormatter: (value: unknown) => (value == null ? "—" : `${Number(String(value)).toFixed(2)} h`),
      },
      {
        field: "amount",
        headerName: t.columns.paid,
        flex: 1,
        minWidth: 130,
        align: "right",
        headerAlign: "right",
        renderCell: params => (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "baseline" }}>
            <Box component="span" sx={{ fontWeight: 600 }}>
              {formatAccountingMoney(params.row.amount)}
            </Box>
            <Box component="span" sx={{ color: "text.secondary", fontSize: 12 }}>
              {params.row.currency ?? ""}
            </Box>
          </Stack>
        ),
      },
      {
        field: "packageName",
        headerName: t.columns.package,
        flex: 1,
        minWidth: 150,
        renderCell: params =>
          params.row.packageName ? (
            <Box>
              <Box component="div">{params.row.packageName}</Box>
              {params.row.packageCodename ? (
                <Box component="div" sx={{ color: "text.secondary", fontSize: 11, fontFamily: "monospace" }}>
                  {params.row.packageCodename}
                </Box>
              ) : null}
            </Box>
          ) : (
            "—"
          ),
      },
      {
        field: "paymentGateway",
        headerName: t.columns.paymentGateway,
        width: 150,
        valueGetter: (value: unknown) => (t.gateways as Record<string, string>)[String(value)] ?? String(value ?? "—"),
      },
      {
        field: "paymentDate",
        headerName: t.columns.paymentDate,
        width: 120,
        valueFormatter: (value: unknown) => formatAccountingDate(value == null ? null : String(value)),
      },
      {
        field: "createdAt",
        headerName: t.columns.createdAt,
        width: 120,
        valueFormatter: (value: unknown) => formatAccountingDate(value == null ? null : String(value)),
      },
      {
        field: "isPaidStatusOn",
        headerName: t.columns.status,
        width: 118,
        renderCell: params => (
          <Chip
            size="small"
            variant={params.row.isPaidStatusOn ? "outlined" : "filled"}
            color={paymentStatusTone(Boolean(params.row.isPaidStatusOn))}
            label={params.row.isPaidStatusOn ? t.status.paid : t.status.unpaid}
          />
        ),
      },
      {
        field: "actions",
        headerName: t.columns.actions,
        width: 80,
        sortable: false,
        renderCell: params => (
          <Tooltip title={t.paymentDetails}>
            <Link href={`/accounting/payments/${params.row.id}`} style={{ textDecoration: "none" }}>
              <Chip size="small" label={t.detail.editAction} clickable />
            </Link>
          </Tooltip>
        ),
      },
    ];
    return cols;
  }, [t]);

  const metricItems = useMemo<MetricItem[]>(
    () => [
      {
        key: "payments-total",
        count: metrics.total,
        label: t.pageTitle,
        labelKey: "dashboard.accounting.payments.pageTitle",
        icon: PaymentsOutlined,
      },
      {
        key: "payments-paid",
        count: metrics.paid,
        label: t.status.paid,
        labelKey: "dashboard.accounting.payments.status.paid",
        icon: CreditScoreOutlined,
      },
      {
        key: "payments-unpaid",
        count: metrics.unpaid,
        label: t.status.unpaid,
        labelKey: "dashboard.accounting.payments.status.unpaid",
        icon: PendingActionsOutlined,
        variant: metrics.unpaid > 0 ? "danger" : "default",
      },
      {
        key: "payments-hours",
        count: `${metrics.creditHours.toFixed(2)} h`,
        label: t.columns.credit,
        labelKey: "dashboard.accounting.payments.columns.credit",
        icon: HourglassTopOutlined,
        variant: "highlight",
      },
    ],
    [t, metrics]
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          <Link href="/accounting/payments/new" style={{ textDecoration: "none" }}>
            <DesktopPrimaryPageAction>{t.addPayment}</DesktopPrimaryPageAction>
          </Link>
        }
      />

      <DesktopMetricCardGrid metrics={metricItems} size={{ md: 3, lg: 3 }} />

      <DesktopSectionPanel
        contentPadding={false}
        title={t.pageTitle}
        actions={<FiltersBar {...props} />}
        sx={{ mt: 3 }}
      >
        {error && rows.length === 0 ? (
          <ErrorState message={t.loadError} embedded />
        ) : loading && rows.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Box sx={{ width: "100%", height: 560, p: 2 }}>
            <AppDataGrid
              rows={rows as never}
              columns={columns}
              loading={loading}
              ariaLabel={t.pageTitle}
              emptyMessage={t.empty}
              autoHeight
              disableColumnMenu
              paginationOptions={{ mode: "client" }}
              onRowClick={params => router.push(`/accounting/payments/${String(params.row.id)}`)}
            />
          </Box>
        )}
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
