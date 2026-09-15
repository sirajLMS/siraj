"use client";

import {
  AddOutlined,
  ClearOutlined,
  CreditScoreOutlined,
  HourglassTopOutlined,
  PaymentsOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";
import { Button, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import {
  formatAccountingDate,
  formatAccountingMoney,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import {
  MobileListCardSkeletons,
  MobileListEmptyNotice,
  MobileListErrorNotice,
} from "@/frontend/common/views/dashboard/accounting/components/__shared__/mobileListStateShared";
import { usePaymentsPersonFilterSelection } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentsPersonFiltersShared";
import type { PaymentsListViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobileContentStack,
  MobileFab,
  MobileMetricCardGrid,
  MobilePageContainer,
  MobilePageHeader,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import { MobileAppDateRangePicker } from "@/frontend/mobile/components/ui/form/date";
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
    <MobilePageContainer>
      <MobilePageHeader title={t.pageTitle} subtitle={t.pageSubtitle} />

      {/* pb 11 (88px): FAB height (56) + breathing room — the shell only reserves the bottom-nav height, so the last card can still scroll fully above the fixed MobileFab. */}
      <MobileContentStack gap={2} paddingBottom={11}>
        <MobileMetricCardGrid metrics={metricItems} />

        <MobileContentInset>
          <Stack spacing={1.5}>
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
            <MobileAppDateRangePicker
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
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
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
        </MobileContentInset>

        <MobileListErrorNotice visible={error && rows.length === 0} message={t.loadError} />

        <MobileCardList
          rows={rows}
          getKey={row => row.id ?? ""}
          loading={loading}
          emptyMessage={t.empty}
          renderSkeleton={() => <MobileListCardSkeletons height={96} />}
          renderEmptyState={message => <MobileListEmptyNotice visible={!error} message={message} />}
          paginationOptions={{ mode: "client" }}
          renderItem={row => (
            <Link href={`/accounting/payments/${row.id}`} style={{ textDecoration: "none" }}>
              <MobileCardListItem interactive>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="bodyMd" sx={{ fontWeight: 600 }}>
                    {row.studentName ?? "—"}
                  </Typography>
                  <MobileStatusBadge
                    category="session"
                    status={row.isPaidStatusOn ? "active" : "pending"}
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
              </MobileCardListItem>
            </Link>
          )}
        />
      </MobileContentStack>

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
