import type { ReportsLabels } from "@/shared/locale/types/dashboard/reports";

export const dashboardReportsAr: ReportsLabels = {
  pageTitle: "محرك التقارير الرئيسي",
  pageSubtitle: "محرك التقارير والتحليلات الرئيسي",
  filtersTitle: "فلاتر التقرير",
  fromDate: "من تاريخ",
  toDate: "إلى تاريخ",
  teacher: "المعلم",
  allTeachers: "جميع المعلمين",
  reportType: "نوع التقرير",
  submit: "إرسال",
  exportCsv: "تصدير CSV",
  printReport: "طباعة التقرير",
  export: {
    pageTitle: "تقرير الحضور",
  },
  reportTypes: {
    byTeacher: "حسب المعلم",
    byStudent: "حسب الطالب",
    byDate: "حسب التاريخ",
  },
  table: {
    name: "الاسم (معلم/طالب)",
    taken: "حضر",
    absent: "غائب",
    leave: "إجازة",
    pending: "معلق",
    hours: "الساعات",
    paid: "مدفوع",
    paidDisplay: "مدفوع (معروض)",
    paidLocked: "مدفوع (مقفل)",
    totals: "الإجمالي:",
  },
  convertedAmount: (lockedAmount, lockedCurrency, convertedApprox, displayCurrency) =>
    `${lockedAmount} ${lockedCurrency} (تقريباً ${convertedApprox} ${displayCurrency})`,
  convertedTotalApprox: (convertedApprox, displayCurrency) => `≈ ${convertedApprox} ${displayCurrency}`,
  summary: {
    engagementRate: "معدل المشاركة",
    engagementGrowth: "النمو مقارنة بالشهر السابق",
    increase: "زيادة",
    financialDistribution: "التوزيع المالي",
    financialSubtitle: "نظرة عامة على الصرف متعدد العملات",
  },
  ledger: {
    title: "سجل الأداء",
    studentLabel: name => `الطالب: ${name}`,
    paid: "مدفوع",
  },
  status: {
    active: "نشط",
    onBreak: "في إجازة",
  },
  noEntries: "لا توجد بيانات تقرير لهذا النطاق",
  reportMultiCurrencyNote:
    "يُعرض التوزيع المالي بالمبالغ الأصلية بالعملات الأصلية. استخدم فلتر التقرير لتضييق النطاق حسب المعلم لإجماليات حسب العملة.",
  validation: {
    invalidDateRange: "نطاق التاريخ غير صالح",
  },
};
