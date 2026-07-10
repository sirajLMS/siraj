import type { ScheduleAlertsLabels } from "@/shared/messages/types/dashboard/core";

export const scheduleAlerts: ScheduleAlertsLabels = {
  pageTitle: "التنبيهات والحصص",
  pageSubtitle: "مراقبة تنبيهات الجدول والحصص اليومية.",
  alerts: {
    leaveQuotaExceeded: "لقد وصلت إلى الحد الأقصى لترك الحصص.",
    missedClassTime: "لقد فات وقت الحصة",
  },
  metrics: {
    totalStudents: "إجمالي الطلاب",
    totalStudentsTrend: "+12% عن الشهر الماضي",
    activeCourses: "الحصص النشطة",
    activeCoursesSub: "عبر 8 أقسام",
  },
  report: {
    title: "التقرير المؤسسي 2024",
    description: "راجع الأداء المالي والأكاديمي الكامل للفصل الدراسي الربيعي.",
    descriptionMobile: "تدقيق كامل للأداء الأكاديمي والمالي.",
    downloadPdf: "تحميل PDF",
  },
  section: {
    title: "الجدول الأكاديمي",
    subtitle: "إدارة حصص اليوم والحضور",
  },
  table: {
    className: "اسم الحصة",
    instructor: "المعلم",
    time: "الوقت",
    room: "القاعة",
    status: "الحالة",
  },
  actions: {
    filter: "تصفية",
    export: "تصدير",
    joinSession: "الانضمام للحصة",
    leaveClass: "ترك الحصة",
    viewClassAudit: "عرض تدقيق الحصة",
  },
  sessionStatus: {
    active: "نشط",
    upcoming: "قادم",
    missed: "فائت",
  },
  showingOf: "عرض {shown} من {total} حصة",
  noEntries: "لا توجد حصص",
  endOfSchedule: "نهاية جدول اليوم الرئيسي",
  loading: "جارٍ التحميل...",
};
