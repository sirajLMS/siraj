"use client";

import { AddOutlined, ClearOutlined } from "@mui/icons-material";
import { Box, Button, Chip, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatAccountingDate,
  formatAccountingMoney,
  paymentStatusTone,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  MobileListCardSkeletons,
  MobileListEmptyNotice,
  MobileListErrorNotice,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import { usePaymentsPersonFilterSelection } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentsPersonFiltersShared";
import type { PaymentsListViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel";
import { MobileFab, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ParentAutocompleteMobile, StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { useAppLocale } from "@/shared/locale/localeContext";

export function PaymentsListMobile(props: Readonly<PaymentsListViewModel>) {
  const locale = useAppLocale();
  const {
    t,
    rows,
    loading,
    error,
    metrics,
    metricsBasis,
    fromDate,
    toDate,
    unpaidOnly,
    setFromDate,
    setToDate,
    setUnpaidOnly,
    resetFilters,
    hasActiveFilters,
    canManagePayments,
  } = props;
  const router = useRouter();

  const { studentValue, parentValue, handleStudentChange, handleParentChange } =
    usePaymentsPersonFilterSelection(props);

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

      {/* pb 11 (88px): FAB height (56) + breathing room — the shell only reserves the bottom-nav height, so the last card can still scroll fully above the fixed MobileFab. */}
      <Stack spacing={2} sx={{ pb: 11 }}>
        {/* Inline metric strip */}
        <Stack direction="row" spacing={1} sx={{ px: 2 }}>
          <Chip size="small" label={`${t.columns.status}: ${metrics.total}`} />
          <Chip size="small" color="success" variant="outlined" label={`${t.status.paid}: ${metrics.paid}`} />
          <Chip
            size="small"
            color="warning"
            variant={metrics.unpaid > 0 ? "filled" : "outlined"}
            label={`${t.status.unpaid}: ${metrics.unpaid}`}
          />
        </Stack>

        {metricsBasis ? (
          <Typography variant="labelSm" sx={theme => ({ px: 2, color: theme.palette.onSurfaceVariant })}>
            {metricsBasis}
          </Typography>
        ) : null}

        {/* Filters */}
        <Stack spacing={1.5} sx={{ px: 2 }}>
          <StudentAutocompleteMobile
            size="small"
            label={t.filters.student}
            value={studentValue}
            onChange={handleStudentChange}
          />
          <ParentAutocompleteMobile
            size="small"
            label={t.filters.parent}
            value={parentValue}
            onChange={handleParentChange}
          />
          <Stack direction="row" spacing={1.5}>
            <TextField
              size="small"
              type="date"
              label={t.filters.fromDate}
              value={fromDate ?? ""}
              onChange={e => setFromDate(e.target.value || null)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              type="date"
              label={t.filters.toDate}
              value={toDate ?? ""}
              onChange={e => setToDate(e.target.value || null)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <FormControlLabel
              control={<Switch checked={unpaidOnly} onChange={e => setUnpaidOnly(e.target.checked)} size="small" />}
              label={<Typography variant="labelSm">{t.filters.unpaidOnly}</Typography>}
            />
            {hasActiveFilters ? (
              <Button size="small" startIcon={<ClearOutlined />} onClick={resetFilters}>
                {t.filters.clear}
              </Button>
            ) : null}
          </Stack>
        </Stack>

        {/* Cards */}
        <MobileListErrorNotice visible={error && rows.length === 0} message={t.loadError} />

        {loading && rows.length === 0 ? (
          <MobileListCardSkeletons height={96} />
        ) : (
          rows.map(row => (
            <Link key={row.id} href={`/accounting/payments/${row.id}`} style={{ textDecoration: "none" }}>
              <Box
                sx={theme => ({
                  mx: 2,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: theme.palette.surfaceContainerLow,
                  border: 1,
                  borderColor: theme.palette.outlineVariant,
                })}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                    {row.studentName ?? "—"}
                  </Typography>
                  <Chip
                    size="small"
                    color={paymentStatusTone(Boolean(row.isPaidStatusOn))}
                    variant={row.isPaidStatusOn ? "outlined" : "filled"}
                    label={row.isPaidStatusOn ? t.status.paid : t.status.unpaid}
                  />
                </Stack>
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ mt: 1, alignItems: "baseline", justifyContent: "space-between" }}
                >
                  <Typography variant="headlineMd" sx={{ fontWeight: 700 }}>
                    {`${formatAccountingMoney(row.amount)} ${row.currency ?? ""}`}
                  </Typography>
                  {row.creditHours ? (
                    <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                      {`${Number(row.creditHours).toFixed(2)} h`}
                    </Typography>
                  ) : null}
                </Stack>
                <Stack direction="row" spacing={1.5} sx={{ mt: 1, justifyContent: "space-between" }}>
                  <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                    {row.packageName ?? "—"}
                  </Typography>
                  <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
                    {formatAccountingDate(row.paymentDate, locale)}
                  </Typography>
                </Stack>
              </Box>
            </Link>
          ))
        )}

        <MobileListEmptyNotice visible={!loading && rows.length === 0 && !error} message={t.empty} />
      </Stack>

      {canManagePayments ? (
        <MobileFab
          icon={<AddOutlined />}
          label={t.addPayment}
          onClick={() => router.push("/accounting/payments/new")}
        />
      ) : null}
    </MobilePageContainer>
  );
}
