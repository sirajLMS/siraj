import type { CreditLabels } from "@/shared/locale/types/dashboard/lms/credit";

export const dashboardLmsCreditAr: CreditLabels = {
  title: "الرصيد",
  balance: "الرصيد المتبقي",
  purchase: "شراء",
  deduction: "خصم",
  refund: "استرداد",
  adjustment: "تسوية",
  transactionsHistory: "سجل المعاملات",
  hoursRemaining: "الساعات المتبقية",
  hoursTotal: "إجمالي الساعات",
  recordPurchase: "تسجيل عملية شراء",
  purchaseSuccess: hours => `تم تسجيل عملية الشراء بنجاح: ${hours} ساعة`,
  insufficientCredits: remaining => `لا توجد ساعات كافية. المتبقي: ${remaining} ساعة`,
};
