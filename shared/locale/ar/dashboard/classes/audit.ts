import type { ClassAuditLabels } from "@/shared/locale/types/dashboard/classes";

export const dashboardClassAuditAr: ClassAuditLabels = {
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
    title: count => `الطلاب المسجلون (${count})`,
    exportList: "تصدير القائمة",
    studentName: "اسم الطالب",
    idNumber: "رقم الهوية",
    attendanceStatus: "حالة الحضور",
    actions: "الإجراءات",
    student: "الطالب",
    status: "الحالة",
    viewAll: count => `عرض جميع ${count} طالب`,
    pending: "معلّق",
    present: "حاضر",
    absent: "غائب",
    noEntries: "لا يوجد طلاب",
    viewStudentAriaLabel: name => `عرض ${name}`,
  },
  venue: {
    title: "موقع القاعة",
    capacity: count => `السعة: ${count} طالب`,
    viewMap: "عرض",
    capacityBadge: count => `سعة ${count} طالب`,
  },
  meeting: {
    title: "الاجتماع عبر الإنترنت",
    joinMeeting: "انضم إلى الاجتماع",
  },
  communication: {
    title: "سجل التواصل",
    resendNotifications: "إعادة إرسال الإشعارات",
  },
  adminNote: {
    title: "ملاحظة المدير",
    titleMobile: "المبرر الإداري",
    lastUpdated: time => `آخر تحديث: ${time}`,
    update: "تحديث",
    edit: "تعديل",
  },
  meetingIdLabel: "معرف الاجتماع:",
  online: "عبر الإنترنت",
  meetingIdNA: "غير متوفر",
};

export { dashboardClassAuditAr as audit };
