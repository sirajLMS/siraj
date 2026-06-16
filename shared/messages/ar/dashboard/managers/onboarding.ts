import type { ManagerOnboardingLabels } from "../../../types/dashboard/managers";

export const managerOnboarding: ManagerOnboardingLabels = {
  pageTitle: "انضمام المدير",
  pageSubtitle: "سجّل موظفاً إدارياً جديداً في نظام إدارة سراج.",
  sections: {
    staffInfo: "معلومات الموظف",
    systemAccess: "صلاحيات النظام",
  },
  fields: {
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني الرسمي",
    phone: "رقم الهاتف",
    skypeId: "معرف سكايب",
    accountType: "نوع الحساب",
    department: "القسم الرئيسي",
  },
  placeholders: {
    fullName: "مثال: د. سلمان الفارسي",
    email: "s.alfarsi@siraj-lms.edu",
    phone: "+966 50 000 0000",
    skypeId: "live:.cid.987654321",
    department: "اختر القسم",
  },
  options: {
    accountType: {
      manager: "مدير",
      admin: "مسؤول",
    },
    accountTypeDescriptions: {
      manager: "يتمتع المديرون بإشراف على المناهج والمعلمين مع وصول مالي محدود.",
      admin: "يتمتع المسؤولون بتحكم كامل في النظام، بما في ذلك الإدارة المالية والإعدادات العامة.",
    },
    department: {
      academic: "الشؤون الأكاديمية",
      operations: "عمليات الطلاب",
      humanResources: "الموارد البشرية",
      itSupport: "دعم تقنية المعلومات",
    },
  },
  actions: {
    signup: "تسجيل",
    processing: "جاري المعالجة...",
    cancel: "إلغاء",
    successMessage: "تم تقديم طلب الحساب بنجاح. في انتظار التحقق من المسؤول الرئيسي.",
  },
  metrics: {
    activeStaff: "الموظفون النشطون",
    pendingApproval: "بانتظار الموافقة",
    avgOnboarding: "متوسط الانضمام",
  },
  validation: {
    fullNameRequired: "الاسم الكامل مطلوب",
    emailInvalid: "البريد الإلكتروني غير صالح",
    departmentRequired: "القسم الرئيسي مطلوب",
  },
};
