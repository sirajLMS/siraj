import type { ClassAuditLabels } from "@/shared/locale/types/dashboard/classes";

export const dashboardClassAuditAr: ClassAuditLabels = {
  invalidClassId: "معرّف الحصة غير صالح",
  pageTitle: "سجل تدقيق الحصة",
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
    noNotes: "لا توجد ملاحظات تدقيق بعد",
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
    title: "اجتماع عبر الإنترنت",
    joinMeeting: "الانضمام إلى الاجتماع",
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
    content: "محتوى الملاحظة",
  },
  meetingIdLabel: "معرّف الاجتماع:",
  online: "عبر الإنترنت",
  meetingIdNA: "غير متوفر",
  watchOnline: "المشاهدة عبر الإنترنت",
};

export { dashboardClassAuditAr as audit };
