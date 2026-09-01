import type { RecurringSchedulesListLabels } from "@/shared/locale/types/dashboard/classes/recurringSchedulesList";

export const recurringSchedulesList: RecurringSchedulesListLabels = {
  shell: {
    pageTitle: "الجداول المتكررة",
    subtitle: "إدارة جداول الحصص المتكررة",
    breadcrumbDashboard: "لوحة التحكم",
    breadcrumbClasses: "الحصص",
    emptyMessage: "لم يتم العثور على جداول متكررة",
    loadError: "فشل تحميل الجداول المتكررة",
  },
  columns: {
    student: "الطالب",
    teacher: "المعلم",
    schedule: "الجدول",
    duration: "المدة",
    durationMinutesShort: minutes => `${minutes} دقيقة`,
    rate: "السعر",
    actions: "الإجراءات",
  },
  actions: {
    view: "عرض",
    edit: "تعديل",
  },
  filters: {
    searchPlaceholder: "البحث حسب الطالب أو المعلم...",
    searchLabel: "بحث",
  },
};
