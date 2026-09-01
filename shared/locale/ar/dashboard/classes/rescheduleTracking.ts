import type { RescheduleTrackingLabels } from "@/shared/locale/types/dashboard/classes";

export const dashboardRescheduleTrackingAr: RescheduleTrackingLabels = {
  pageTitle: "نظرة عامة على لوحة التحكم",
  sectionTitle: "جدول الحصص والمتابعة",
  exportData: "تصدير البيانات",
  filterAll: "الكل",
  showingOf: (shown, total) => `عرض ${shown} من ${total} إدخال`,
  noEntries: "لا توجد إدخالات",
  metrics: {
    pendingRequests: "الطلبات المعلقة",
    approvedClasses: "الحصص المعتمدة",
    leaveRequests: "طلبات الإجازة",
    reScheduled: "مُعاد جدولتها",
    cancelled: "ملغاة",
  },
  table: {
    teacherName: "اسم المعلم",
    studentClass: "الطالب / الحصة",
    scheduledDate: "التاريخ المجدول",
    timeSlot: "الفترة الزمنية",
    classStatus: "حالة الحصة",
    action: "الإجراء",
  },
  badges: {
    newDate: "تاريخ جديد",
    leaveRequest: "طلب إجازة",
  },
  status: {
    rescheduled: "عادية (مُعاد جدولتها)",
    pendingLeave: "إجازة معلقة",
    approved: "معتمدة",
    cancelled: "ملغاة",
  },
  actions: {
    viewDetails: "عرض التفاصيل",
    approveLeave: "قبول الإجازة",
    approveSuccess: "تم قبول الإجازة بنجاح",
    rejectLeave: "رفض الإجازة",
  },
  errors: {
    missingOriginalClassId: "لا يمكن تنفيذ الإجراء: معرّف الحصة الأصلية مفقود",
    approveFailed: "فشل في قبول الإجازة",
  },
  loadFailed: "فشل تحميل بيانات التتبع.",
};
