import type { TeacherCreateRecurringClassLabels } from "@/shared/messages/types/dashboard/teachers";

export const teacherCreateRecurringClass: TeacherCreateRecurringClassLabels = {
  dialogTitle: "إضافة حصة",
  fields: {
    student: "الطالب",
    studentPlaceholder: "ابحث واختر طالباً...",
    teacher: "المعلم",
    teacherPlaceholder: "ابحث واختر معلماً...",
    time: "الوقت",
    duration: "المدة",
    durationMinutes: "المدة (بالدقائق)",
    days: "الأيام المتكررة",
    timezone: "المنطقة الزمنية",
    classType: "نوع الحصة",
  },
  classTypes: {
    REGULAR: "عادي",
    TRIAL: "تجريبي",
    ADVANCE: "متقدم",
  },
  days: {
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
    saturday: "السبت",
    sunday: "الأحد",
  },
  timeOverride: {
    addOverride: "إضافة وقت مخصص",
    removeOverride: "إزالة التخصيص",
    label: "وقت مخصص",
  },
  actions: {
    create: "إنشاء الحصة",
    cancel: "إلغاء",
    submitting: "جارٍ الإرسال...",
  },
  success: {
    title: "تم إنشاء الحصة",
    description: "تم إنشاء {count} حصة بنجاح للجدول المتكرر.",
  },
  errors: {
    noDaysSelected: "يرجى اختيار يوم واحد على الأقل للجدول المتكرر.",
    noStudentSelected: "يرجى اختيار طالب.",
    creationFailed: "فشل إنشاء الحصة المتكررة. يرجى المحاولة مرة أخرى.",
    durationMustBePositive: "يجب أن تكون المدة أكبر من 0",
  },
};
