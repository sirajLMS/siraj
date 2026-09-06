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
  carryover: {
    bulkAction: "رصيد الترحيل",
    linkedColumn: "الترحيل",
    linkedChip: "مرتبطة",
    dialog: {
      title: "إنشاء أرصدة ترحيل",
      intro:
        "سيتم تجميع الجلسات المحددة حسب المعلم وتحويلها إلى أرصدة ترحيل. يجب أن تكون كل جلسة مكتملة المراجعة وغير مرتبطة مسبقاً.",
      teacherLine: (teacherName, count) => {
        if (count === 1) return `${teacherName} — جلسة واحدة`;
        if (count === 2) return `${teacherName} — جلستان`;
        if (count >= 3 && count <= 10) return `${teacherName} — ${count} جلسات`;
        return `${teacherName} — ${count} جلسة`;
      },
      totalSessions: count => {
        if (count === 1) return "جلسة واحدة محددة";
        if (count === 2) return "جلستان محددتان";
        if (count >= 3 && count <= 10) return `${count} جلسات محددة`;
        return `${count} جلسة محددة`;
      },
      confirm: "إنشاء الترحيل",
      cancel: "إلغاء",
    },
  },
  emptyState: {
    title: "لا توجد جلسات تطابق فلاترك",
    titleNoFilters: "لا توجد أحداث جلسات بعد.",
    subtitle: "جرّب توسيع النطاق الزمني أو مسح فلتر الحالة.",
    cta: "مسح الفلاتر",
  },
  accessDenied: {
    title: "ليس لديك صلاحية لعرض هذا التقرير",
    descriptionPrefix: "اطلب من المسؤول منحك صلاحية",
    descriptionSuffix: "للوصول إلى مراجعة أحداث الجلسات.",
    statusChip: "403 · INSUFFICIENT_PERMISSIONS",
    backToDashboard: "العودة إلى لوحة التحكم",
    contactSupport: "تواصل مع الدعم",
  },
};
