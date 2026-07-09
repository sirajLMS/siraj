import type { TeachersDirectoryLabels } from "@/shared/messages/types/dashboard/teachers";

export const directory: TeachersDirectoryLabels = {
  pageTitle: "دليل المعلمين",
  pageSubtitle: "إدارة شاملة لجميع الكوادر التعليمية النشطة وغير النشطة.",
  metrics: {
    activated: "نشط",
    deactivated: "غير نشط",
  },
  actions: {
    updateSchedules: "تحديث الجداول",
    addTeacher: "إضافة معلم",
    joinRoom: "انضمام للغرفة",
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
    showingOf: "عرض {count} من أصل {total} معلم",
    linkPending: "الرابط قيد الانتظار",
  },
  fields: {
    phone: "الهاتف",
  },
  status: {
    active: "نشط",
    offline: "غير متصل",
  },
};
