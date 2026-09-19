import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting/profit-loss";

export const dashboardAccountingProfitLossAr: ProfitLossLabels = {
  title: "الأرباح والخسائر",

  filter: {
    month: "الشهر",
    currency: "العملة",
  },

  fx: {
    chip: count => {
      if (count === 0) return "لم يُستبعد أي صف";
      if (count === 1) return "صف واحد مستبعد (سعر صرف مفقود)";
      if (count === 2) return "صفان مستبعدان (سعر صرف مفقود)";
      if (count >= 3 && count <= 10) return `${count} صفوف مستبعدة (سعر صرف مفقود)`;
      return `${count} صفاً مستبعداً (سعر صرف مفقود)`;
    },
    tooltip: pairs => `الصفوف في أزواج العملات التالية مستبعدة من الإجماليات لعدم توفر سعر صرف: ${pairs}`,
  },

  tab: {
    payments: "المدفوعات",
    expenses: "المصروفات",
    incomePayments: "الدفعات الواردة",
    profits: "الأرباح",
  },

  column: {
    scheduledStart: "بداية الجلسة",
    calculationStatus: "حالة الحساب",
    teacher: "المعلم",
    student: "الطالب",
    subject: "المادة",
    duration: "المدة (دقيقة)",
    studentPaidAmount: "المدفوع من الطالب",
    manualSubtractCredits: "خصم الأرصدة",
    title: "العنوان",
    type: "النوع",
    value: "القيمة",
    paymentDate: "تاريخ الدفع",
    paymentMethod: "وسيلة الدفع",
    parentName: "ولي الأمر",
    packageName: "الباقة",
    invoiceId: "الفاتورة",
    source: "المصدر",
  },

  aggregate: {
    totalPayments: "إجمالي المدفوعات",
    totalExpenses: "إجمالي المصروفات",
    totalIncomePayments: "إجمالي الدفعات الواردة",
    netProfit: "صافي الربح",
    netProfitMargin: "هامش صافي الربح",
    dominantCurrency: "العملة السائدة",
    excludedRows: count => {
      if (count === 0) return "لم يُستبعد أي صف";
      if (count === 1) return "صف واحد مستبعد (سعر صرف مفقود)";
      if (count === 2) return "صفان مستبعدان (سعر صرف مفقود)";
      if (count >= 3 && count <= 10) return `${count} صفوف مستبعدة (سعر صرف مفقود)`;
      return `${count} صفاً مستبعداً (سعر صرف مفقود)`;
    },
  },

  action: {
    exportCsv: "تصدير CSV",
  },

  status: {
    positive: "ربح",
    negative: "خسارة",
    breakeven: "تعادل",
  },

  empty: {
    title: "لا توجد بيانات لهذا الشهر",
    description: "جرّب شهرًا آخر أو تحقق لاحقًا.",
  },

  error: {
    monthInvalid: "يجب أن يكون الشهر بصيغة YYYY-MM.",
    paginationInvalid: "يجب أن يكون حجم الصفحة والإزاحة رقمين موجبين ضمن النطاق المسموح.",
  },
};
