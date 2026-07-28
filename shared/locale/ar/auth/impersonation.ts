import type { AuthImpersonationLabels } from "@/shared/locale/types/auth";

export const authImpersonationAr: AuthImpersonationLabels = {
  bannerLoggedInAs: name => `أنت مسجل الدخول باسم ${name}.`,
  returnToNormalLogin: "العودة إلى تسجيل الدخول العادي",
  bannerViewingAs: (name, email) => `أنت تعرض لوحة التحكم باسم ${name} (${email})`,
  exit: "إنهاء العرض",
  loginAs: "تسجيل الدخول باسم",
  administration: "الإدارة",
  actorIdentity: name => `المسؤول: ${name}`,
  viewAsUser: "تسجيل الدخول باسم",
  confirmTitle: name => `تسجيل الدخول باسم ${name}؟`,
  confirmMessage: "ستتصفح الموقع كهذا المستخدم. جلسة المسؤول تبقى نشطة في الخلفية.",
  reasonLabel: "السبب (اختياري)",
  reasonPlaceholder: "تذكرة دعم، تصحيح خطأ، إلخ.",
  confirm: "تسجيل الدخول باسم",
  cancel: "إلغاء",
};
