import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students";

export const quota: StudentQuotaLabels = {
  pageTitle: "تعديل الملف الشخصي للطالب",
  studentId: id => `معرف الطالب: #${id}`,
  common: {
    system: "النظام",
    notSet: "غير محدد",
  },
  breadcrumbs: {
    students: "الطلاب",
    adjustQuota: "تعديل الحصة",
  },
  sections: {
    studentInfo: "معلومات الطالب",
    courseDetails: "تفاصيل الدورة",
  },
  fields: {
    studentName: "اسم الطالب",
    studentNamePlaceholder: "أدخل الاسم الكامل",
    dateOfBirth: "تاريخ الميلاد",
    language: "اللغة",
    arabic: "العربية",
    english: "الإنجليزية",
    gender: "الجنس",
    male: "ذكر",
    female: "أنثى",
    teacher: "المعلم",
    loadingTeachers: "جاري تحميل المعلمين...",
    totalClasses: "إجمالي الحصص",
    classesLeft: "الحصص المتبقية",
    overrideActive: "يدوي",
    overrideNotice: "تجاوز الحصة اليدوي نشط. ستتجاهل هذه القيمة الاستهلاك التلقائي لدورة الفوترة الحالية.",
  },
  actions: {
    save: "حفظ التغييرات",
    cancel: "إلغاء",
    saving: "جاري الحفظ...",
    saved: "تم الحفظ!",
    saveSuccess: "تم تحديث الحصة بنجاح.",
    lastEditedAt: time => `آخر تعديل: ${time}`,
  },
  info: {
    quotaTitle: "إدارة الحصص",
    quotaDesc:
      "سيؤدي تعديل 'الحصص المتبقية' إلى تجاوز التتبع التلقائي للحضور لدورة الفوترة هذه. استخدم هذا للجلسات التكميلية أو أرصدة التعويض.",
    publicTitle: "الملف العام",
    publicDesc: "ستكون التغييرات على الاسم واللغة مرئية للمعلمين وأولياء الأمور في لوحات التحكم الخاصة بهم على الفور.",
  },
  validation: {
    nameRequired: "اسم الطالب مطلوب",
    dobRequired: "تاريخ الميلاد مطلوب",
    languageRequired: "اللغة مطلوبة",
    genderRequired: "الجنس مطلوب",
    teacherRequired: "المعلم مطلوب",
    totalClassesRequired: "إجمالي الحصص مطلوب",
    totalClassesMin: "يجب أن يكون إجمالي الحصص 0 على الأقل",
    classesLeftRequired: "الحصص المتبقية مطلوبة",
    classesLeftMin: "يجب أن تكون الحصص المتبقية 0 على الأقل",
  },
  errors: {
    invalidId: "معرف الطالب غير صالح.",
  },
};
