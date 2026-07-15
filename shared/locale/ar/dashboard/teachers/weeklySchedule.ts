import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers";

export const weeklySchedule: TeacherWeeklyScheduleLabels = {
  pageTitle: name => `جدول ${name}`,
  breadcrumbs: {
    teachers: "المعلمون",
    schedule: "الجدول",
  },
  metrics: {
    weeklyHoursWorked: hours => `ساعات العمل الأسبوعية: ${hours}`,
  },
  actions: {
    addSlot: "إضافة فترة",
    delete: "حذف",
    clearSchedule: "مسح الجدول",
    deleteClass: "حذف الحصة",
  },
  grid: {
    teacherTime: "وقت المعلم",
    available: "متاح",
    lunchBreak: "استراحة غداء",
    bookedClass: "حصة محجوزة",
    availableSlot: "فترة متاحة",
    lastUpdated: time => `آخر تحديث: ${time}`,
    sessionEnded: "انتهت الحصة",
  },
  days: {
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
    sunday: "الأحد",
    mon: "اثنين",
    tue: "ثلاثاء",
    wed: "أربعاء",
    thu: "خميس",
    fri: "جمعة",
    sat: "سبت",
    sun: "أحد",
  },
  dialogs: {
    deleteConfirm: "هل أنت متأكد أنك تريد إزالة هذا الحجز؟",
    deleteConfirmClass: "هل أنت متأكد أنك تريد إزالة هذه الحصة من جدولك؟",
    deleteClassTitle: "تأكيد الحذف",
    deleteClassMessage: "هل أنت متأكد أنك تريد حذف هذه الحصة؟",
    clearScheduleTitle: "مسح الجدول الأسبوعي",
    clearScheduleMessage: "هل أنت متأكد أنك تريد حذف الجدول؟",
    confirmYes: "نعم",
    cancel: "إلغاء",
  },
  notifications: {
    classDeleted: "تم حذف الحصة بنجاح",
    classDeleteFailed: "فشل حذف الحصة",
    scheduleCleared: "تم مسح الجدول بنجاح",
    scheduleClearFailed: "فشل مسح الجدول",
  },
};
