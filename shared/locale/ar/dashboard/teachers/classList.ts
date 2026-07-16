import type { TeacherClassListLabels } from "@/shared/locale/types/dashboard/teachers";

export const dashboardTeacherClassListAr: TeacherClassListLabels = {
  pageTitle: "قائمة الحصص",
  pageSubtitle: "عرض وإدارة حصصك المجدولة",
  noClasses: "لم يتم العثور على حصص.",
  viewDetails: "عرض التفاصيل",
  viewClassAudit: "عرض تدقيق الحصة",
  joinVideo: "انضمام للفيديو",
  durationMinutes: minutes => `${minutes} دقيقة`,
  errors: {
    failedToLoad: "فشل تحميل الحصص.",
  },
  statusLabels: {
    PENDING: "قيد الانتظار",
    TAKEN: "مأخوذة",
    ABSENT: "غائب",
    LEAVE: "إجازة",
    NOT_ACTIVATED: "غير مفعلة",
    ACTIVATED: "مفعلة",
    RUNNING: "جارٍ التنفيذ",
    COMPLETED: "مكتملة",
  },
};
