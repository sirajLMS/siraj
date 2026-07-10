import type { StudentHistoryLabels } from "@/shared/messages/types/dashboard/students";

export const history: StudentHistoryLabels = {
  breadcrumbs: {
    archive: "أرشيف الطلاب",
    history: "تاريخ الحصص",
  },
  common: {
    student: "طالب",
  },
  pageTitle: "تاريخ حصص {name}",
  pageSubtitle: "{month} • العام الدراسي 2024/25",
  exportPdf: "تصدير PDF",
  changeMonth: "تغيير الشهر",
  metrics: {
    totalClasses: "إجمالي الحصص",
    attendanceRate: "معدل الحضور",
    hoursStudied: "ساعات الدراسة",
    performance: "الأداء",
  },
  calendar: {
    weeklyAttendance: "الحضور الأسبوعي",
    week: "الأسبوع {number}",
    days: {
      sun: "الأحد",
      mon: "الاثنين",
      tue: "الثلاثاء",
      wed: "الأربعاء",
      thu: "الخميس",
      fri: "الجمعة",
      sat: "السبت",
    },
  },
  classDetails: {
    title: "تفاصيل الحصة",
    classDetails: "تفاصيل الحصة - {date}",
    instructor: "المعلم: {name}",
    timeSlot: "فترة الحصة",
    roomNo: "رقم الغرفة",
    contentNotes: "محتوى وملاحظات الحصة",
    viewAssignments: "عرض الواجبات",
    downloadLogs: "تنزيل السجلات",
    status: {
      present: "حاضر",
      absent: "غائب",
      late: "متأخر",
      PENDING: "معلّق",
      TAKEN: "مأخوذ",
      ABSENT: "غائب",
      LEAVE: "إجازة",
      NOT_ACTIVATED: "غير مفعّل",
      ACTIVATED: "مفعّل",
      RUNNING: "جارٍ",
      COMPLETED: "مكتمل",
    },
    noSessions: "لا توجد حصص مجدولة لهذا التاريخ.",
  },
  performanceStreak: {
    title: "سلسلة الأداء",
    description: "لقد حضرت 100% من الحصص هذا الأسبوع. واصل هذا الزخم!",
  },
  errors: {
    loadFailed: "فشل في تحميل سجل الطالب.",
  },
};
