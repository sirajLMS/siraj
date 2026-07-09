import type { ParentStudentsLabels } from "@/shared/messages/types/dashboard/parents/students";

export const parentStudents: ParentStudentsLabels = {
  pageTitle: "طلابك",
  pageSubtitle: "الطلاب المرتبطون بحساب عائلتك.",
  noStudents: "لا يوجد طلاب مرتبطون بحسابك بعد.",
  statusLabel: "الحالة: {status}",
  teacherLabel: "المعلم: {teacher}",
  quotaLabel: "الحصص المتبقية: {remaining} / {total}",
  hoursLabel: "ساعات أسبوعياً: {hours}",
  errors: {
    failedToLoad: "تعذر تحميل طلابك.",
  },
};
