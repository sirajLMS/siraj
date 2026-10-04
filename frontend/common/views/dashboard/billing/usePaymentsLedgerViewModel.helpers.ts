import { ChildCareOutlined } from "@mui/icons-material";
import { formatDate } from "@/frontend/common/components/intl/dateFormat";
import type { ListPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type {
  MyPaymentsLedgerQuery_myPaymentsLedger,
  StudentCreditHourBalanceQuery_studentCreditHourBalance,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { MetricItem } from "@/frontend/common/types/shared.types";
import type {
  PaymentsLedgerChild,
  PaymentsLedgerRow,
} from "@/frontend/common/views/dashboard/billing/types/paymentsLedger.types";
import type { AppLocale, PaymentsLedgerLabels } from "@/shared/locale";

export type LedgerEntry = MyPaymentsLedgerQuery_myPaymentsLedger;
export type BalanceEntry = StudentCreditHourBalanceQuery_studentCreditHourBalance;
export type BalanceMap = Readonly<Record<string, BalanceEntry>>;

const LEDGER_PAGE_SIZE = 10;

/** Display value for cells whose backing field is null (hour-less rows, unnamed students). */
const MISSING_VALUE = "—";

export const paginationOptions: ListPaginationOptions = {
  mode: "client",
  pageSize: LEDGER_PAGE_SIZE,
  pageSizeOptions: [LEDGER_PAGE_SIZE],
};

function formatMethodLabel(method: string | null): string {
  if (!method) return MISSING_VALUE;
  return method
    .toLowerCase()
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatLedgerDate(isoDate: string, locale: AppLocale): string {
  if (!isoDate) return MISSING_VALUE;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return MISSING_VALUE;
  return formatDate(date, locale, MISSING_VALUE);
}

/** Cache of `Intl.NumberFormat` instances keyed by locale tag to avoid CPU and GC overhead in row mappings. */
const ledgerNumberFormatCache = new Map<string, Intl.NumberFormat>();

function getLedgerNumberFormat(locale: string): Intl.NumberFormat {
  let formatter = ledgerNumberFormatCache.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    ledgerNumberFormatCache.set(locale, formatter);
  }
  return formatter;
}

/** Money amounts are decimal strings from the API; always render two fraction digits. */
function formatLedgerAmount(amount: string | null, currency: string | null, locale: AppLocale): string {
  const rawAmount = amount?.trim() ?? "";
  const numeric = rawAmount === "" ? Number.NaN : Number(rawAmount);
  const formatted = Number.isFinite(numeric) ? getLedgerNumberFormat(locale).format(numeric) : MISSING_VALUE;
  const currencyCode = currency?.trim() ?? "";
  return currencyCode ? `${formatted} ${currencyCode}` : formatted;
}

export function mapLedgerEntry(entry: LedgerEntry, labels: PaymentsLedgerLabels, locale: AppLocale): PaymentsLedgerRow {
  const hours = entry.creditHours;
  const creditsPurchased = entry.creditsPurchased ?? 0;
  let creditsLabel = MISSING_VALUE;
  if (hours != null) {
    creditsLabel = labels.hoursAddedChip(hours);
  } else if (creditsPurchased > 0) {
    creditsLabel = labels.creditsAddedChip(creditsPurchased);
  }
  return {
    id: entry.id ?? "",
    studentId: entry.studentId ?? null,
    studentName: entry.studentName ?? null,
    creditHours: hours,
    creditsPurchased,
    creditsLabel,
    amountLabel: formatLedgerAmount(entry.amount ?? null, entry.currency ?? null, locale),
    packageName: entry.packageName ?? null,
    methodLabel: formatMethodLabel(entry.paymentMethodType ?? null),
    dateLabel: formatLedgerDate(entry.paymentDate ?? "", locale),
  };
}

export function buildBalanceMetrics(
  children: readonly PaymentsLedgerChild[],
  balances: BalanceMap,
  labels: PaymentsLedgerLabels
): readonly MetricItem[] {
  return children.map(child => {
    const balance = balances[child.studentId];
    const remaining = balance?.creditHoursRemaining != null ? Number(balance.creditHoursRemaining) : null;
    const threshold = balance?.lowHoursThreshold ?? null;
    const isLow = remaining != null && threshold != null && remaining <= threshold;
    return {
      key: child.studentId,
      labelKey: child.studentId,
      label: child.studentName || MISSING_VALUE,
      count: remaining != null ? labels.hoursRemainingValue(remaining) : MISSING_VALUE,
      subLabel: isLow ? labels.lowBalanceHint : labels.balanceSubLabel,
      icon: ChildCareOutlined,
      variant: isLow ? "error" : "default",
    };
  });
}
