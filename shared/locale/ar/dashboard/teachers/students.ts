import type { TeacherStudentsLabels } from "@/shared/locale/types/dashboard/teachers";

export const students: TeacherStudentsLabels = {
  pageTitle: "طلابك",
  pageSubtitle: "الطلاب المعينون حالياً لجدولك التدريسي.",
  noStudents: "لا يوجد طلاب معينون لك بعد.",
  statusLabel: status => `الحالة: ${status}`,
  quotaLabel: (remaining, total) => `الحصص المتبقية: ${remaining} / ${total}`,
  hoursLabel: hours => `ساعات أسبوعياً: ${hours}`,
  errors: {
    failedToLoad: "فشل تحميل طلابك.",
  },
};
