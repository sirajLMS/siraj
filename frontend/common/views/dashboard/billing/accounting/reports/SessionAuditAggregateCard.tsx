"use client";

import { Box, Stack, Typography } from "@mui/material";
import { SectionPanel } from "@/frontend/common/components/ui";
import type { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import { formatLockedAmount } from "@/frontend/common/lib/currency";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { SessionAuditStatusChip } from "@/frontend/common/views/dashboard/billing/accounting/reports/SessionAuditStatusChip";
import type { SessionAuditStatus } from "@/shared/constants/classes/session-audit-status";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

/**
 * Paid/unpaid row tallies for the session audit summary. Split on the row's
 * payroll calculation status: a row counts as paid only once its teacher
 * compensation has been fully settled.
 */
interface SessionAuditPaidRowCounts {
  readonly paid: number;
  readonly unpaid: number;
}

/**
 * Display order of the per-status row counters in the aggregate summary:
 * running sessions first, then ended, then the two absence states.
 */
const SESSION_AUDIT_STATUS_ORDER: readonly SessionAuditStatus[] = ["open", "end", "Absent", "absent_student"];

export interface SessionAuditAggregateCardProps {
  /** Summed teacher paid amount for the filtered page, as a decimal string. */
  readonly totalPaidAmount: string;
  /**
   * Dominant currency of the summed paid amount; null while nothing is paid or
   * before the first response, in which case only the currency total is hidden —
   * the currency-independent counters still render.
   */
  readonly totalPaidCurrency: CurrencyCode | null;
  /** Row count per audit status; every status key must be present. */
  readonly rowCountByStatus: Record<SessionAuditStatus, number>;
  /** Paid/unpaid row tallies for the filtered page. */
  readonly rowCountByPaid: SessionAuditPaidRowCounts;
  /** Localized summary-section labels from the session-audit namespace. */
  readonly labels: SessionAuditLabels["aggregate"];
  /** Localized per-status labels from the session-audit namespace. */
  readonly statusLabels: SessionAuditLabels["status"];
}

/**
 * Paid/unpaid tally with semantic emphasis: settled rows read as success,
 * outstanding rows as warning, keeping the balance scannable at a glance.
 */
function PaidRowCount({ label, count, tone }: Readonly<{ label: string; count: number; tone: "success" | "warning" }>) {
  return (
    <Stack direction="row" sx={{ gap: 1, alignItems: "center" }}>
      <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette[tone].main, fontWeight: 700 })}>
        {count}
      </Typography>
    </Stack>
  );
}

/**
 * Aggregate summary footer for the session audit report grid: the summed
 * teacher paid amount in its dominant currency (hidden while the currency is
 * unknown), a per-status row counter row backed by the status chips, and the
 * paid/unpaid tallies. Labels arrive via props; the parent view model owns
 * translations.
 */
export function SessionAuditAggregateCard({
  totalPaidAmount,
  totalPaidCurrency,
  rowCountByStatus,
  rowCountByPaid,
  labels,
  statusLabels,
}: Readonly<SessionAuditAggregateCardProps>) {
  const locale = useAppLocale();
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
        {totalPaidCurrency === null ? null : (
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
              {labels.totalPaid}
            </Typography>
            <Typography variant="titleLg">
              {/* Currency codes and digits are LTR; isolate them so RTL locales don't reorder the amount. */}
              <Box component="span" dir="ltr" sx={{ unicodeBidi: "isolate" }}>
                {formatLockedAmount(totalPaidAmount, totalPaidCurrency, locale)}
              </Box>
            </Typography>
          </Stack>
        )}
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
          {SESSION_AUDIT_STATUS_ORDER.map(status => (
            <Stack key={status} direction="row" sx={{ gap: 0.25, alignItems: "center" }}>
              <SessionAuditStatusChip status={status} labels={statusLabels} />
              <Typography variant="bodyMd" sx={{ fontWeight: 600, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {rowCountByStatus[status]}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 3, alignItems: "center" }}>
          <PaidRowCount label={labels.paidRows} count={rowCountByPaid.paid} tone="success" />
          <PaidRowCount label={labels.unpaidRows} count={rowCountByPaid.unpaid} tone="warning" />
        </Stack>
      </Stack>
    </SectionPanel>
  );
}
