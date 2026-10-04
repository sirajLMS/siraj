"use client";

import { ClearOutlined } from "@mui/icons-material";
import { Button, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import Link from "next/link";
import {
  formatAccountingDate,
  formatAccountingMoney,
} from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { PaymentsPersonFilterSelection } from "@/frontend/common/views/dashboard/accounting/components/__shared__/paymentsPersonFiltersShared";
import type { PaymentsListViewModel } from "@/frontend/common/views/dashboard/accounting/usePaymentsListViewModel";
import { MobileCardListItem, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileAppDateRangePicker } from "@/frontend/mobile/components/ui/form/date";
import { ParentAutocompleteMobile, StudentAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { useAppLocale } from "@/shared/locale/localeContext";

type ListLabels = PaymentsListViewModel["t"];
type PaymentRow = PaymentsListViewModel["rows"][number];

type FiltersProps = Readonly<
  Pick<
    PaymentsListViewModel,
    | "t"
    | "fromDate"
    | "toDate"
    | "setFromDate"
    | "setToDate"
    | "unpaidOnly"
    | "setUnpaidOnly"
    | "resetFilters"
    | "hasActiveFilters"
  > &
    PaymentsPersonFilterSelection
>;

/** Filter bar for the mobile payments list: student/parent pickers, date range, unpaid-only switch. */
export function PaymentsListFiltersMobile(props: FiltersProps) {
  const {
    t,
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    unpaidOnly,
    setUnpaidOnly,
    resetFilters,
    hasActiveFilters,
    studentValue,
    parentValue,
    handleStudentChange,
    handleParentChange,
  } = props;

  return (
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
  );
}

/** Compact payment summary card linking to the payment detail page. */
export function PaymentsListCardMobile({ t, row }: Readonly<{ t: ListLabels; row: PaymentRow }>) {
  const locale = useAppLocale();
  return (
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
        <Stack direction="row" spacing={1.5} sx={{ mt: 1, alignItems: "baseline", justifyContent: "space-between" }}>
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
  );
}
