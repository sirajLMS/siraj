import type { StudentHistoryLabels } from "@/shared/locale/types/dashboard/students";

export const dashboardStudentHistoryAr: StudentHistoryLabels = {
  breadcrumbs: {
    archive: "أرشيف الطلاب",
    history: "تاريخ الحصص",
  },
  common: {
    student: "طالب",
  },
  pageTitle: name => `تاريخ حصص ${name}`,
  pageSubtitle: month => `${month}`,
  exportPdf: "تصدير PDF",
  changeMonth: "تغيير الشهر",
  metrics: {
    totalClasses: _count => `إجمالي الحصص`,
    attendanceRate: _rate => `معدل الحضور`,
    hoursStudied: _hours => `ساعات الدراسة`,
    performance: _score => `الأداء`,
  },
  calendar: {
    weeklyAttendance: "الحضور الأسبوعي",
    week: number => `الأسبوع ${number}`,
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
    classDetails: date => `تفاصيل الحصة - ${date}`,
    instructor: name => `المعلم: ${name}`,
    timeSlot: "فترة الحصة",
    roomNo: "رقم الغرفة",
    contentNotes: "محتوى وملاحظات الحصة",
    viewAssignments: "عرض الواجبات",
    downloadLogs: "تنزيل السجلات",
    joinSession: "الانضمام للحصة",
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
    dayOfMonth: (day, month) => `يوم ${day} من ${month}`,
  },
  performanceStreak: {
    title: "سلسلة الأداء",
    description: _count => `لقد حضرت 100% من الحصص هذا الأسبوع. واصل هذا الزخم!`,
  },
  errors: {
    loadFailed: "فشل في تحميل سجل الطالب.",
  },
};
