import type { StaffOnboardingLabels } from "@/shared/locale/types/dashboard/staff/onboarding";

export const dashboardStaffOnboardingAr: StaffOnboardingLabels = {
  pageTitle: "انضمام الموظف",
  pageSubtitle: "سجّل موظفاً جديداً.",
  sections: {
    staffInfo: "معلومات الموظف",
    systemAccess: "صلاحيات النظام",
  },
  fields: {
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني الرسمي",
    phone: "رقم الهاتف",
    accountType: "نوع الحساب",
    department: "القسم الرئيسي",
    password: "كلمة المرور",
    avatar: "الصورة الشخصية",
  },
  placeholders: {
    fullName: "مثال: د. سلمان الفارسي",
    email: "s.alfarsi@siraj-lms.edu",
    phone: "+966 50 000 0000",
    department: "اختر القسم",
    password: "أدخل كلمة المرور",
  },
  options: {
    accountType: {
      manager: "مدير الأكاديمية",
      supervisor: "مشرف",
    },
    accountTypeDescriptions: {
      manager: "وصول إداري كامل للنظام لإدارة المعلمين والطلاب والجداول والمالية عدا إدارة الصلاحيات",
      supervisor: "يشرف المشرفون على المعلمين ويراجعون التقارير ويديرون الأنشطة التعليمية اليومية.",
    },
    department: {
      academic: "الشؤون الأكاديمية",
      operations: "عمليات الطلاب",
      humanResources: "الموارد البشرية",
      itSupport: "دعم تقنية المعلومات",
    },
  },
  actions: {
    signup: "إنشاء موظف",
    processing: "جاري المعالجة...",
    cancel: "إلغاء",
    successMessage: "تم تقديم طلب الحساب بنجاح. في انتظار موافقة مدير النظام.",
    errorMessage: "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.",
  },
  metrics: {
    activeStaff: "الموظفون النشطون",
    pendingApproval: "بانتظار الموافقة",
    avgOnboarding: "متوسط مدة الانضمام",
  },
  validation: {
    fullNameRequired: "الاسم الكامل مطلوب",
    emailInvalid: "البريد الإلكتروني غير صالح",
    departmentRequired: "القسم الرئيسي مطلوب",
    passwordRequired: "كلمة المرور مطلوبة",
    passwordMinLength: "يجب أن تكون كلمة المرور ١٢ حرفاً على الأقل.",
    passwordWeakComplexity: "يجب أن تحتوي كلمة المرور على فئتين على الأقل من: أحرف صغيرة، أحرف كبيرة، أرقام، رموز",
  },
};
