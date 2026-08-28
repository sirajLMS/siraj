"use client";

import { AddOutlined, ClearOutlined } from "@mui/icons-material";
import { Box, Button, Chip, FormControlLabel, Skeleton, Stack, Switch, TextField, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect";
import {
  formatAccountingDate,
  formatAccountingMoney,
  paymentStatusTone,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PaymentsListViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel";
import { MobileFab, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { ParentAutocompleteMobile, StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { useAppLocale } from "@/shared/locale/localeContext";

const SKELETON_KEYS = ["skeleton-0", "skeleton-1", "skeleton-2"] as const;

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
    studentId,
    parentId,
    setFromDate,
    setToDate,
    setUnpaidOnly,
    setStudentId,
    setParentId,
    resetFilters,
    hasActiveFilters,
    canManagePayments,
  } = props;
  const router = useRouter();

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
        {error && rows.length === 0 ? (
          <Typography variant="bodyMd" sx={theme => ({ px: 2, color: theme.palette.error.main })}>
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
                      {formatAccountingDate(row.paymentDate, locale)}
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
