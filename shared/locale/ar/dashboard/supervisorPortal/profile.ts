import type { SupervisorPortalProfileLabels } from "@/shared/locale/types/dashboard/supervisorPortal/profile";

export const dashboardSupervisorPortalProfileAr: SupervisorPortalProfileLabels = {
  pageTitle: "الملف الشخصي",
  pageSubtitle: "اعرض بيانات حسابك ومعلومات الاتصال.",
  notSet: "غير محدد",
  loadingMessage: "جارٍ التحميل...",
  sections: {
    account: "معلومات الحساب",
    contact: "معلومات الاتصال",
    role: "معلومات الدور",
  },
  fields: {
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    roleName: "الدور",
    status: "حالة الحساب",
  },
  errors: {
    failedToLoad: "فشل تحميل الملف الشخصي.",
    notFound: "الملف الشخصي غير موجود.",
  },
  adminResetPassword: {
    title: "إعادة تعيين كلمة المرور",
    description: (userName, userEmail) => `إعادة تعيين كلمة المرور لـ ${userName} (${userEmail})`,
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    showPassword: "إظهار كلمة المرور",
    hidePassword: "إخفاء كلمة المرور",
    sendEmail: "إرسال بريد إلكتروني",
    sendEmailLabel: "إرسال تعليمات إعادة التعيين عبر البريد الإلكتروني",
    resetButton: "إعادة تعيين كلمة المرور",
    resettingButton: "جارٍ إعادة التعيين...",
    cancelButton: "إلغاء",
    success: "تم إعادة تعيين كلمة المرور بنجاح.",
    error: "فشل إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.",
    passwordRequired: "كلمة المرور مطلوبة.",
    passwordMinLength: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
    passwordsDoNotMatch: "كلمات المرور غير متطابقة.",
    accountStatus: "حالة الحساب",
    statusActivated: "مفعّل",
    statusDeactivated: "معطّل",
    cannotResetOwnPasswordViaAdmin:
      "لا يمكنك إعادة تعيين كلمة مرورك الخاصة عبر المسار الإداري. استخدم خيار تغيير كلمة المرور بدلاً من ذلك.",
  },
  actions: {
    manageLifecycle: "إدارة دورة حياة الحساب",
  },
};
