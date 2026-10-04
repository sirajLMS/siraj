import { ShoppingBagOutlined, TrendingDownOutlined, WalletOutlined } from "@mui/icons-material";
import {
  AppPermission,
  type StudentCreditHourBalanceQuery,
  type StudentCreditTransactionsQuery,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import { formatAccountingDate } from "@/frontend/common/views/dashboard/accounting/accountingFormatters";
import type { StudentCreditHoursLabels } from "@/shared/locale/types/dashboard/accounting/student-credit-hours";

type CreditHoursAudience = "admin" | "teacher" | "parent" | null;

export type HourTransaction = NonNullable<StudentCreditTransactionsQuery["studentCreditTransactions"]>[number];

export type HourBalance = NonNullable<StudentCreditHourBalanceQuery["studentCreditHourBalance"]>;

/** Grid/card row shape consumed by both tier views (pre-formatted display strings). */
export interface StudentCreditHoursTransactionRow {
  readonly id: string;
  readonly dateLabel: string;
  readonly changeLabel: string;
  readonly isPositive: boolean;
  /** Raw transaction reason (PURCHASE/DEDUCTION/REFUND/ADJUSTMENT) — StatusBadge status key. */
  readonly reasonStatus: string;
  /** Translated reason label. */
  readonly reasonLabel: string;
  readonly notes: string;
}

/** Formats an hour delta as "+1.50 h" / "−0.50 h" / em-dash when unknown. */
function formatHourChange(hours: number | null): string {
  if (hours == null) {
    return "—";
  }
  return `${hours > 0 ? "+" : "−"}${Math.abs(hours).toFixed(2)} h`;
}

function resolveReasonLabel(labels: StudentCreditHoursLabels, reason: string | null | undefined): string {
  if (!reason) {
    return "—";
  }
  const map: Record<string, string> = {
    PURCHASE: labels.reasons.PURCHASE,
    DEDUCTION: labels.reasons.DEDUCTION,
    REFUND: labels.reasons.REFUND,
    ADJUSTMENT: labels.reasons.ADJUSTMENT,
  };
  return map[reason] ?? reason;
}

/**
 * Client-side mirror of the server helper `resolveStudentsPageAudience`
 * (app/(dashboard)/lib) — the tab renders inside the client profile page,
 * where only the permission list is available. Same priority order:
 * admin (super/StudentsList) → teacher → parent.
 */
export function resolveCreditHoursAudience(
  permissions: readonly AppPermission[],
  isSuperAdmin: boolean
): CreditHoursAudience {
  if (isSuperAdmin || permissions.includes(AppPermission.StudentsList)) return "admin";
  if (permissions.includes(AppPermission.TeacherViewStudents)) return "teacher";
  if (permissions.includes(AppPermission.ParentViewStudents)) return "parent";
  return null;
}

export function audienceHint(labels: StudentCreditHoursLabels, audience: CreditHoursAudience): string | null {
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

export function mapHourTransaction(
  tx: HourTransaction,
  labels: StudentCreditHoursLabels,
  locale: string
): StudentCreditHoursTransactionRow {
  const hours = tx.changeAmountHours == null ? null : Number(tx.changeAmountHours);
  return {
    id: tx.id ?? "",
    dateLabel: formatAccountingDate(tx.createdAt, locale),
    changeLabel: formatHourChange(hours),
    isPositive: hours != null && hours > 0,
    reasonStatus: tx.reason ?? "unknown",
    reasonLabel: resolveReasonLabel(labels, tx.reason),
    notes: tx.notes ?? "—",
  };
}

export function buildBalanceMetrics(
  labels: StudentCreditHoursLabels,
  total: number,
  consumed: number,
  remaining: number,
  isLowBalance: boolean
): readonly MetricItem[] {
  return [
    {
      key: "total",
      count: labels.hoursUnit(total.toFixed(2)),
      labelKey: "total",
      label: labels.totalLabel,
      icon: ShoppingBagOutlined,
    },
    {
      key: "consumed",
      count: labels.hoursUnit(consumed.toFixed(2)),
      labelKey: "consumed",
      label: labels.consumedLabel,
      icon: TrendingDownOutlined,
    },
    {
      key: "remaining",
      count: labels.hoursUnit(remaining.toFixed(2)),
      labelKey: "remaining",
      label: labels.balanceCardTitle,
      icon: WalletOutlined,
      variant: isLowBalance ? "error" : "highlight",
    },
  ];
}
