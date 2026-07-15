import type { ParentStudentsLabels } from "@/shared/locale/types/dashboard/parents";

export const students: ParentStudentsLabels = {
  pageTitle: "طلابك",
  pageSubtitle: "الطلاب المرتبطون بحساب عائلتك.",
  noStudents: "لا يوجد طلاب مرتبطون بحسابك بعد.",
  statusLabel: status => `الحالة: ${status}`,
  teacherLabel: teacher => `المعلم: ${teacher}`,
  quotaLabel: (remaining, total) => `الحصص المتبقية: ${remaining} / ${total}`,
  hoursLabel: hours => `ساعات أسبوعياً: ${hours}`,
  errors: {
    failedToLoad: "تعذر تحميل طلابك.",
  },
};
