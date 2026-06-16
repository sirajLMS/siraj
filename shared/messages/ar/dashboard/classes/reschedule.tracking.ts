import type { RescheduleTrackingLabels } from "../../../types/dashboard/classes";

export const rescheduleTracking: RescheduleTrackingLabels = {
  pageTitle: "نظرة عامة على لوحة التحكم",
  sectionTitle: "جدول الحصص والمتابعة",
  exportData: "تصدير البيانات",
  filter: "تصفية",
  showingOf: "عرض {shown} من {total} إدخال",
  noEntries: "لا توجد إدخالات",
  metrics: {
    pendingRequests: "الطلبات المعلقة",
    approvedClasses: "الحصص المعتمدة",
    leaveRequests: "طلبات الإجازة",
    reScheduled: "مُعاد جدولتها",
    cancelled: "ملغى",
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
    rescheduled: "عادي (مُعاد جدولته)",
    pendingLeave: "إجازة معلقة",
  },
  actions: {
    viewDetails: "عرض التفاصيل",
    approveLeave: "قبول الإجازة",
    rejectLeave: "رفض الإجازة",
  },
};
