import type { TeacherClassListLabels } from "@/shared/locale/types/dashboard/teachers";

export const classList: TeacherClassListLabels = {
  pageTitle: "تفاصيل الحصة",
  pageSubtitle: "راجع حصصك الأخيرة والقادمة.",
  noClasses: "لم يتم العثور على حصص للفترة المحددة.",
  viewDetails: "عرض التفاصيل",
  viewClassAudit: "عرض تدقيق الحصة",
  durationMinutes: minutes => `${minutes} دقيقة`,
  errors: {
    failedToLoad: "فشل تحميل الحصص.",
  },
};
