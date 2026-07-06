import type { TeacherStudentsLabels } from "../../../types/dashboard/teachers/students";

export const students: TeacherStudentsLabels = {
  pageTitle: "طلابك",
  pageSubtitle: "الطلاب المعينون حالياً لجدولك التدريسي.",
  noStudents: "لا يوجد طلاب معينون لك بعد.",
  statusLabel: "الحالة: {status}",
  quotaLabel: "الحصص المتبقية: {remaining} / {total}",
  hoursLabel: "ساعات أسبوعياً: {hours}",
  errors: {
    failedToLoad: "فشل تحميل طلابك.",
  },
};
