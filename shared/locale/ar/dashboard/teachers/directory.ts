import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers";

export const dashboardTeachersDirectoryAr: TeachersDirectoryLabels = {
  pageTitle: "دليل المعلمين",
  pageSubtitle: "إدارة وعرض جميع المعلمين",
  emptyMessage: "لا يوجد معلمون",
  metrics: {
    activated: "نشط",
    deactivated: "غير نشط",
  },
  actions: {
    updateSchedules: "تحديث الجداول",
    addTeacher: "إضافة معلم",
    joinRoom: "الانضمام إلى الغرفة",
    viewSchedule: "عرض الجدول",
    options: "خيارات",
  },
  table: {
    hash: "#",
    image: "الصورة",
    name: "الاسم",
    email: "البريد الإلكتروني",
    zoom: "زووم",
    schedule: "الجدول",
    options: "خيارات",
    showingOf: (count, total) => `عرض ${count} من أصل ${total} معلم`,
    linkPending: "الرابط قيد الانتظار",
  },
  fields: {
    phone: "الهاتف",
    searchTeachers: "ابحث عن المعلمين",
  },
  status: {
    active: "نشط",
    offline: "غير متصل",
  },
};
