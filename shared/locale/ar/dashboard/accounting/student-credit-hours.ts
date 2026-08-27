import type { StudentCreditHoursLabels } from "@/shared/locale/types/dashboard/accounting/student-credit-hours";

export const dashboardAccountingStudentCreditHoursAr: StudentCreditHoursLabels = {
  tabTitle: "الساعات المعتمدة",
  balanceCardTitle: "رصيد الساعات المعتمدة",
  remainingLabel: "المتبقي",
  consumedLabel: "المستهلك",
  totalLabel: "إجمالي المشترى",
  hoursUnit: hours => `${hours} ساعة`,
  recentPurchasesTitle: "نشاط الساعات الأخير",
  recentPurchasesEmpty: "لا يوجد نشاط على الساعات بعد.",
  lowBalanceAlert: (remaining, threshold) =>
    `الرصيد منخفض: ${remaining} ساعة متبقية (الحد ${threshold} ساعة). يُنصح بشراء باقة.`,

  columns: {
    date: "التاريخ",
    change: "التغيير",
    reason: "السبب",
    note: "ملاحظة",
  },

  reasons: {
    PURCHASE: "شراء",
    DEDUCTION: "حصة",
    REFUND: "استرداد",
    ADJUSTMENT: "تعديل",
  },

  perAudience: {
    studentHint: "تُستهلك الساعات لكل حصة حسب مدتها.",
    parentHint: "يمكنك شحن ساعات ابنك بشراء باقة من الأكاديمية.",
    teacherHint: "أرصدة ساعات الطلاب المسندين إليك. الحصة القادمة ستستهلك الساعات الموضحة.",
    supervisorHint: "رصيد الساعات المعتمدة للطالب وأحدث نشاطه الساعي.",
  },

  nextClassConsumes: hours => `الحصة القادمة تستهلك ~${hours} ساعة`,
  loadError: "فشل تحميل ملخص الساعات. حاول مرة أخرى.",
};
