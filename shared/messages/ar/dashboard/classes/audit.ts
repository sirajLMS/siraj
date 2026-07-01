import type { ClassAuditLabels } from "../../../types/dashboard/classes";

export const classAudit: ClassAuditLabels = {
  invalidClassId: "معرف الحصة غير صالح",
  pageTitle: "عرض تفاصيل الحصة",
  mobileTitle: "سجل تدقيق الحصة",
  breadcrumbs: {
    dashboard: "لوحة التحكم",
    schedules: "الجداول",
    current: "سجل تدقيق الحصة",
  },
  actions: {
    generateReport: "إنشاء تقرير",
    editClass: "تعديل الحصة",
  },
  fields: {
    courseCode: "رمز المقرر",
    teacher: "المعلم",
    originalDate: "التاريخ الأصلي",
    rescheduledDate: "تاريخ إعادة الجدولة",
    timeSlot: "الفترة الزمنية",
    venue: "المكان",
    classDetails: "تفاصيل الحصة",
  },
  status: {
    regularRescheduled: "عادي (مُعاد جدولته)",
  },
  auditTrail: {
    title: "سجل التدقيق الآلي والملاحظات",
  },
  students: {
    title: "الطلاب المسجلون ({count})",
    exportList: "تصدير القائمة",
    studentName: "اسم الطالب",
    idNumber: "رقم الهوية",
    attendanceStatus: "حالة الحضور",
    actions: "الإجراءات",
    student: "الطالب",
    status: "الحالة",
    viewAll: "عرض جميع {count} طالب",
    pending: "معلّق",
    present: "حاضر",
    absent: "غائب",
    noEntries: "لا يوجد طلاب",
  },
  venue: {
    title: "موقع القاعة",
    capacity: "السعة: {count} طالب",
    viewMap: "عرض",
    capacityBadge: "سعة {count} طالب",
  },
  communication: {
    title: "سجل التواصل",
    resendNotifications: "إعادة إرسال الإشعارات",
  },
  adminNote: {
    title: "ملاحظة المدير",
    titleMobile: "المبرر الإداري",
    lastUpdated: "آخر تحديث: {time}",
    update: "تحديث",
    edit: "تعديل",
  },
  meetingIdLabel: "معرف الاجتماع:",
  online: "عبر الإنترنت",
  meetingIdNA: "غير متوفر",
};
