import type { StudentOnboardingLabels } from "@/shared/messages/types/dashboard/students";

export const onboarding: StudentOnboardingLabels = {
  pageTitle: "تسجيل طالب جديد",
  pageSubtitle: "أكمل الحقول التالية لإضافة طالب جديد تحت ولي أمر موجود.",
  statusBanner: "حالة الحساب: قيد التسجيل",
  sections: {
    parentAssignment: "ولي الأمر",
    studentInfo: "معلومات الطالب",
    teacherAssignment: "تعيين المعلم",
  },
  fields: {
    parent: "ولي الأمر",
    name: "اسم الطالب",
    dateOfBirth: "تاريخ الميلاد",
    gender: "الجنس",
    language: "اللغة",
    status: "الحالة",
    primaryTeacher: "المعلم الأساسي",
    male: "ذكر",
    female: "أنثى",
  },
  placeholders: {
    parent: "اختر ولي الأمر",
    name: "مثال: أحمد محمد",
    dateOfBirth: "YYYY-MM-DD",
    gender: "اختر الجنس",
    language: "اختر اللغة",
    status: "اختر الحالة",
    primaryTeacher: "اختر المعلم (اختياري)",
  },
  options: {
    status: {
      onTrial: "تجريبي",
      regular: "منتظم",
    },
  },
  actions: {
    create: "إنشاء الطالب",
    processing: "جاري الإنشاء...",
    successMessage: "تم إنشاء الطالب بنجاح.",
  },
  validation: {
    parentRequired: "ولي الأمر مطلوب",
    nameRequired: "اسم الطالب مطلوب",
    nameMinLength: "يجب أن يكون الاسم 3 أحرف على الأقل",
  },
};
