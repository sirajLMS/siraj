"use client";

import { AddOutlined, ClearOutlined } from "@mui/icons-material";
import { Box, Button, Chip, FormControlLabel, Skeleton, Stack, Switch, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  formatAccountingDate,
  formatAccountingMoney,
  paymentStatusTone,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PaymentsListViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel";
import { MobileFab, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

const SKELETON_KEYS = ["skeleton-0", "skeleton-1", "skeleton-2"] as const;

export function PaymentsListMobile(props: Readonly<PaymentsListViewModel>) {
  const {
    t,
    rows,
    loading,
    error,
    metrics,
    fromDate,
    toDate,
    unpaidOnly,
    setFromDate,
    setToDate,
    setUnpaidOnly,
    resetFilters,
    hasActiveFilters,
  } = props;
  const router = useRouter();

  return (
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

      <Stack spacing={2} sx={{ pb: 10 }}>
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

        {/* Filters */}
        <Stack spacing={1.5} sx={{ px: 2 }}>
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
        {error && rows.length === 0 ? (
          <Typography variant="bodyMd" sx={{ px: 2, color: "error.main" }}>
            {t.loadError}
          </Typography>
        ) : null}

        {loading && rows.length === 0
          ? SKELETON_KEYS.map(key => (
              <Box key={key} sx={{ px: 2 }}>
                <Skeleton variant="rounded" height={96} />
              </Box>
            ))
          : rows.map(row => (
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
                      {formatAccountingDate(row.paymentDate)}
                    </Typography>
                  </Stack>
                </Box>
              </Link>
            ))}

        {!loading && rows.length === 0 && !error ? (
          <Typography variant="bodyMd" sx={{ px: 2, textAlign: "center", py: 4 }}>
            {t.empty}
          </Typography>
        ) : null}
      </Stack>

      <MobileFab icon={<AddOutlined />} label={t.addPayment} onClick={() => router.push("/accounting/payments/new")} />
    </MobilePageContainer>
  );
}
