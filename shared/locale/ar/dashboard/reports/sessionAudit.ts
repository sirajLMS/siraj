import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports/sessionAudit";

export const dashboardReportsSessionAuditAr: SessionAuditLabels = {
  title: "التقارير الشاملة — مراجعة الجلسات",
  filters: {
    teacher: "المعلم",
    student: "الطالب",
    dateRange: "النطاق الزمني",
    dateFrom: "من",
    dateTo: "إلى",
    status: "حالة الجلسة",
    search: "ابحث عن معلم / طالب",
    clear: "مسح الفلاتر",
    all: "جميع الحالات",
  },
  column: {
    scheduledStart: "بداية الجلسة",
    openSessionTime: "وقت الدخول",
    endSessionTime: "وقت الخروج",
    durationAssumed: "مدة الجلسة (دقيقة)",
    calculatedDuration: "مدة الاحتساب (دقيقة)",
    paidAmount: "المبلغ المستحق",
    calculationStatus: "حالة الاحتساب",
    note: "ملاحظة",
  },
  status: {
    open: "مفتوحة",
    end: "منتهية",
    Absent: "غيب المعلم",
    absent_student: "غاب الطالب",
  },
  cell: {
    notJoined: "لم ينضم",
    inProgress: "قيد التقدم",
    notCalculated: "—",
    viewFullNote: "عرض الملاحظة كاملة",
  },
  aggregate: {
    totalPaid: "إجمالي المستحق",
    paidRows: "الصفوف المدفوعة",
    unpaidRows: "الصفوف غير المدفوعة",
  },
  action: {
    openAuditPage: "افتح صفحة المراجعة",
    exportCsv: "تصدير CSV",
  },
  exportTruncated: "تم اقتطاع التصدير إلى 10 000 صف.",
  tooltip: {
    rawUtc: value => `التوقيت العالمي: ${value}`,
    bookingTimezone: value => `توقيت الحجز: ${value}`,
  },
  error: { dateRangeInvalid: "لا يمكن أن يكون تاريخ البداية بعد تاريخ النهاية." },
  emptyState: {
    title: "لا توجد جلسات تطابق الفلاتر الحالية.",
    titleNoFilters: "لا توجد جلسات بعد.",
    cta: "مسح الفلاتر",
  },
};
