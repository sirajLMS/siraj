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
import { useMemo, useState } from "react";
import { BaseAvatar } from "@/frontend/common/components/ui/avatar";
import { AppDataGrid } from "@/frontend/common/components/ui/dataGrid/AppDataGrid";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  dateCell,
  formatAccountingDate,
  formatAccountingMoney,
  numericCell,
  paymentStatusTone,
  textCell,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { DesktopListStateGate } from "@/frontend/common/views/dashboard/accounting/components/DesktopListStateGate";
import type { PaymentsListViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel";
import { DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui/button";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui/container/DesktopSectionPanel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import {
  ParentAutocompleteDesktop,
  StudentAutocompleteDesktop,
} from "@/frontend/desktop/components/ui/input/userSelect";
import { useAppLocale } from "@/shared/locale/localeContext";

/** One-line truncating text block that never overflows its grid cell. */
function CellLine(props: Readonly<{ children: React.ReactNode; secondary?: boolean; mono?: boolean }>) {
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

function FiltersBar(props: Readonly<PaymentsListViewModel>) {
  const {
    t,
    rows,
    fromDate,
    toDate,
    unpaidOnly,
    studentId,
    parentId,
    setFromDate,
    setToDate,
    setUnpaidOnly,
    setStudentId,
    setParentId,
    resetFilters,
    hasActiveFilters,
  } = props;

  const [studentOption, setStudentOption] = useState<PersonOption | null>(null);
  const [parentOption, setParentOption] = useState<PersonOption | null>(null);

  // The store persists only ids; derive the displayed facades from the active
  // ids so an externally cleared filter (e.g. resetFilters) can never show a
  // stale name. Rows provide the student label fallback after a reload.
  const studentValue = useMemo<PersonOption | null>(() => {
    if (studentId === null || studentId === "") return null;
    if (studentOption?.id === studentId) return studentOption;
    const match = rows.find(row => row.studentId === studentId);
    return match ? { id: studentId, name: match.studentName ?? "" } : null;
  }, [rows, studentId, studentOption]);

  const parentValue = parentId !== null && parentOption?.id === parentId ? parentOption : null;

  const handleStudentChange = (next: PersonOption | null) => {
    setStudentOption(next);
    setStudentId(next?.id ?? null);
  };

  const handleParentChange = (next: PersonOption | null) => {
    setParentOption(next);
    setParentId(next?.id ?? null);
  };

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
  const { t, rows, loading, error, metrics, metricsBasis, canManagePayments } = props;
  const locale = useAppLocale();
  const router = useRouter();

  const columns = useMemo<GridColDef[]>(() => {
    const cols: GridColDef[] = [
      {
        field: "studentName",
        headerName: t.columns.studentName,
        flex: 1.2,
        minWidth: 190,
        renderCell: params => (
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0, width: "100%" }}>
            <BaseAvatar label={params.row.studentName ?? undefined} size={30} />
            <Box sx={{ minWidth: 0 }}>
              <CellLine>{params.row.studentName ?? "—"}</CellLine>
              {params.row.parentName ? <CellLine secondary>{params.row.parentName}</CellLine> : null}
            </Box>
          </Stack>
        ),
      },
      {
        field: "creditHours",
        headerName: t.columns.credit,
        width: 105,
        type: "number",
        valueFormatter: (value: unknown) => (value == null ? "—" : `${numericCell(value).toFixed(2)} h`),
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
            <Box component="span" sx={theme => ({ color: theme.palette.onSurfaceVariant, fontSize: 12 })}>
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
            <Box sx={{ minWidth: 0, width: "100%" }}>
              <CellLine>{params.row.packageName}</CellLine>
              {params.row.packageCodename ? (
                <CellLine secondary mono>
                  {params.row.packageCodename}
                </CellLine>
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
        valueGetter: (value: unknown) => {
          const localized = Object.entries(t.gateways).find(([gatewayKey]) => gatewayKey === value);
          return localized?.[1] ?? textCell(value);
        },
      },
      {
        field: "paymentDate",
        headerName: t.columns.paymentDate,
        width: 120,
        valueFormatter: (value: unknown) => formatAccountingDate(dateCell(value), locale),
      },
      {
        field: "createdAt",
        headerName: t.columns.createdAt,
        width: 120,
        valueFormatter: (value: unknown) => formatAccountingDate(dateCell(value), locale),
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
  }, [t, locale]);

  const metricItems = useMemo<MetricItem[]>(
    () => [
      {
        key: "payments-total",
        count: metrics.total,
        label: t.pageTitle,
        labelKey: "dashboard.accounting.payments.pageTitle",
        icon: PaymentsOutlined,
        subLabel: metricsBasis ?? undefined,
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
    [t, metrics, metricsBasis]
  );

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.pageTitle}
        subtitle={t.pageSubtitle}
        actions={
          canManagePayments ? (
            <Link href="/accounting/payments/new" style={{ textDecoration: "none" }}>
              <DesktopPrimaryPageAction>{t.addPayment}</DesktopPrimaryPageAction>
            </Link>
          ) : null
        }
      />

      <DesktopMetricCardGrid metrics={metricItems} size={{ md: 3, lg: 3 }} />

      <DesktopSectionPanel
        contentPadding={false}
        title={t.pageTitle}
        actions={<FiltersBar {...props} />}
        sx={{ mt: 3 }}
      >
        <DesktopListStateGate error={error} loading={loading} hasRows={rows.length > 0} errorMessage={t.loadError}>
          <Box sx={{ width: "100%", height: 560, p: 2 }}>
            <AppDataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              ariaLabel={t.pageTitle}
              emptyMessage={t.empty}
              autoHeight
              disableColumnMenu
              rowHeight={64}
              paginationOptions={{ mode: "client" }}
              onRowClick={params => router.push(`/accounting/payments/${String(params.row.id)}`)}
            />
          </Box>
        </DesktopListStateGate>
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
