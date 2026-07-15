import type { TeacherClassListLabels } from "@/shared/messages/types/dashboard/teachers/class-list";

export const classList: TeacherClassListLabels = {
  pageTitle: "قائمة الحصص",
  pageSubtitle: "عرض وإدارة حصصك المجدولة",
  noClasses: "لم يتم العثور على حصص.",
  viewDetails: "عرض التفاصيل",
  viewClassAudit: "عرض تدقيق الحصة",
  joinVideo: "انضمام للفيديو",
  durationMinutes: (minutes: number) => `${minutes} دقيقة`,
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
