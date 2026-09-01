import type { TeacherStudentsLabels } from "@/shared/locale/types/dashboard/teachers";

export const dashboardTeacherStudentsAr: TeacherStudentsLabels = {
  pageTitle: "طلابي",
  pageSubtitle: "عرض وإدارة طلابك",
  noStudents: "لا يوجد طلاب معينون لك بعد.",
  columns: {
    name: "الطالب",
    status: "الحالة",
    quota: "الحصص المتبقية",
    hours: "الساعات الأسبوعية",
  },
  statusLabel: status => `الحالة: ${status}`,
  quotaLabel: (remaining, total) => `الحصص المتبقية: ${remaining} / ${total}`,
  hoursLabel: hours => `ساعات أسبوعياً: ${hours}`,
  errors: {
    failedToLoad: "فشل تحميل بيانات الطلاب.",
  },
};
