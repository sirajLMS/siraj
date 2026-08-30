import type { PaymentsLedgerLabels } from "@/shared/locale/types/dashboard/billing/paymentsLedger";

export const dashboardBillingPaymentsLedgerAr: PaymentsLedgerLabels = {
  pageTitle: "سجل المدفوعات",
  pageSubtitle: "سجل مدفوعاتك والساعات الشرائية التي اشتريتها",
  historySectionTitle: "سجل الدفعات",
  emptyTitle: "لا توجد مدفوعات بعد",
  emptySubtitle: "سيظهر سجل دفعاتك هنا بمجرد إتمام عملية شراء.",
  loadError: "تعذّر تحميل المدفوعات.",
  balanceSubLabel: "رصيد الساعات الشرائية",
  lowBalanceHint: "الرصيد منخفض — فكّر في شحن إضافي",
  topUpAction: "شحن الرصيد",
  hoursRemainingValue: (hours: number) => `${hours.toFixed(2)} س`,
  hoursAddedChip: (hours: number) => `+${hours.toFixed(2)} س`,
  creditsAddedChip: (credits: number) => `+${credits}`,
  columns: {
    student: "الطالب",
    credits: "الرصيد",
    amount: "المبلغ",
    packageName: "الباقة",
    method: "طريقة الدفع",
    date: "التاريخ",
  },
};
