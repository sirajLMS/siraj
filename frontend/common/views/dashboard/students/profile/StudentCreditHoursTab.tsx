"use client";

import { useQuery } from "@apollo/client/react";
import {
  AccessTimeFilledOutlined,
  ShoppingBagOutlined,
  TrendingDownOutlined,
  WalletOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { type ReactNode, useMemo } from "react";
import { AppPermission, type StudentCreditTransactionsQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentCreditHourBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { studentCreditTransactionsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { formatAccountingDate } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import { useAppTranslation } from "@/shared/locale/client";
import { useAppLocale } from "@/shared/locale/localeContext";
import { DashboardAccountingStudentCreditHours } from "@/shared/locale/namespaces";
import type { StudentCreditHoursLabels } from "@/shared/locale/types/dashboard/accounting/student-credit-hours";

const RECENT_TRANSACTIONS = 10;

type CreditHoursAudience = "admin" | "teacher" | "parent" | null;

type HourTransaction = NonNullable<StudentCreditTransactionsQuery["studentCreditTransactions"]>[number];

/** Formats an hour delta as "+1.50 h" / "−0.50 h" / em-dash when unknown. */
function formatHourChange(hours: number | null): string {
  if (hours == null) {
    return "—";
  }
  return `${hours > 0 ? "+" : "−"}${Math.abs(hours).toFixed(2)} h`;
}

/**
 * Client-side mirror of the server helper `resolveStudentsPageAudience`
 * (app/(dashboard)/lib) — the tab renders inside the client profile page,
 * where only the permission list is available. Same priority order:
 * admin (super/StudentsList) → teacher → parent.
 */
function resolveCreditHoursAudience(permissions: readonly AppPermission[], isSuperAdmin: boolean): CreditHoursAudience {
  if (isSuperAdmin || permissions.includes(AppPermission.StudentsList)) return "admin";
  if (permissions.includes(AppPermission.TeacherViewStudents)) return "teacher";
  if (permissions.includes(AppPermission.ParentViewStudents)) return "parent";
  return null;
}

function audienceHint(labels: StudentCreditHoursLabels, audience: CreditHoursAudience): string | null {
  switch (audience) {
    case "admin":
      return labels.perAudience.supervisorHint;
    case "teacher":
      return labels.perAudience.teacherHint;
    case "parent":
      return labels.perAudience.parentHint;
    default:
      return labels.perAudience.studentHint;
  }
}

export function StudentCreditHoursTab({ studentId }: Readonly<{ studentId: string }>) {
  const t = useAppTranslation(DashboardAccountingStudentCreditHours);
  const locale = useAppLocale();
  const permissions = useUserStore(s => s.permissions);
  const actorIsSuperAdmin = useUserStore(s => s.actorIsSuperAdmin);

  const audience = useMemo(
    () => resolveCreditHoursAudience(permissions, actorIsSuperAdmin),
    [permissions, actorIsSuperAdmin]
  );

  const {
    data: balanceData,
    loading: balanceLoading,
    error: balanceError,
  } = useQuery(studentCreditHourBalanceQueryDocument, { variables: { studentId }, skip: !studentId });

  const {
    data: txData,
    loading: txLoading,
    error: txError,
  } = useQuery(studentCreditTransactionsQueryDocument, {
    variables: {
      studentId,
      paginationArgs: {
        after: null,
        before: null,
        first: RECENT_TRANSACTIONS,
        last: null,
        maxCount: null,
        page: null,
        skip: null,
      },
      hoursOnly: true,
    },
    skip: !studentId,
  });

  const balance = balanceData?.studentCreditHourBalance;
  const total = Number(balance?.creditHoursTotal ?? 0);
  const remaining = Number(balance?.creditHoursRemaining ?? 0);
  const consumed = Math.max(0, total - remaining);
  const remainingRatio = total > 0 ? remaining / total : 0;
  const lowHoursThreshold = balance?.lowHoursThreshold ?? 0;

  const transactions = useMemo(() => txData?.studentCreditTransactions ?? [], [txData]);

  if (balanceLoading && !balanceData) {
    return (
      <Box sx={{ py: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  if (balanceError) {
    return <Alert severity="error">{t.loadError}</Alert>;
  }

  const hint = audienceHint(t, audience);
  const isLowBalance = remaining < lowHoursThreshold;

  return (
    <Stack spacing={3}>
      {hint ? (
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {hint}
        </Typography>
      ) : null}

      {isLowBalance ? (
        <Alert severity="warning" icon={<AccessTimeFilledOutlined fontSize="inherit" />}>
          {t.lowBalanceAlert(remaining.toFixed(2), lowHoursThreshold.toFixed(2))}
        </Alert>
      ) : null}

      {/* Balance cards */}
      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 2 }}>
        <BalanceCard
          icon={<ShoppingBagOutlined />}
          label={t.totalLabel}
          value={t.hoursUnit(total.toFixed(2))}
          highlight={false}
        />
        <BalanceCard
          icon={<TrendingDownOutlined />}
          label={t.consumedLabel}
          value={t.hoursUnit(consumed.toFixed(2))}
          highlight={false}
        />
        <BalanceCard
          icon={<WalletOutlined />}
          label={t.balanceCardTitle}
          value={t.hoursUnit(remaining.toFixed(2))}
          highlight
          progress={total > 0 ? remainingRatio : 0}
          lowBalance={isLowBalance}
        />
      </Stack>

      {/* Recent hour-based transactions */}
      <Box>
        <Typography variant="titleLg" sx={{ mb: 1.5, display: "block" }}>
          {t.recentPurchasesTitle}
        </Typography>

        <RecentHourTransactions
          t={t}
          rows={transactions}
          loading={txLoading}
          hasError={Boolean(txError)}
          locale={locale}
        />
      </Box>
    </Stack>
  );
}

function RecentHourTransactions({
  t,
  rows,
  loading,
  hasError,
  locale,
}: Readonly<{
  t: StudentCreditHoursLabels;
  rows: HourTransaction[];
  loading: boolean;
  hasError: boolean;
  locale: string;
}>) {
  if (hasError) {
    return <Alert severity="error">{t.loadError}</Alert>;
  }
  if (loading && rows.length === 0) {
    return <LinearProgress sx={{ my: 2 }} />;
  }
  if (rows.length === 0) {
    return (
      <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant, py: 2 })}>
        {t.recentPurchasesEmpty}
      </Typography>
    );
  }
  return (
    <TableContainer
      sx={theme => ({
        borderRadius: 2,
        border: 1,
        borderColor: theme.palette.outlineVariant,
        maxHeight: 420,
      })}
    >
      <Table size="small" stickyHeader aria-label={t.recentPurchasesTitle}>
        <TableHead>
          <TableRow>
            <TableCell>{t.columns.date}</TableCell>
            <TableCell align="right">{t.columns.change}</TableCell>
            <TableCell>{t.columns.reason}</TableCell>
            <TableCell>{t.columns.note}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(tx => {
            const hours = tx.changeAmountHours != null ? Number(tx.changeAmountHours) : null;
            const isPositive = hours != null && hours > 0;
            return (
              <TableRow key={tx.id} hover>
                <TableCell>{formatAccountingDate(tx.createdAt, locale)}</TableCell>
                <TableCell align="right">
                  <Typography
                    variant="labelSm"
                    sx={theme => ({
                      fontWeight: 600,
                      color: isPositive ? theme.palette.success.main : theme.palette.error.main,
                    })}
                  >
                    {formatHourChange(hours)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    variant="outlined"
                    label={reasonLabel(t, tx.reason)}
                    color={isPositive ? "success" : "default"}
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 260 }}>
                  <Box
                    component="span"
                    sx={theme => ({
                      color: theme.palette.onSurfaceVariant,
                      display: "inline-block",
                      maxWidth: 260,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      verticalAlign: "bottom",
                    })}
                  >
                    {tx.notes ?? "—"}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function reasonLabel(t: StudentCreditHoursLabels, reason: string | null | undefined): string {
  switch (reason) {
    case "PURCHASE":
      return t.reasons.PURCHASE;
    case "DEDUCTION":
      return t.reasons.DEDUCTION;
    case "REFUND":
      return t.reasons.REFUND;
    case "ADJUSTMENT":
      return t.reasons.ADJUSTMENT;
    default:
      return reason ?? "—";
  }
}

function BalanceCard({
  icon,
  label,
  value,
  highlight,
  progress,
  lowBalance,
}: Readonly<{
  icon: ReactNode;
  label: string;
  value: string;
  highlight: boolean;
  progress?: number;
  lowBalance?: boolean;
}>) {
  return (
    <Box
      sx={theme => ({
        flex: "1 1 200px",
        minWidth: 190,
        p: 2,
        borderRadius: 3,
        border: 1,
        borderColor: highlight ? theme.palette.primary.main : theme.palette.outlineVariant,
        bgcolor: highlight ? theme.palette.surfaceContainer : theme.palette.surfaceContainerLow,
        boxShadow: highlight ? theme.shadows[2] : "none",
      })}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1 }}>
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 2,
            bgcolor: highlight ? theme.palette.primary.main : theme.palette.surfaceContainerHighest,
            color: highlight ? theme.palette.onPrimary : theme.palette.onSurfaceVariant,
          })}
        >
          {icon}
        </Box>
        <Typography variant="labelSm" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="headlineMd" sx={{ fontWeight: 700 }}>
        {value}
      </Typography>
      {progress !== undefined ? (
        <LinearProgress
          variant="determinate"
          value={Math.round(progress * 100)}
          sx={{ mt: 1.5, height: 6, borderRadius: 3 }}
          color={lowBalance ? "warning" : "primary"}
        />
      ) : null}
    </Box>
  );
}
