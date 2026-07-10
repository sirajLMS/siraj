import type { ReportsLabels } from "@/shared/messages/types/dashboard/reports";

export const reports: ReportsLabels = {
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
    totals: "الإجمالي:",
  },
  convertedAmount: "{lockedAmount} {lockedCurrency} (تقريباً {convertedApprox} {displayCurrency})",
  summary: {
    engagementRate: "معدل المشاركة",
    engagementGrowth: "النمو مقارنة بالشهر السابق",
    increase: "زيادة",
    financialDistribution: "التوزيع المالي",
    financialSubtitle: "نظرة عامة على الصرف متعدد العملات",
  },
  ledger: {
    title: "سجل الأداء",
    studentLabel: "الطالب: {name}",
    paid: "مدفوع",
  },
  status: {
    active: "نشط",
    onBreak: "في إجازة",
  },
  noEntries: "لا توجد بيانات تقرير لهذا النطاق",
};
